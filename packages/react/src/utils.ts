import * as React from 'react';
import { mergeProps as mergePropsReactAria } from './mergeProps';

/** @internal */
export function isProp<U extends HTMLElement, T extends React.HTMLAttributes<U>>(
  prop: T | undefined,
): prop is T {
  return prop !== undefined;
}

/** @internal */
export function mergeProps<
  U extends HTMLElement,
  T extends Array<React.HTMLAttributes<U> | undefined>,
>(...props: T) {
  return mergePropsReactAria(...props.filter(isProp));
}

/** @internal */
export function cloneSingleChild(
  children: React.ReactNode | React.ReactNode[],
  props?: Record<string, any>,
  key?: any,
) {
  return React.Children.map(children, (child) => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if (React.isValidElement(child) && React.Children.only(children)) {
      return React.cloneElement(child, { ...props, key });
    }
    return child;
  });
}

const languageOptions = [
  { name: "Bulgarian", code: "bg", flagIsoCode: "bg" },
  { name: "Czech", code: "cs", flagIsoCode: "cz" },
  { name: "Danish", code: "da", flagIsoCode: "dk" },
  { name: "Dutch", code: "nl", flagIsoCode: "nl" },
  { name: "English", code: "en", flagIsoCode: "us" },
  { name: "Estonian", code: "et", flagIsoCode: "ee" },
  { name: "French", code: "fr", flagIsoCode: "fr" },
  { name: "German", code: "de", flagIsoCode: "de" },
  { name: "Greek", code: "el", flagIsoCode: "gr" },
  { name: "Hindi", code: "hi", flagIsoCode: "in" },
  { name: "Hungarian", code: "hu", flagIsoCode: "hu" },
  { name: "Indonesian", code: "id", flagIsoCode: "id" },
  { name: "Italian", code: "it", flagIsoCode: "it" },
  { name: "Japanese", code: "ja", flagIsoCode: "jp" },
  { name: "Korean", code: "ko", flagIsoCode: "kr" },
  { name: "Latvian", code: "lv", flagIsoCode: "lv" },
  { name: "Lithuanian", code: "lt", flagIsoCode: "lt" },
  { name: "Malay", code: "ms", flagIsoCode: "my" },
  { name: "Norwegian", code: "no", flagIsoCode: "no" },
  { name: "Polish", code: "pl", flagIsoCode: "pl" },
  { name: "Portuguese", code: "pt", flagIsoCode: "pt" },
  { name: "Romanian", code: "ro", flagIsoCode: "ro" },
  { name: "Russian", code: "ru", flagIsoCode: "ru" },
  { name: "Slovak", code: "sk", flagIsoCode: "sk" },
  { name: "Spanish", code: "es", flagIsoCode: "es" },
  { name: "Swedish", code: "sv", flagIsoCode: "se" },
  { name: "Thai", code: "th", flagIsoCode: "th" },
  { name: "Turkish", code: "tr", flagIsoCode: "tr" },
  { name: "Ukrainian", code: "uk", flagIsoCode: "ua" },
  { name: "Vietnamese", code: "vi", flagIsoCode: "vn" },
];

export function getFlagIso2CodeByLanguage(language: string) {
  const languageOption = languageOptions.find((option) => option.code === language);
  return languageOption?.flagIsoCode || '';
}
