import { Navigate, Outlet, useLocation, useParams } from 'react-router'

import { I18nContext, makeI18n } from '../../i18n/context'
import { DEFAULT_LANGUAGE, isLanguage } from '../../i18n/strings'

/** `/:lang/...`: validates the language segment and provides the dictionary to the subtree. */
export function LanguageRoot() {
  const { lang } = useParams()
  const location = useLocation()
  if (!isLanguage(lang)) {
    // Unknown prefix (e.g. an old /about link): keep the path, add the default language.
    return <Navigate to={`/${DEFAULT_LANGUAGE}${location.pathname}${location.search}`} replace />
  }
  return (
    <I18nContext value={makeI18n(lang)}>
      <Outlet />
    </I18nContext>
  )
}

export function RootRedirect() {
  // Visitors without a language prefix go to the default language; the Accept-Language hint is
  // respected only for English to keep Ukrainian as the primary entry point.
  const prefersEnglish = typeof navigator !== 'undefined' && (navigator.language || '').toLowerCase().startsWith('en')
  return <Navigate to={prefersEnglish ? '/en' : `/${DEFAULT_LANGUAGE}`} replace />
}

