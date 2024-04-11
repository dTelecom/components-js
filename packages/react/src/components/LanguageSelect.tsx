import { LanguageSelectIcon } from '../assets/icons';
import * as React from 'react';
import { LanguageOptions } from '../prefabs';
import { findFlagUrlByIso2Code } from 'country-flags-svg';
import clsx from 'clsx';

interface LanguageSelectProps {
  languageOptions: LanguageOptions[];
  onChange: (code: string) => void;
  value?: string;
}

export const LanguageSelect = ({ languageOptions, onChange, value }: LanguageSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggle = () => {
    setIsOpen(prev=>!prev);
  };

  const selectedLanguageName = React.useMemo(() => languageOptions.find((option) => option.code === value)?.name, [value]);

  const languageOptionsWithFlag = React.useMemo(() => {
    return languageOptions.map((option) => ({
      ...option,
      flag: findFlagUrlByIso2Code(option.flagIsoCode),
    }));
  }, [languageOptions.length]);

  return <>
    <div className="lk-language-select-wrapper">
      <div
        className={clsx("lk-language-select", isOpen && "lk-language-select-open")}
        onClick={toggle}
      >
        <LanguageSelectIcon />
        <span>{selectedLanguageName || 'Your spoken language'}</span>
      </div>

      {isOpen && (
        <div className="lk-list-wrapper">
          <div className="lk-language-list">
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
