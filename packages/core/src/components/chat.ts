/* eslint-disable camelcase */
import type { Participant, Room } from '@dtelecom/livekit-client';
import { DataPacket_Kind } from '@dtelecom/livekit-client';
import { BehaviorSubject, map, scan, Subject, takeUntil } from 'rxjs';
import { DataTopic, DataTopicValues, sendMessage, setupDataMessageHandler } from '../observables/dataChannel';

export interface ChatMessage {
  timestamp: number;
  message: string;
  type?: 'text' | 'transcription';
  language?: string;
  toTranscription?: string;
}

export interface ChatTranscription {
  timestamp: number;
  transcription: string;
  language: string;
}

export interface ReceivedChatTranscription extends ChatTranscription {
  from?: Participant;
}

export interface ReceivedChatMessage extends ChatMessage {
  from?: Participant;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function setupChat(room: Room) {
  const onDestroyObservable = new Subject<void>();
  const messageSubject = new Subject<{
    payload: Uint8Array;
    topic: string | undefined;
    from: Participant | undefined;
  }>();

  /** Subscribe to all messages send over the wire. */
  const { messageObservable } = setupDataMessageHandler(room, DataTopic.CHAT);
  messageObservable.pipe(takeUntil(onDestroyObservable)).subscribe(messageSubject);

  /** Build up the message array over time. */
  const messagesObservable = messageSubject.pipe(
    map((msg) => {
      const parsedMessage = JSON.parse(decoder.decode(msg.payload)) as ChatMessage;
      const newMessage: ReceivedChatMessage = { ...parsedMessage, from: msg.from };
      return newMessage;
    }),
    scan<ReceivedChatMessage, ReceivedChatMessage[]>((acc, value) => [...acc, value], []),
    takeUntil(onDestroyObservable),
  );

  const isSending$ = new BehaviorSubject<boolean>(false);

  const send = async (message: string, type: ChatMessage['type'] = 'text') => {
    const timestamp = Date.now();
    const encodedMsg = encoder.encode(JSON.stringify({ timestamp, message, type }));
    isSending$.next(true);
    try {
      await sendMessage(room.localParticipant, encodedMsg, DataTopic.CHAT, {
        kind: DataPacket_Kind.RELIABLE,
      });
      messageSubject.next({
        payload: encodedMsg,
        topic: DataTopic.CHAT,
        from: room.localParticipant,
      });
    } finally {
      isSending$.next(false);
    }
  };

  const transcriptionSubject = new Subject<{
    payload: Uint8Array;
    topic: string | undefined;
    from: Participant | undefined;
  }>();

  const addLocalMessage = (
    message: string,
    from: Participant,
    topic: DataTopicValues,
    timestamp: number,
    type: ChatMessage['type'] = 'text',
    language?: string,
    toTranscription?: string,
  ) => {
    const encodedMsg = encoder.encode(JSON.stringify({
      timestamp: timestamp || Date.now(),
      message,
      type,
      language,
      toTranscription
    }));

    messageSubject.next({
      payload: encodedMsg,
      topic,
      from,
    });
  };

  /** Subscribe to transcription messages send over the wire. */
  const { messageObservable: transcriptionObservable } = setupDataMessageHandler(room, DataTopic.CHAT_TRANSCRIPTION);
  transcriptionObservable.pipe(takeUntil(onDestroyObservable)).subscribe(transcriptionSubject);

  /** Build up the transcription array over time. */
  const transcriptionsObservable = transcriptionSubject.pipe(
    map((msg) => {
      const parsedMessage = JSON.parse(decoder.decode(msg.payload)) as ChatTranscription;
      const newMessage: ReceivedChatTranscription = { ...parsedMessage, from: msg.from };
      return newMessage;
    }),
    scan<ReceivedChatTranscription, ReceivedChatTranscription[]>((acc, value) => [...acc, value], []),
    takeUntil(onDestroyObservable),
  );

  const sendTranscription = async (transcription: string, language: string) => {
    const timestamp = Date.now();
    const encodedMsg = encoder.encode(JSON.stringify({ timestamp, transcription, language }));
    isSending$.next(true);
    try {
      await sendMessage(room.localParticipant, encodedMsg, DataTopic.CHAT_TRANSCRIPTION, {
        kind: DataPacket_Kind.RELIABLE,
      });
      transcriptionSubject.next({
        payload: encodedMsg,
        topic: DataTopic.CHAT_TRANSCRIPTION,
        from: room.localParticipant,
      });
    } finally {
      isSending$.next(false);
    }
  };

  function destroy() {
    onDestroyObservable.next();
    onDestroyObservable.complete();
  }

  return {
    messageObservable: messagesObservable,
    transcriptionObservable: transcriptionsObservable,
    isSendingObservable: isSending$,
    send,
    sendTranscription,
    addLocalMessage,
    destroy,
  };
}
