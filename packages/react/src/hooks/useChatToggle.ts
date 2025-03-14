import { setupChatToggle } from '@dtelecom/components-core';
import { useLayoutContext } from '../context';
import { mergeProps } from '../mergeProps';
import * as React from 'react';

/** @public */
export interface UseChatToggleProps {
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

/** @public */
export function useChatToggle({ props }: UseChatToggleProps) {
  const { dispatch, state } = useLayoutContext().widget;
  const { className } = React.useMemo(() => setupChatToggle(), []);
  const unreadMessagesAndTranscriptionsCount = (state?.unreadMessages || 0) + (state?.unreadTranscriptions || 0);

  const mergedProps = React.useMemo(() => {
    return mergeProps(props, {
      className,
      onClick: () => {
        if (dispatch) dispatch({ msg: 'toggle_chat' });
      },
      'aria-pressed': state?.showChat ? 'true' : 'false',
      'data-lk-unread-msgs': unreadMessagesAndTranscriptionsCount < 10
        ? unreadMessagesAndTranscriptionsCount.toFixed(0)
        : '9+',
    });
  }, [props, className, dispatch, state]);

  return { mergedProps };
}
