import React from 'react';
import { ChatMessage, WidgetState } from '@dtelecom/components-core';
import clsx from 'clsx';
import { useLayoutContext } from '../context';

interface ChatTypeSwitchProps {
  supportedChatMessageTypes: ChatMessage['type'][];
  selectedType: ChatMessage['type'];
  onTypeSelect: (type: ChatMessage['type']) => void;
}

const typeToLabel: Record<string, string> = {
  text: 'Text',
  transcription: 'Transcription',
};

const typeToStateMap: Record<string, keyof WidgetState> = {
  text: 'unreadMessages',
  transcription: 'unreadTranscriptions',
};

export const ChatTypeSwitch = ({ supportedChatMessageTypes, selectedType, onTypeSelect }: ChatTypeSwitchProps) => {
  const { state } = useLayoutContext().widget;
  const unreadCountsByType = React.useMemo(() => {
    const unreadCounts: Record<string, number> = {};
    supportedChatMessageTypes.forEach((type) => {
      if (!type || !['text', 'transcription'].includes(type)) return;
      unreadCounts[type] = type ? state?.[typeToStateMap[type]] as number : 0;
      // @ts-ignore
      unreadCounts[type] = unreadCounts[type] < 10 ? unreadCounts[type].toFixed(0) : '9+';
    });
    return unreadCounts;
  }, [state, supportedChatMessageTypes, selectedType]);

  return (
    <div
      className="lk-chat-type-switch"
    >
      {supportedChatMessageTypes.map((type) => {
        return <button
          onClick={() => onTypeSelect(type)}
          className={clsx('lk-chat-type-switch-button', selectedType === type && 'lk-chat-type-switch-button-selected')}
          key={type}
          data-lk-unread-msgs={(type && unreadCountsByType[type]) ?? 0}
        >
          {type && typeToLabel[type] ? typeToLabel[type] : type}
        </button>;
      })}
    </div>
  );
};
