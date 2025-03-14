import type { WidgetState } from '@dtelecom/components-core';
import type * as React from 'react';

/** @internal */
export type ChatContextAction =
  | { msg: 'show_chat' }
  | { msg: 'hide_chat' }
  | { msg: 'toggle_chat' }
  | { msg: 'unread_msg'; count: number }
  | { msg: 'unread_transcription'; count: number };

/** @internal */
export type ChatContextType = {
  dispatch?: React.Dispatch<ChatContextAction>;
  state?: WidgetState;
};

/** @internal */
export function chatReducer(state: WidgetState, action: ChatContextAction): WidgetState {
  if (action.msg === 'show_chat') {
    return { ...state, showChat: true, unreadMessages: 0, unreadTranscriptions: 0 };
  } else if (action.msg === 'hide_chat') {
    return { ...state, showChat: false };
  } else if (action.msg === 'toggle_chat') {
    const newState = { ...state, showChat: !state.showChat };
    if (newState.showChat === true) {
      newState.unreadMessages = 0;
      newState.unreadTranscriptions = 0;
    }
    return newState;
  } else if (action.msg === 'unread_msg') {
    return { ...state, unreadMessages: action.count };
  } else if (action.msg === 'unread_transcription') {
    return { ...state, unreadTranscriptions: action.count };
  } else {
    return { ...state };
  }
}
