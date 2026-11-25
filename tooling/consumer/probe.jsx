// This page is copied only into the external test app. The public sample supplies the token flow and UI.
import { useEffect } from 'react';
import { useRoomContext } from '@dtelecom/components-react';
import { Room, RoomEvent } from '@dtelecom/livekit-client';
import FirstCall from './index';

function RoomProbe() {
  const room = useRoomContext();
  useEffect(() => {
    const states = [room.state];
    const onState = (state) => states.push(state);
    room.on(RoomEvent.ConnectionStateChanged, onState);
    window.callProbe = {
      states,
      reconnect: () => room.simulateScenario('full-reconnect'),
      get remoteCount() { return room.participants.size; },
      get serverVersion() { return room.engine.latestJoinResponse?.serverVersion; },
      async media() {
        const totals = { audioEnergy: 0, videoFrames: 0 };
        for (const participant of room.participants.values()) {
          for (const publication of participant.tracks.values()) {
            const report = await publication.track?.receiver?.getStats();
            for (const stat of report?.values() ?? []) {
              if (stat.type !== 'inbound-rtp') continue;
              if (stat.kind === 'audio') totals.audioEnergy += stat.totalAudioEnergy ?? 0;
              if (stat.kind === 'video') totals.videoFrames += stat.framesDecoded ?? 0;
            }
          }
        }
        return totals;
      },
    };
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, onState);
      delete window.callProbe;
    };
  }, [room]);
  return null;
}

export default function ProbePage() {
  useEffect(() => {
    // Smoke runs have no credentials. Exercise the installed browser SDK before joining any room.
    window.initialRoomState = new Room().state;
  }, []);
  return <FirstCall><RoomProbe /></FirstCall>;
}
