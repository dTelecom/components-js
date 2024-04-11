import * as React from 'react';
import {LayoutContextProvider} from '../components/layout/LayoutContextProvider';
import {RoomAudioRenderer} from '../components/RoomAudioRenderer';
import {ControlBar} from './ControlBar';
import {FocusLayout, FocusLayoutContainer} from '../components/layout/FocusLayout';
import {GridLayout} from '../components/layout/GridLayout';
import type { GridLayoutDefinition, TrackReferenceOrPlaceholder, WidgetState } from '@dtelecom/components-core';
import {isEqualTrackRef, isTrackReference, log} from '@dtelecom/components-core';
import { Chat, IUseChat } from './Chat';
import {ConnectionStateToast} from '../components/Toast';
import type {MessageFormatter} from '../components/ChatEntry';
import { RemoteTrackPublication, RoomEvent, Track, VideoQuality } from '@dtelecom/livekit-client';
import {useTracks} from '../hooks/useTracks';
import {usePinnedTracks} from '../hooks/usePinnedTracks';
import {CarouselLayout} from '../components/layout/CarouselLayout';
import {useCreateLayoutContext} from '../context/layout-context';
import {ParticipantTile} from '../components';

/**
 * @public
 */
export interface VideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
  onKick?: (identity: string) => void;
  onMute?: (identity: string, trackSid: string, type?: 'audio' | 'video') => void;
  isAdmin?: boolean;
  localIdentity?: string;
  gridLayouts?: GridLayoutDefinition[];
  chatContext?: IUseChat;
}


/**
 * This component is the default setup of a classic LiveKit video conferencing app.
 * It provides functionality like switching between participant grid view and focus view.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `FocusContextProvider`,
 * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <VideoConference />
 * <LiveKitRoom>
 * ```
 * @public
 */
export function VideoConference(
  {
    chatMessageFormatter,
    onKick,
    onMute,
    isAdmin,
    localIdentity,
    gridLayouts,
    chatContext,
    ...props
  }: VideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
  });

  const tracks = useTracks(
    [
      {source: Track.Source.Camera, withPlaceholder: true},
      {source: Track.Source.ScreenShare, withPlaceholder: false}
    ],
    {updateOnlyOn: [RoomEvent.ActiveSpeakersChanged]}
  );

  const widgetUpdate = (state: WidgetState) => {
    log.debug("updating widget state", state);
    setWidgetState(state);
  };

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));
  const tracksWithTrackReference = tracks.filter(isTrackReference);
  const enabledVisibleTracks = tracksWithTrackReference.filter((t) => t.publication.isEnabled && t.publication.track?.attachedElements[0])

  const pickTrackQuality = () => {
    if (focusTrack) {
      return VideoQuality.LOW;
    } else {
      if (enabledVisibleTracks.length > 6) {
        return VideoQuality.LOW;
      }
      if (enabledVisibleTracks.length > 3) {
        return VideoQuality.MEDIUM;
      }

      return VideoQuality.HIGH;
    }
  }

  React.useEffect(() => {
    // if screen share tracks are published, and no pin is set explicitly, auto set the screen share
    if (screenShareTracks.length > 0 && focusTrack === undefined) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: screenShareTracks[0] });
    } else if (
      (screenShareTracks.length === 0 && focusTrack?.source === Track.Source.ScreenShare) ||
      tracks.length <= 1
    ) {
      layoutContext.pin.dispatch?.({ msg: "clear_pin" });
    }

    updateTracksQuality();
  }, [
    JSON.stringify(screenShareTracks.map((ref) => ref.publication.trackSid)),
    JSON.stringify(enabledVisibleTracks.map((ref) => ref.publication.trackSid)),
    tracksWithTrackReference.length,
    focusTrack?.publication?.trackSid
  ]);

  const updateTracksQuality = () => {
    let tracksToUpdate: TrackReferenceOrPlaceholder[] = tracksWithTrackReference;
    if (focusTrack) {
      tracksToUpdate = carouselTracks;
      if (focusTrack.publication instanceof RemoteTrackPublication) {
        focusTrack.publication.setVideoQuality(VideoQuality.HIGH);
      }
    }

    tracksToUpdate.forEach(t => {
      if (t.publication instanceof RemoteTrackPublication) {
        const quality = pickTrackQuality();
        t.publication.setVideoQuality(quality);
      }
    });
  }

  return (
    <div className="lk-video-conference" {...props}>
      <LayoutContextProvider
        value={layoutContext}
        // onPinChange={handleFocusStateChange}
        onWidgetChange={widgetUpdate}
      >
        <div className="lk-video-conference-inner">
          {!focusTrack ? (
            <div className="lk-grid-layout-wrapper">
              <GridLayout
                tracks={tracks}
                gridLayouts={gridLayouts}
              >
                <ParticipantTile
                  onKick={onKick}
                  onMute={onMute}
                  localIdentity={localIdentity}
                />
              </GridLayout>
            </div>
          ) : (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer>
                {focusTrack && <FocusLayout track={focusTrack}/>}

                <CarouselLayout tracks={carouselTracks}>
                  <ParticipantTile
                    onKick={onKick}
                    onMute={onMute}
                    localIdentity={localIdentity}
                  />
                </CarouselLayout>
              </FocusLayoutContainer>
            </div>
          )}
          <ControlBar
            isAdmin={isAdmin}
            controls={{chat: true}}
          />
        </div>
        <Chat
          chatContext={chatContext}
          style={{display: widgetState.showChat ? "flex" : "none"}}
          messageFormatter={chatMessageFormatter}
        />
      </LayoutContextProvider>
      <RoomAudioRenderer/>
      <ConnectionStateToast/>
    </div>
  );
}
