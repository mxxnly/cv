import { Outlet, ScrollRestoration, useLocation } from 'react-router'

import { useI18n } from '../../i18n/context'
import { CookieBanner } from '../CookieBanner'
import { Footer } from './Footer'
import { Header } from './Header'

function SkipLink() {
  const { t } = useI18n()
  return (
    <a href="#main" className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-full bg-surface px-4 py-2 text-sm font-bold transition-transform focus:translate-y-0">
      {t.skipToContent}
    </a>
  )
}

/** New navigation: jump to the top (or to the #hash target). Back/forward: restore the old position.
    No custom getKey on purpose: keying by pathname would re-apply an old scroll position every time
    the same page is opened from a link. */
function Scroll() {
  return <ScrollRestoration />
}

export function SiteLayout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <Header />
      <main id="main" className="flex-1">
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
      <CookieBanner />
      <Scroll />
    </div>
  )
}

/** Campaign landing pages: no site navigation, only what the ad promised plus the legal footer. */
export function LandingLayout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <Header minimal />
      <main id="main" className="flex-1">
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <Footer minimal />
      <CookieBanner />
      <Scroll />
    </div>
  )
}
