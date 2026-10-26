import { Outlet } from 'react-router'

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

export function SiteLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
    </div>
  )
}

/** Campaign landing pages: no site navigation, only what the ad promised plus the legal footer. */
export function LandingLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <Header minimal />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer minimal />
      <CookieBanner />
    </div>
  )
}
