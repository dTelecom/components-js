import type { ChatMessage, ReceivedChatMessage } from '@dtelecom/components-core';
import { createDefaultGrammar, tokenize } from '@dtelecom/components-core';
import * as React from 'react';
import { MessageIcon, VoiceIcon } from '../assets/icons';
import { ChatEntryTranscriptionFlags } from './ChatEntryTranscriptionFlags';
import { LanguageOptions } from '../prefabs';

/** @public */
export type MessageFormatter = (message: string) => React.ReactNode;

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 * @public
 */
export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage;
  /** Hide sender name. Useful when displaying multiple consecutive chat messages from the same person. */
  hideName?: boolean;
  /** Hide message timestamp. */
  hideTimestamp?: boolean;
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter;
  type?: ChatMessage['type'];
  toTranscription?: string;
  languageOptions?: LanguageOptions[];
}

/**
 * The `ChatEntry` component holds and displays one chat message.
 *
 * @example
 * ```tsx
 * <Chat>
 *   <ChatEntry />
 * </Chat>
 * ```
 * @see `Chat`
 * @public
 */
export function ChatEntry({
  entry,
  hideName = false,
  hideTimestamp = false,
  messageFormatter,
  languageOptions,
  ...props
}: ChatEntryProps) {
  const formattedMessage = React.useMemo(() => {
    return messageFormatter ? messageFormatter(entry.message) : entry.message;
  }, [entry.message, messageFormatter]);
  const time = new Date(entry.timestamp);
  const locale = navigator ? navigator.language : 'en-US';

  return (
    <li
      className="lk-chat-entry"
      title={time.toLocaleTimeString(locale, { timeStyle: 'full' })}
      data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
      {...props}
    >
      {(!hideTimestamp || !hideName) && (
        <span className="lk-meta-data">
          {!hideName && (
            <strong className="lk-participant-name">
              {entry.from?.name ?? entry.from?.identity}
            </strong>
          )}
          {!hideTimestamp && (
            <span className="lk-timestamp">
              {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
            </span>
          )}
        </span>
      )}
      <span className="lk-message-body">{formattedMessage}</span>
      {entry.type === 'text' && (
        <span className="lk-message-type">
          <MessageIcon />Message
        </span>
      )}
      {entry.type === 'transcription' && (
        <span className="lk-message-type">
          <VoiceIcon />Voice
          <ChatEntryTranscriptionFlags languageOptions={languageOptions} entry={entry} />
        </span>
      )}
    </li>
  );
}

/** @public */
export function formatChatMessageLinks(message: string): React.ReactNode {
  return tokenize(message, createDefaultGrammar()).map((tok, i) => {
    if (typeof tok === `string`) {
      return tok;
    } else {
      const content = tok.content.toString();
      const href =
        tok.type === `url`
          ? /^http(s?):\/\//.test(content)
            ? content
            : `https://${content}`
          : `mailto:${content}`;
      return (
        <a className="lk-chat-link" key={i} href={href} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }
  });
}
