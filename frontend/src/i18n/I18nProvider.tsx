import { useEffect, type ReactNode } from 'react'

import type { Language } from '../api/types'
import { I18nContext } from './context'
import { dictionaries } from './strings'

export function I18nProvider({ lang, children }: { lang: Language; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return <I18nContext value={{ lang, t: dictionaries[lang] }}>{children}</I18nContext>
}
