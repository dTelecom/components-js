import { randomUUID } from 'node:crypto';
import { CloudClient } from '@dtelecom/server-sdk-js';

const room = 'react-first-call-' + randomUUID();

export default async function join(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(415).end();
  }

  res.setHeader('Cache-Control', 'no-store');
  try {
    const { token, wsUrl, fallbackUrls } = await new CloudClient().createToken({
      room,
      identity: randomUUID(),
      ttl: '10m',
    });
    return res.status(200).json({ token, wsUrl, fallbackUrls });
  } catch {
    return res.status(502).json({ error: 'Cloud could not issue a participant token.' });
  }
}
