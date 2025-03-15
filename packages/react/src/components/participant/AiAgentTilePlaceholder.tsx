import { ParticipantPlaceholder } from '../../assets/images';
import * as React from 'react';

export const AiAgentTilePlaceholder = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <div
      style={{ position: "relative" }}
      className={"lk-participant-tile"}
    >
      <>
        <video
          ref={videoRef}
          src={"/video/aiAgent.mp4"}
          playsInline
          muted
          loop
          controls={false}
          className="lk-participant-media-video"
        />

        <div className="lk-participant-placeholder">
          <ParticipantPlaceholder />
        </div>

        <div className="lk-participant-metadata">
          <div className="lk-participant-metadata-item">
            <span className="lk-participant-name">AI Agent</span>
          </div>
        </div>
      </>
    </div>
  );
};
