import React from 'react';
import { ChatMessage } from '@dtelecom/components-core';
import clsx from 'clsx';

interface ChatTypeSwitchProps {
  supportedChatMessageTypes: ChatMessage['type'][];
  selectedType: ChatMessage['type'];
  onTypeSelect: (type: ChatMessage['type']) => void;
}

const typeToLabel: Record<string, string> = {
  text: 'Text',
  transcription: 'Transcription',
};

export const ChatTypeSwitch = ({ supportedChatMessageTypes, selectedType, onTypeSelect }: ChatTypeSwitchProps) => {
  return (
    <div
      className="lk-chat-type-switch"
    >
      {supportedChatMessageTypes.map((type) => {
        return <button
          onClick={() => onTypeSelect(type)}
          className={clsx('lk-chat-type-switch-button', selectedType === type && 'lk-chat-type-switch-button-selected')}
          key={type}
        >
          {type && typeToLabel[type] ? typeToLabel[type] : type}
        </button>;
      })}
    </div>
  );
};
