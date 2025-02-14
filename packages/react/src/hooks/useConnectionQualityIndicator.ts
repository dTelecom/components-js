import { setupConnectionQualityIndicator } from '@dtelecom/components-core';
import type { Participant } from '@dtelecom/livekit-client';
import { ConnectionQuality } from '@dtelecom/livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
import { useObservableState } from './internal';

/** @public */
export interface ConnectionQualityIndicatorOptions {
  participant?: Participant;
}

/** @public */
export function useConnectionQualityIndicator(options: ConnectionQualityIndicatorOptions = {}) {
  const p = useEnsureParticipant(options.participant);

  const { className, connectionQualityObserver } = React.useMemo(
    () => setupConnectionQualityIndicator(p),
    [p],
  );

  const quality = useObservableState(connectionQualityObserver, ConnectionQuality.Unknown);

  return { className, quality };
}
