import { createContext, use } from 'react'

import type { Language } from '../api/types'
import { dictionaries, type Dictionary } from './strings'

export const I18nContext = createContext<{ lang: Language; t: Dictionary }>({
  lang: 'uk',
  t: dictionaries.uk,
})

export function useI18n() {
  return use(I18nContext)
}
