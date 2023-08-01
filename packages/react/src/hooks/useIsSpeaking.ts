import { createIsSpeakingObserver } from '@dtelecom/components-core';
import type { Participant } from '@dtelecom/livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
import { useObservableState } from './internal';

/** @public */
export function useIsSpeaking(participant?: Participant) {
  const p = useEnsureParticipant(participant);
  const observable = React.useMemo(() => createIsSpeakingObserver(p), [p]);
  const isSpeaking = useObservableState(observable, p.isSpeaking);

  return isSpeaking;
}
