# dTelecom React components

Build a web call on dTelecom Cloud with `LiveKitRoom` and `VideoConference`, or use the participant, track and layout hooks to create your own interface. This is dTelecom’s fork of LiveKit Components. It is distributed under the [Apache 2.0 license](./LICENSE).

[![React consumer CI](https://github.com/dTelecom/components-js/actions/workflows/consumer.yml/badge.svg?branch=dtelecom)](https://github.com/dTelecom/components-js/actions/workflows/consumer.yml)

## Make your first call

The [runnable React example](./examples/first-call/README.md) includes a token endpoint and a conference page. Open it in two tabs to test audio and video with two participants.

To add the UI to an existing React app, install the browser packages together.

```sh
npm install @dtelecom/components-react @dtelecom/components-styles @dtelecom/livekit-client
```

On your backend, call `new CloudClient().createToken({ room, identity })` from `@dtelecom/server-sdk-js` for each participant and return its `token`, `wsUrl` and ranked `fallbackUrls` to that participant. Give each participant in the room a distinct identity. Keep the project key and secret on the server. See the [working token endpoint](./examples/first-call/pages/api/join.js).

```jsx
import '@dtelecom/components-styles';
import { LiveKitRoom, VideoConference } from '@dtelecom/components-react';

export function Call({ token, wsUrl, fallbackUrls }) {
  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} connectOptions={{ fallbackUrls }} connect audio video
      data-lk-theme="default" style={{ height: '100dvh' }}>
      <VideoConference />
    </LiveKitRoom>
  );
}
```

The [React conference guide](https://docs.dtelecom.org/guides/video-conference-react/) covers using these components in your app. [dTelecom Meet](https://github.com/dTelecom/dtelecom-meet) shows a full application.

## Packages and development

- [React](./packages/react) publishes the components and hooks.
- [Styles](./packages/styles) publishes the theme imported above.
- [Core](./packages/core) provides the shared state used by the React components.

Use `yarn install --frozen-lockfile` and `yarn build:react` from the repository root to build the components and their workspace dependencies. The [original Next.js gallery](./examples/nextjs) is retained as an upstream layout reference.

### Check a release candidate

The **Consumer** workflow on `dtelecom` builds and packs the core, React and styles packages, runs their unit tests, then installs all three tarballs in a separate copy of the [first-call app](./examples/first-call). Pushes and pull requests exercise the production build and load the browser SDK in Chromium.

To run the consumer locally, use Node 22.14.0 and Yarn 1.22.22. From the repository root run

```sh
yarn install --frozen-lockfile
yarn build:react
work=$(mktemp -d)
for part in core react styles; do
  npm pack "./packages/$part" --pack-destination "$work" --silent
done
./tooling/consumer/prepare.sh "$work/app" "$work"/*.tgz
cd "$work/app"
npx playwright install --only-shell chromium
node check.mjs smoke
```

With test project credentials in a server-side env file, run `node --env-file=/path/to/test.env check.mjs live`. In GitHub Actions, dispatch **Consumer** on `dtelecom` to run the same check with the `sdk-live-tests` environment. It makes one browser join through a ranked alternate after its primary is unavailable, verifies audio, video and chat in both directions, forces one SDK to reconnect, checks new media and messages after recovery, and verifies both participants leave.
