# First React call

Join a dTelecom Cloud room with two browser tabs. You need Node.js 22.14 or later, a camera, a microphone and a [dTelecom Cloud project key and secret](https://cloud.dtelecom.org).

Copy this directory outside the monorepo to install the published packages. From the repository root, run

```sh
cp -R examples/first-call ../dtelecom-react-first-call
cd ../dtelecom-react-first-call
npm install
cp .env.example .env.local
```

Set `DTELECOM_API_KEY` and `DTELECOM_API_SECRET` in `.env.local`. Set `DTELECOM_CLOUD_URL` to the Cloud origin that issued those credentials. Start the app with `npm run dev`. Open <http://127.0.0.1:3000> in two tabs, click **Join call** in each, and allow access to the camera and microphone. Mute one tab or use headphones to avoid feedback. Each tab should show both participants. Use **Leave** to disconnect.

The [server route](./pages/api/join.js) assigns each visitor a new identity in the same room and issues a ten-minute participant token. The [React page](./pages/index.jsx) passes the returned `wsUrl` and `token` to `LiveKitRoom` and the ranked `fallbackUrls` through its `connectOptions` prop. The browser can try the next node if the primary is unavailable. The local demo accepts anonymous visitors. In a hosted application, authenticate the caller and authorize their room membership before issuing a token. Keep the Cloud credentials on the server.
