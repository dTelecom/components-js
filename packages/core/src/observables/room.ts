import type { Subscriber, Subscription } from 'rxjs';
import { map, Observable, startWith, filter, concat } from 'rxjs';
import type { Participant, TrackPublication } from '@dtelecom/livekit-client';
import { Room, RoomEvent, Track } from '@dtelecom/livekit-client';
import type { RoomEventCallbacks } from '@dtelecom/livekit-client/dist/src/room/Room';
import { log } from '../logger';
export function observeRoomEvents(room: Room, ...events: RoomEvent[]): Observable<Room> {
  const observable = new Observable<Room>((subscribe) => {
    const onRoomUpdate = () => {
      subscribe.next(room);
    };

    events.forEach((evt) => {
      room.on(evt, onRoomUpdate);
    });

    const unsubscribe = () => {
      events.forEach((evt) => {
        room.off(evt, onRoomUpdate);
      });
    };
    return unsubscribe;
  }).pipe(startWith(room));

  return observable;
}

export function roomEventSelector<T extends RoomEvent>(room: Room, event: T) {
  const observable = new Observable<Parameters<RoomEventCallbacks[T]>>((subscribe) => {
    const update = (...params: Parameters<RoomEventCallbacks[T]>) => {
      subscribe.next(params);
    };
    // @ts-ignore
    room.on(event, update);

    const unsubscribe = () => {
      // @ts-ignore
      room.off(event, update);
    };
    return unsubscribe;
  });

  return observable;
}

export function roomObserver(room: Room) {
  const observable = observeRoomEvents(
    room,
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ActiveSpeakersChanged,
    RoomEvent.TrackSubscribed,
    RoomEvent.TrackUnsubscribed,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
    RoomEvent.AudioPlaybackStatusChanged,
    RoomEvent.ConnectionStateChanged,
  ).pipe(startWith(room));

  return observable;
}

export function connectionStateObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.ConnectionStateChanged).pipe(
    map(([connectionState]) => connectionState),
    startWith(room.state),
  );
}
export type ScreenShareTrackMap = Array<{
  participant: Participant;
  tracks: Array<TrackPublication>;
}>;

export function screenShareObserver(room: Room) {
  let screenShareSubscriber: Subscriber<ScreenShareTrackMap>;
  const observers: Array<Subscription> = [];

  const observable = new Observable<ScreenShareTrackMap>((subscriber) => {
    screenShareSubscriber = subscriber;
    return () => {
      observers.forEach((observer) => {
        observer.unsubscribe();
      });
    };
  });
  const screenShareTracks: ScreenShareTrackMap = [];

  const handleSub = (publication: TrackPublication, participant: Participant) => {
    if (
      publication.source !== Track.Source.ScreenShare &&
      publication.source !== Track.Source.ScreenShareAudio
    ) {
      return;
    }
    let trackMap = screenShareTracks.find((tr) => tr.participant.identity === participant.identity);
    const getScreenShareTracks = (participant: Participant) => {
      return participant
        .getTracks()
        .filter(
          (track) =>
            (track.source === Track.Source.ScreenShare ||
              track.source === Track.Source.ScreenShareAudio) &&
            track.track,
        );
    };
    if (!trackMap) {
      trackMap = {
        participant,
        tracks: getScreenShareTracks(participant),
      };
    } else {
      const index = screenShareTracks.indexOf(trackMap);
      screenShareTracks.splice(index, 1);
      trackMap.tracks = getScreenShareTracks(participant);
    }
    if (trackMap.tracks.length > 0) {
      screenShareTracks.push(trackMap);
    }

    screenShareSubscriber.next(screenShareTracks);
  };
  observers.push(
    roomEventSelector(room, RoomEvent.TrackSubscribed).subscribe(([, ...args]) =>
      handleSub(...args),
    ),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackUnsubscribed).subscribe(([, ...args]) =>
      handleSub(...args),
    ),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.LocalTrackPublished).subscribe((args) => handleSub(...args)),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.LocalTrackUnpublished).subscribe((args) => {
      handleSub(...args);
    }),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackMuted).subscribe((args) => {
      handleSub(...args);
    }),
  );
  observers.push(
    roomEventSelector(room, RoomEvent.TrackUnmuted).subscribe((args) => {
      handleSub(...args);
    }),
  );
  setTimeout(() => {
    // TODO find way to avoid this timeout
    for (const p of room.participants.values()) {
      p.getTracks().forEach((track) => {
        handleSub(track, p);
      });
    }
  }, 1);

  return observable;
}

export function roomInfoObserver(room: Room) {
  const observer = observeRoomEvents(
    room,
    RoomEvent.RoomMetadataChanged,
    RoomEvent.ConnectionStateChanged,
  ).pipe(
    map((r) => {
      return { name: r.name, metadata: r.metadata };
    }),
  );
  return observer;
}

export function activeSpeakerObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.ActiveSpeakersChanged).pipe(
    map(([speakers]) => speakers),
  );
}

export function createMediaDeviceObserver(
  kind?: MediaDeviceKind,
  requestPermissions = true,
  onError?: (e: Error) => void,
) {
  // Initial devices fetch observable
  const initialDevices$ = new Observable<MediaDeviceInfo[]>((subscriber) => {
    Room.getLocalDevices(kind, requestPermissions)
      .then((devices) => {
        subscriber.next(devices);
        subscriber.complete();
      })
      .catch((e) => {
        onError?.(e);
        subscriber.next([] as MediaDeviceInfo[]);
        subscriber.complete();
      });
  });

  // Device change observable
  const deviceChanges$ = new Observable<MediaDeviceInfo[]>((subscriber) => {
    const onDeviceChange = async () => {
      try {
        const newDevices = await Room.getLocalDevices(kind, requestPermissions);
        subscriber.next(newDevices);
      } catch (e: any) {
        onError?.(e);
      }
    };

    if (typeof window !== 'undefined') {
      if (!window.isSecureContext) {
        throw new Error(
          `Accessing media devices is available only in secure contexts (HTTPS and localhost), in some or all supporting browsers. See: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices`,
        );
      }
      navigator?.mediaDevices?.addEventListener('devicechange', onDeviceChange);
    }

    // Return unsubscribe function that cleans up when the observable is unsubscribed
    return () => {
      navigator?.mediaDevices?.removeEventListener('devicechange', onDeviceChange);
    };
  });

  // Combine both observables
  return concat(initialDevices$, deviceChanges$);
}

export function createDataObserver(room: Room) {
  return roomEventSelector(room, RoomEvent.DataReceived);
}

export function roomAudioPlaybackAllowedObservable(room: Room) {
  const observable = observeRoomEvents(room, RoomEvent.AudioPlaybackStatusChanged).pipe(
    map((room) => {
      return { canPlayAudio: room.canPlaybackAudio };
    }),
  );
  return observable;
}

export function createActiveDeviceObservable(room: Room, kind: MediaDeviceKind) {
  return roomEventSelector(room, RoomEvent.ActiveDeviceChanged).pipe(
    filter(([kindOfDevice]) => kindOfDevice === kind),
    map(([kind, deviceId]) => {
      log.debug('activeDeviceObservable | RoomEvent.ActiveDeviceChanged', { kind, deviceId });
      return deviceId;
    }),
    startWith(room.getActiveDevice(kind)),
  );
}
