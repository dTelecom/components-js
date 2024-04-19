import { findFlagUrlByIso2Code } from 'country-flags-svg';
import React from 'react';
import { ChevronRight } from '../assets/icons';
import { ReceivedChatMessage } from '@dtelecom/components-core';
import { getFlagIso2CodeByLanguage } from '../utils';
import { LanguageOptions } from '../prefabs';

interface ChatEntryTranscriptionFlagsProps {
  entry: ReceivedChatMessage;
  languageOptions?: LanguageOptions[];
}

export const ChatEntryTranscriptionFlags = ({ entry, languageOptions }: ChatEntryTranscriptionFlagsProps) => {
  const flag = React.useMemo(() => {
    if (entry.language === undefined) return null;
    const iso2Code = getFlagIso2CodeByLanguage(entry.language, languageOptions);
    return findFlagUrlByIso2Code(iso2Code);
  }, [entry.language]);

  const toFlag = React.useMemo(() => {
    if (!entry.toTranscription) return null;
    const iso2Code = getFlagIso2CodeByLanguage(entry.toTranscription, languageOptions);
    return findFlagUrlByIso2Code(iso2Code);
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
