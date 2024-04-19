import * as React from 'react';
import { mergeProps as mergePropsReactAria } from './mergeProps';
import { LanguageOptions } from './prefabs';

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

export function getFlagIso2CodeByLanguage(language: string, languageOptions: LanguageOptions[] = []) {
  const languageOption = languageOptions.find((option) => option.code === language);
  return languageOption?.flagIsoCode || '';
}
