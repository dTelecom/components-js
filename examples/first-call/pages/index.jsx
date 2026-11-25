import { useState } from 'react';
import { LiveKitRoom, VideoConference } from '@dtelecom/components-react';

export default function FirstCall({ children }) {
  const [session, setSession] = useState(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function join() {
    setError('');
    setJoining(true);
    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error('Could not get a room token. Check the server credentials.');
      setSession(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  return (
    <main>
      {error && <p role="alert">{error}</p>}
      {session ? (
        <LiveKitRoom
          serverUrl={session.wsUrl}
          token={session.token}
          connect
          audio
          video
          data-lk-theme="default"
          style={{ height: '100dvh' }}
          onDisconnected={() => setSession(null)}
          onError={(err) => setError(err.message)}
        >
          <VideoConference />
          {children}
        </LiveKitRoom>
      ) : (
        <button onClick={join} disabled={joining}>{joining ? 'Joining…' : 'Join call'}</button>
      )}
    </main>
  );
}
