# dTelecom React components

`@dtelecom/components-react` is a ready call UI for [dTelecom Cloud](https://cloud.dtelecom.org) rooms:
participant grid, control bar, screen share and chat, plus the smaller components and hooks to build
your own layout. It is dTelecom's build of LiveKit Components with components such as `LiveKitRoom`,
`VideoConference` and `useTracks`.

**Documentation:** [Video conference with React](https://docs.dtelecom.org/guides/video-conference-react/)
on [docs.dtelecom.org](https://docs.dtelecom.org).

Run the [two-participant React example](https://github.com/dTelecom/components-js/tree/dtelecom/examples/first-call) for a complete browser and backend implementation.

## Install

```bash
npm install @dtelecom/components-react @dtelecom/components-styles @dtelecom/livekit-client
```

## Usage

```tsx
import '@dtelecom/components-styles';
import { LiveKitRoom, VideoConference } from '@dtelecom/components-react';

// token and wsUrl come from your backend (createToken in @dtelecom/server-sdk-js).
<LiveKitRoom token={token} serverUrl={wsUrl} connect={true} audio={true} video={true} data-lk-theme="default">
  <VideoConference />
</LiveKitRoom>;
```

Create tokens on your server; never put the API key or secret in browser code.
