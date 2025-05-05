import { LanguageSelectIcon } from '../assets/icons';
import * as React from 'react';
import { LanguageOptions } from '../prefabs';
import { findFlagUrlByIso2Code } from 'country-flags-svg';
import clsx from 'clsx';

interface LanguageSelectProps {
  languageOptions: LanguageOptions[];
  onChange: (code: string | undefined) => void;
  value?: string;
  defaultLanguageCode?: string;
}

export const LanguageSelect = ({ languageOptions, onChange, value, defaultLanguageCode }: LanguageSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [enabled, setEnabled] = React.useState(!!defaultLanguageCode);
  const toggle = () => {
    setIsOpen(prev => !prev);
  };

  const selectedLanguageName = React.useMemo(() => languageOptions.find((option) => option.code === value)?.name, [value]);

  const languageOptionsWithFlag = React.useMemo(() => {
    return languageOptions.map((option) => ({
      ...option,
      flag: findFlagUrlByIso2Code(option.flagIsoCode),
    }));
  }, [languageOptions.length]);

  return <>
    <div className="lk-language-select-switch">
      <span className="lk-language-select-switch-label">AI Voice Translator</span>

      <div className="lk-language-select-switch-buttons-container">
        <button
          onClick={(e) => {
            e.preventDefault();
            onChange(defaultLanguageCode || "en");
            setEnabled(true);
          }}
          className={
            clsx("lk-language-select-switch-button",
              enabled && "lk-language-select-switch-button-active")
          }
        > Enabled
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onChange(undefined);
            setEnabled(false);
          }}
          className={
            clsx("lk-language-select-switch-button-disabled",
              !enabled && "lk-language-select-switch-button-disabled-active")
          }
        >Disabled
        </button>
      </div>
    </div>

    <div className="lk-language-select-wrapper">

      <div
        className={clsx("lk-language-select", isOpen && "lk-language-select-open", !enabled && "lk-language-select-disabled")}
        onClick={enabled ? toggle : undefined}
      >
        <LanguageSelectIcon />
        <span>{selectedLanguageName || 'Your spoken language'}</span>
      </div>

      {isOpen && (
        <div className="lk-list-wrapper">
          <div className="lk-language-list">
            <div
              className="lk-list-item"
              onClick={() => {
                onChange(undefined);
                setIsOpen(prev => !prev);
              }}
            >
              Don't select
            </div>
            {languageOptionsWithFlag.map((option) => (
              <div
                className="lk-list-item"
                key={option.code}
                onClick={() => {
                  onChange(option.code);
                  setIsOpen(prev => !prev);
                }}
              >
                <img
                  src={option.flag}
                  alt={option.name}
                />
                {option.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </>;
};
