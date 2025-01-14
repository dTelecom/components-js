import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Participant, TrackPublication } from '@dtelecom/livekit-client';
import { Track } from '@dtelecom/livekit-client';
import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@dtelecom/components-core';
import { isParticipantSourcePinned } from '@dtelecom/components-core';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { ParticipantName } from './ParticipantName';
import { TrackMutedIndicator } from './TrackMutedIndicator';
import {
  ParticipantContext,
  useEnsureParticipant,
  useMaybeLayoutContext,
  useMaybeParticipantContext,
  useMaybeTrackContext,
} from '../../context';
import { FocusToggle } from '../controls/FocusToggle';
import { ParticipantPlaceholder } from '../../assets/images';
import { ScreenShareIcon } from '../../assets/icons';
import { VideoTrack } from './VideoTrack';
import { AudioTrack } from './AudioTrack';
import { useParticipantTile } from '../../hooks';
import ButtonWithToolTip from '../controls/ButtonWithToolTip';
import LeaveIcon from '../../assets/images/LeaveIcon';
import MicIcon from '../../assets/images/MicIcon';
import CamIcon from '../../assets/images/CamIcon';

/** @public */
export function ParticipantContextIfNeeded(
  props: React.PropsWithChildren<{
    participant?: Participant;
  }>,
) {
  const hasContext = !!useMaybeParticipantContext();
  return props.participant && !hasContext ? (
    <ParticipantContext.Provider value={props.participant}>
      {props.children}
    </ParticipantContext.Provider>
  ) : (
    <>{props.children}</>
  );
}

/** @public */
export type ParticipantTileProps = React.HTMLAttributes<HTMLDivElement> & {
  disableSpeakingIndicator?: boolean;
  participant?: Participant;
  source?: Track.Source;
  publication?: TrackPublication;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
  onKick?: (identity: string) => void;
  onMute?: (identity: string, trackSid: string, type?: 'audio' | 'video') => void;
  localIdentity?: string;
};

/**
 * The ParticipantTile component is the base utility wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `TrackLoop` component or by spreading a track reference as properties.
 *
 * @example
 * ```tsx
 * <ParticipantTile source={Track.Source.Camera} />
 *
 * <ParticipantTile {...trackReference} />
 * ```
 * @public
 */
export const ParticipantTile = ({
                                  participant,
                                  children,
                                  source = Track.Source.Camera,
                                  onParticipantClick,
                                  publication,
                                  disableSpeakingIndicator,
                                  onMute,
                                  onKick,
                                  localIdentity,
                                  ...htmlProps
                                }: ParticipantTileProps) => {
  const p = useEnsureParticipant(participant);
  const trackRef: TrackReferenceOrPlaceholder = useMaybeTrackContext() ?? {
    participant: p,
    source,
    publication
  };
  const [bitrate, setBitrate] = useState<number>();
  const [focused, setFocused] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const removeFocus = () => {
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        setFocused(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let total = 0;

      [...p.videoTracks.values()].forEach((pub) => {
        if (pub.track?.currentBitrate) {
          total += pub.track.currentBitrate;
        }
      });
      setBitrate(total);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const { elementProps } = useParticipantTile<HTMLDivElement>({
    participant: trackRef.participant,
    htmlProps,
    source: trackRef.source,
    publication: trackRef.publication,
    disableSpeakingIndicator,
    onParticipantClick
  });

  const layoutContext = useMaybeLayoutContext();

  const handleSubscribe = React.useCallback(
    (subscribed: boolean) => {
      if (
        trackRef.source &&
        !subscribed &&
        layoutContext &&
        layoutContext.pin.dispatch &&
        isParticipantSourcePinned(trackRef.participant, trackRef.source, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: "clear_pin" });
      }
    },
    [trackRef.participant, layoutContext, trackRef.source]
  );

  const audioTrack = trackRef.participant.getTrack(Track.Source.Microphone);
  const videoTrack = trackRef.participant.getTrack(Track.Source.Camera);
  const localUser = trackRef.participant.identity === localIdentity;

  return (
    <div
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => setFocused(false)}
      style={{ position: "relative" }}
      {...elementProps}
      onClick={(e) => {
        if (elementProps.onClick) {
          elementProps.onClick(e);
        }
        setFocused(true);
        removeFocus();
      }}
      className={elementProps.className + (focused ? ' lk-focused' : '')}
    >
      <ParticipantContextIfNeeded participant={trackRef.participant}>
        {children ?? (
          <>
            {trackRef.publication?.kind === "video" ||
            trackRef.source === Track.Source.Camera ||
            trackRef.source === Track.Source.ScreenShare ? (
              <VideoTrack
                participant={trackRef.participant}
                source={trackRef.source}
                publication={trackRef.publication}
                onSubscriptionStatusChanged={handleSubscribe}
              />
            ) : (
              <AudioTrack
                participant={trackRef.participant}
                source={trackRef.source}
                publication={trackRef.publication}
                onSubscriptionStatusChanged={handleSubscribe}
              />
            )}
            <div className="lk-participant-placeholder">
              <ParticipantPlaceholder />
            </div>
            <div className="lk-participant-metadata">
              <div className="lk-participant-metadata-item">
                {trackRef.source === Track.Source.Camera ? (
                  <>
                    <TrackMutedIndicator
                      source={Track.Source.Microphone}
                      show={"muted"}
                    ></TrackMutedIndicator>
                    <ParticipantName />
                  </>
                ) : (
                  <>
                    <ScreenShareIcon style={{ marginRight: "0.25rem" }} />
                    <ParticipantName>&apos;s screen</ParticipantName>
                  </>
                )}
              </div>

              <ConnectionQualityIndicator className="lk-participant-metadata-item" />
            </div>
          </>
        )}

        <div
          style={{
            position: "absolute",
            top: "0.25rem",
            right: "calc(26px + 0.25rem + 0.5rem)",
            height: "26px",
            display: "flex",
            gap: "0.5rem",
            zIndex: "1"
          }}
        >
          {!localUser && onKick && (
            <ButtonWithToolTip
              onClick={() => onKick(trackRef.participant.identity)}
              icon={<LeaveIcon />}
              text={"Kick from Room"}
            />
          )}

          {!localUser && audioTrack && !audioTrack.isMuted && onMute && (
            <ButtonWithToolTip
              onClick={() => onMute(trackRef.participant.identity, audioTrack.trackSid)}
              icon={<MicIcon />}
              text={"Mute Audio"}
            />
          )}

          {!localUser && videoTrack && !videoTrack.isMuted && onMute && (
            <ButtonWithToolTip
              onClick={() => onMute(trackRef.participant.identity, videoTrack.trackSid)}
              icon={<CamIcon />}
              text={"Disable Video"}
            />
          )}

          {process.env.NODE_ENV === 'development' && bitrate !== undefined && (
            <div>{Math.round(bitrate / 1024)} kbps</div>
          )}
        </div>
        <FocusToggle trackSource={trackRef.source} />

      </ParticipantContextIfNeeded>
    </div>
  );
};
