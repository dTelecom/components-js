import type { ChatMessage, ReceivedChatMessage } from '@dtelecom/components-core';
import { setupChat } from '@dtelecom/components-core';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { useMaybeLayoutContext, useRoomContext } from '../context';
import { useObservableState } from '../hooks/internal/useObservableState';
import { cloneSingleChild } from '../utils';
import type { MessageFormatter } from '../components/ChatEntry';
import { ChatEntry } from '../components/ChatEntry';

export type { ChatMessage, ReceivedChatMessage };

/** @public */
export interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messageFormatter?: MessageFormatter;
  chatContext?: IUseChat;
}

export interface IUseChat {
  send?: (message: string) => Promise<void>;
  chatMessages: ReceivedChatMessage[];
  isSending: boolean;
}

/** @public */
export function useChat(): IUseChat {
  const room = useRoomContext();
  const [setup, setSetup] = React.useState<ReturnType<typeof setupChat>>();
  const isSending = useObservableState(setup?.isSendingObservable, false);
  const chatMessages = useObservableState(setup?.messageObservable, []);

  React.useEffect(() => {
    const setupChatReturn = setupChat(room);
    setSetup(setupChatReturn);
    return setupChatReturn.destroy;
  }, [room]);

  return { send: setup?.send, chatMessages, isSending };
}

/**
 * The Chat component adds a basis chat functionality to the LiveKit room. The messages are distributed to all participants
 * in the room. Only users who are in the room at the time of dispatch will receive the message.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <Chat />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function Chat({ messageFormatter, chatContext, ...props }: ChatProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ulRef = React.useRef<HTMLUListElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { send, chatMessages, isSending } = chatContext || useChat();
  const layoutContext = useMaybeLayoutContext();
  const lastReadMsgAt = React.useRef<ChatMessage['timestamp']>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (inputRef.current && inputRef.current.value.trim() !== '') {
      if (send) {
        await send(inputRef.current.value);
        inputRef.current.value = '';
        inputRef.current.focus();
      }
    }
  }

  React.useEffect(() => {
    if (ulRef) {
      ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
    }
  }, [ulRef, chatMessages]);

  React.useEffect(() => {
    if (!layoutContext || chatMessages.length === 0) {
      return;
    }

    if (
      layoutContext.widget.state?.showChat &&
      chatMessages.length > 0 &&
      lastReadMsgAt.current !== chatMessages[chatMessages.length - 1]?.timestamp
    ) {
      lastReadMsgAt.current = chatMessages[chatMessages.length - 1]?.timestamp;
      return;
    }

    const unreadMessageCount = chatMessages.filter(
      (msg) => !lastReadMsgAt.current || msg.timestamp > lastReadMsgAt.current,
    ).length;

    const { widget } = layoutContext;
    if (unreadMessageCount > 0 && widget.state?.unreadMessages !== unreadMessageCount) {
      widget.dispatch?.({ msg: 'unread_msg', count: unreadMessageCount });
    }
  }, [chatMessages, layoutContext?.widget]);

  return (
    <div {...props} className="lk-chat">
      <div className="lk-chat-wrapper">
        <ul
          className="lk-list lk-chat-messages"
          ref={ulRef}
        >
          {props.children
            ? chatMessages.map((msg, idx) =>
              cloneSingleChild(props.children, {
                entry: msg,
                key: idx,
                messageFormatter,
              }),
            )
            : chatMessages.map((msg, idx, allMsg) => {
              const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from;
              // If the time delta between two messages is bigger than 60s show timestamp.
              const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000;

              return (
                <ChatEntry
                  key={idx}
                  hideName={hideName}
                  hideTimestamp={hideName === false ? false : hideTimestamp} // If we show the name always show the timestamp as well.
                  entry={msg}
                  messageFormatter={messageFormatter}
                />
              );
            })}
          <div ref={messagesEndRef} />
        </ul>
      </div>
      <form
        className="lk-chat-form"
        onSubmit={handleSubmit}
      >
        <input
          className="lk-form-control lk-chat-form-input"
          disabled={isSending}
          ref={inputRef}
          type="text"
          placeholder="Enter a message..."
        />
        <button
          type="submit"
          className="lk-button lk-chat-form-button"
          disabled={isSending}
        >
          Send
        </button>
      </form>
    </div>
  );
}
