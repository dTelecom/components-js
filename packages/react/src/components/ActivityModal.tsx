import { Track } from '@dtelecom/livekit-client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRoomContext } from '../context';
import { useTrackToggle } from '../hooks';

const MODAL_TIMEOUT_DELAY = 5 * 60 * 1000;
const LEAVE_TIMEOUT_DELAY_SEC = 60;

export function ActivityModal() {
  const room = useRoomContext();
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = React.useState<number>();

  React.useEffect(() => {
    if (!timeLeft) return;

    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const { enabled: cameraEnabled } = useTrackToggle({ source: Track.Source.Camera });
  const { enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone });
  const { enabled: screenShareEnabled } = useTrackToggle({ source: Track.Source.ScreenShare });

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const clearTimers = () => {
    setTimeLeft(undefined);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const startTimer = () => {
    timerRef.current = setTimeout(() => {
      setIsModalVisible(true);
      setTimeLeft(60);
      leaveTimeoutRef.current = setTimeout(() => {
        onLeaveClick();
      }, LEAVE_TIMEOUT_DELAY_SEC * 1000);
    }, MODAL_TIMEOUT_DELAY);
  };

  const onLeaveClick = () => {
    void room.disconnect();
    setIsModalVisible(false);
    clearTimers();
  };

  const onStayClick = () => {
    setIsModalVisible(false);
    clearTimers();
    if (!cameraEnabled && !micEnabled && !screenShareEnabled) {
      startTimer();
    }
  };

  React.useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  React.useEffect(() => {
    if (!cameraEnabled && !micEnabled && !screenShareEnabled) {
      startTimer();
    } else {
      setIsModalVisible(false);
      clearTimers();
    }
  }, [cameraEnabled, micEnabled, screenShareEnabled]);

  if (!isModalVisible) {
    return null;
  }

  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  const modal = (
    <div className="lk-activity-modal-overlay">
      <div className="lk-activity-modal">
        <h2>Are you still there?</h2>
        <h6>There is no activity in a meeting room</h6>

        <div className="lk-activity-modal-countdown">
          <svg
            className="lk-countdown-svg"
            width="140"
            height="140"
            viewBox="0 0 140 140"
          >
            <circle
              className="lk-countdown-circle-bg"
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="2"
            ></circle>
            <circle
              className="lk-countdown-circle-progress"
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (timeLeft! / LEAVE_TIMEOUT_DELAY_SEC) * circumference}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            ></circle>
          </svg>

          <div className="lk-activity-modal-countdown-inner">
            <span className="lk-activity-modal-countdown-inner-title">
              {timeLeft ? timeLeft : 0}
            </span>
            <span className="lk-activity-modal-countdown-inner-text">
              seconds
            </span>
          </div>
        </div>

        <div className="lk-activity-modal-buttons-container">
          <button
            className="lk-activity-modal-button-leave"
            onClick={onLeaveClick}
          >Leave now
          </button>
          <button
            className="lk-activity-modal-button-stay"
            onClick={onStayClick}
          >Stay in the meet
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>{createPortal(modal, document.querySelector('body')!)}</>
  );
}
