import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const mode = process.argv[2];
assert.ok(['smoke', 'live'].includes(mode), 'Usage: node check.mjs smoke|live');
if (mode === 'live') {
  for (const name of ['DTELECOM_API_KEY', 'DTELECOM_API_SECRET', 'DTELECOM_CLOUD_URL']) {
    assert.ok(process.env[name], 'Missing test environment variable ' + name);
  }
}
const base = 'http://127.0.0.1:37177';
const directory = await mkdtemp(join(tmpdir(), 'dtelecom-consumer-'));

// Chromium's generated microphone can be silent. Supply a PCM test tone so receiving audio is measurable.
const wav = Buffer.alloc(44 + 2 * 48000);
wav.write('RIFF');
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); // PCM
wav.writeUInt16LE(1, 22); // mono
wav.writeUInt32LE(48000, 24);
wav.writeUInt32LE(96000, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(wav.length - 44, 40);
for (let i = 0; i < 48000; i++) {
  wav.writeInt16LE(Math.round(3000 * Math.sin(2 * Math.PI * 510 * i / 48000)), 44 + 2 * i);
}
const tone = join(directory, 'tone.wav');
await writeFile(tone, wav);
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '37177'], { stdio: 'ignore' });
let browser;
let phase = 'start browser consumer';

async function waitForMedia(page) {
  await page.waitForFunction(() => window.callProbe?.remoteCount === 1 && document.querySelectorAll('video').length === 2);
  // Take the baseline after initial join or reconnect; accumulated pre-interruption RTP cannot satisfy the assertion.
  const before = await page.evaluate(() => window.callProbe.media());
  await page.waitForFunction(async (initial) => {
    const latest = await window.callProbe.media();
    return latest.audioEnergy > initial.audioEnergy && latest.videoFrames >= initial.videoFrames + 3;
  }, before, { timeout: 45000 });
}

async function exchangeChat(pages) {
  for (const [i, sender] of pages.entries()) {
    const input = sender.getByPlaceholder('Enter a message...');
    if (!(await input.isVisible())) await sender.getByRole('button', { name: 'Chat', exact: true }).click();
    const recipient = pages[1-i];
    if (!(await recipient.getByPlaceholder('Enter a message...').isVisible())) {
      await recipient.getByRole('button', { name: 'Chat', exact: true }).click();
    }
    const message = 'Call test ' + randomUUID();
    await input.fill(message);
    await sender.getByRole('button', { name: 'Send', exact: true }).click();
    await recipient.getByText(message, { exact: true }).waitFor();
  }
}

try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error('The local consumer server exited during startup');
    if ((await fetch(base).catch(() => undefined))?.ok) break;
    await delay(200);
  }
  const browserEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith('DTELECOM_')),
  );
  browser = await chromium.launch({ env: browserEnvironment, args: [
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
    '--use-file-for-fake-audio-capture=' + tone, '--autoplay-policy=no-user-gesture-required',
    '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
  ] });
  console.log('Chromium', browser.version());
  const pages = [];
  for (let i = 0; i < (mode === 'live' ? 2 : 1); i++) {
    const context = await browser.newContext({ permissions: ['camera', 'microphone'], viewport: { width: 1280, height: 860 } });
    const page = await context.newPage();
    await page.goto(base + (mode === 'live' ? '/probe' : ''));
    await page.getByRole('button', { name: 'Join call' }).waitFor();
    pages.push(page);
  }
  if (mode === 'smoke') {
    await pages[0].goto(base + '/probe');
    await pages[0].waitForFunction(() => window.initialRoomState === 'disconnected');
  }
  console.log('External first-call app loaded.');
  if (mode === 'live') {
    phase = 'join and receive initial audio, video and chat';
    for (const page of pages) await page.getByRole('button', { name: 'Join call' }).click();
    await Promise.all(pages.map(waitForMedia));
    await exchangeChat(pages);
    const version = await pages[0].evaluate(() => window.callProbe.serverVersion);
    console.log('Two-way audio, video and chat passed. Server version:', /^[\w.+-]{1,80}$/.test(version ?? '') ? version : 'not advertised');
    phase = 'observe reconnect and recovered audio, video and chat';
    await pages[0].evaluate(() => window.callProbe.reconnect());
    await pages[0].waitForFunction(() => {
      const states = window.callProbe?.states ?? [];
      const interrupted = states.indexOf('reconnecting');
      return interrupted >= 0 && states.slice(interrupted + 1).includes('connected');
    });
    await Promise.all(pages.map(waitForMedia));
    await exchangeChat(pages);
    console.log('SDK full reconnect, fresh remote audio/video and two-way chat passed.');
    phase = 'leave and observe remote departure';
    await pages[0].getByRole('button', { name: 'Leave', exact: true }).click();
    await pages[0].getByRole('button', { name: 'Join call' }).waitFor();
    await pages[1].waitForFunction(() => window.callProbe?.remoteCount === 0);
    await pages[1].getByRole('button', { name: 'Leave', exact: true }).click();
    await pages[1].getByRole('button', { name: 'Join call' }).waitFor();
    console.log('Both participants left.');
  }
} catch (error) {
  // Browser errors can contain signaling URLs. Keep live credentials and participant tokens out of CI.
  if (mode !== 'live') throw error;
  console.error('Live call failed during ' + phase + ' (' + error.name + ')');
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
  await rm(directory, { recursive: true, force: true });
}
