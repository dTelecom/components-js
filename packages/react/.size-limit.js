module.exports = [
  {
    name: 'LiveKitRoom only',
    path: 'dist/index.mjs',
    import: '{ LiveKitRoom }',
    limit: '4 kB',
    ignore: ['@dtelecom/livekit-client', 'react', 'react-dom', 'loglevel'],
  },
  {
    name: 'LiveKitRoom with VideoConference',
    path: 'dist/index.mjs',
    import: '{ LiveKitRoom, VideoConference }',
    limit: '40 kB',
    ignore: ['@dtelecom/livekit-client', 'react', 'react-dom', 'loglevel'],
  },
  {
    name: 'All exports',
    path: 'dist/index.mjs',
    import: '*',
    limit: '100 kB',
    ignore: ['@dtelecom/livekit-client', 'react', 'react-dom', 'loglevel'],
  },
];
