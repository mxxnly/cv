import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { useI18n } from '../i18n/context'
import { readConsent, saveConsent } from '../lib/consent'
import { COOKIE_SETTINGS_EVENT as OPEN_EVENT } from '../lib/cookieSettings'
import { Button } from './ui/Button'


export function CookieBanner() {
  const { t, href } = useI18n()
  const [visible, setVisible] = useState(() => readConsent() === null)
  const [settings, setSettings] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [ads, setAds] = useState(true)

  useEffect(() => {
    const open = () => {
      const saved = readConsent()
      setAnalytics(saved?.analytics ?? true)
      setAds(saved?.ads ?? true)
      setSettings(true)
      setVisible(true)
    }
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  if (!visible) return null

  const decide = (choice: { analytics: boolean; ads: boolean }) => {
    saveConsent(choice)
    setVisible(false)
    setSettings(false)
  }

  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie" className="banner-enter fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-card border border-line bg-surface p-5 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.4)] sm:p-6">
      <p className="text-sm">
        {t.cookie.text}{' '}
        <Link className="font-bold text-primary underline-offset-4 hover:underline" to={href('/legal/cookies')}>{t.cookie.more}</Link>
      </p>
      {settings && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-card-sm bg-primary-soft/60 px-4 py-3 text-sm font-semibold">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="size-4 accent-primary" />
            {t.cookie.analytics}
          </label>
          <label className="flex items-center gap-3 rounded-card-sm bg-primary-soft/60 px-4 py-3 text-sm font-semibold">
            <input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} className="size-4 accent-primary" />
            {t.cookie.ads}
          </label>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {settings ? (
          <Button size="sm" onClick={() => decide({ analytics, ads })}>{t.cookie.save}</Button>
        ) : (
          <Button size="sm" onClick={() => decide({ analytics: true, ads: true })}>{t.cookie.accept}</Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => decide({ analytics: false, ads: false })}>{t.cookie.reject}</Button>
        {!settings && <Button size="sm" variant="link" onClick={() => setSettings(true)}>{t.cookie.settings}</Button>}
      </div>
    </div>
  )
}
