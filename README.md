# dTelecom React components

Build a web call on dTelecom Cloud with `LiveKitRoom` and `VideoConference`, or use the participant, track and layout hooks to create your own interface. This is dTelecom’s fork of LiveKit Components. It is distributed under the [Apache 2.0 license](./LICENSE).

## Make your first call

The [runnable React example](./examples/first-call/README.md) includes a token endpoint and a conference page. Open it in two tabs to test audio and video with two participants.

To add the UI to an existing React app, install the browser packages together.

```sh
npm install @dtelecom/components-react @dtelecom/components-styles @dtelecom/livekit-client
```

On your backend, call `new CloudClient().createToken({ room, identity })` from `@dtelecom/server-sdk-js` for each participant and return its `token` and `wsUrl` to that participant. Give each participant in the room a distinct identity. Keep the project key and secret on the server. See the [working token endpoint](./examples/first-call/pages/api/join.js).

```jsx
import '@dtelecom/components-styles';
import { LiveKitRoom, VideoConference } from '@dtelecom/components-react';

export function Call({ token, wsUrl }) {
  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} connect audio video
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

Use `yarn install` and `yarn build:react` from the repository root to build the components and their workspace dependencies. The [original Next.js gallery](./examples/nextjs) is retained as an upstream layout reference.
