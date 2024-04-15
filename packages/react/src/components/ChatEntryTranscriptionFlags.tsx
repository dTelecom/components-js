import { findFlagUrlByIso2Code } from 'country-flags-svg';
import React from 'react';
import { ChevronRight } from '../assets/icons';
import { ReceivedChatMessage } from '@dtelecom/components-core';

interface ChatEntryTranscriptionFlagsProps {
  entry: ReceivedChatMessage;
}

export const ChatEntryTranscriptionFlags = ({ entry }: ChatEntryTranscriptionFlagsProps) => {
  const flag = React.useMemo(() => {
    if (!entry.language) return null;
    return findFlagUrlByIso2Code(entry.language === 'en' ? 'us' : entry.language);
  }, [entry.language]);

  const toFlag = React.useMemo(() => {
    if (!entry.toTranscription) return null;
    return findFlagUrlByIso2Code(entry.toTranscription === 'en' ? 'us' : entry.toTranscription);
  }, [entry.toTranscription]);

  return <div className="lk-message-flags">
    {flag && (
      <img
        src={flag}
        alt={entry.language}
      />
    )}

    {toFlag && (
      <>
        <ChevronRight />
        <img
          src={toFlag}
          alt={entry.toTranscription}
        />
      </>
    )}
  </div>;
};
