import { createContext, use } from 'react'

import { DEFAULT_LANGUAGE, dictionaries, type Dictionary, type Language } from './strings'

export interface I18n {
  lang: Language
  t: Dictionary
  /** Prefixes a site path with the current language: `href('/products')` → `/uk/products`. */
  href: (path: string) => string
}

export function makeI18n(lang: Language): I18n {
  return {
    lang,
    t: dictionaries[lang],
    href: (path: string) => `/${lang}${path === '/' ? '' : path}`,
  }
}

export const I18nContext = createContext<I18n>(makeI18n(DEFAULT_LANGUAGE))

export function useI18n(): I18n {
  return use(I18nContext)
}
