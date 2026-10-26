/* Cookie consent + Google Consent Mode v2.

   Default state is "denied" for everything. gtag.js (GA4 + Google Ads) is loaded only after the
   visitor grants analytics and/or ad storage, and only when the analytics ids in company.json are
   set. The choice is stored in localStorage under `cookie-consent`. */

import { company, isPlaceholder } from '../company'

export interface Consent {
  analytics: boolean
  ads: boolean
  decidedAt: string
}

export const CONSENT_KEY = 'cookie-consent'
const CONSENT_EVENT = 'mxxnly:consent'

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(args)
}

/** Must run before any tag loads: Consent Mode v2 defaults, all denied. */
export function initConsentDefaults(): void {
  if (typeof window === 'undefined') return
  window.gtag = window.gtag ?? (gtag as Gtag)
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  })
  const saved = readConsent()
  if (saved) applyConsent(saved)
}

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Consent>
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.ads !== 'boolean') return null
    return { analytics: parsed.analytics, ads: parsed.ads, decidedAt: parsed.decidedAt ?? '' }
  } catch {
    return null
  }
}

export function saveConsent(choice: Pick<Consent, 'analytics' | 'ads'>): Consent {
  const consent: Consent = { ...choice, decidedAt: new Date().toISOString() }
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  } catch {
    /* private mode: the choice applies to this page view only */
  }
  applyConsent(consent)
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }))
  return consent
}

export function onConsentChange(listener: (consent: Consent) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<Consent>).detail)
  window.addEventListener(CONSENT_EVENT, handler)
  return () => window.removeEventListener(CONSENT_EVENT, handler)
}

export function analyticsIds(): { ga4: string; ads: string } {
  // Placeholder ids (G-PLACEHOLDER0 etc.) are never loaded: nothing is sent to Google in dev.
  return {
    ga4: isPlaceholder('analytics.ga4_measurement_id') ? '' : company.analytics.ga4_measurement_id,
    ads: isPlaceholder('analytics.ads_conversion_id') ? '' : company.analytics.ads_conversion_id,
  }
}

let tagLoaded = false

function applyConsent(consent: Consent): void {
  gtag('consent', 'update', {
    ad_storage: consent.ads ? 'granted' : 'denied',
    ad_user_data: consent.ads ? 'granted' : 'denied',
    ad_personalization: consent.ads ? 'granted' : 'denied',
    analytics_storage: consent.analytics ? 'granted' : 'denied',
  })
  if ((consent.analytics || consent.ads) && !tagLoaded) loadTag()
}

function loadTag(): void {
  const { ga4, ads } = analyticsIds()
  const primary = ga4 || ads
  if (!primary || typeof document === 'undefined') return
  tagLoaded = true
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primary)}`
  document.head.appendChild(script)
  gtag('js', new Date())
  if (ga4) gtag('config', ga4, { anonymize_ip: true })
  if (ads) gtag('config', ads)
}

/** Fires an event only when the tag is loaded (i.e. consent was granted). */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!tagLoaded) return
  gtag('event', name, params)
}

/** Google Ads conversions: lead (form sent), checkout (buy link clicked). Purchase happens on the
    external payment provider and must be imported there (see README). */
export function trackConversion(kind: 'lead' | 'checkout' | 'purchase', params: Record<string, unknown> = {}): void {
  const { ads } = analyticsIds()
  const label = company.analytics.ads_conversion_labels[kind]
  const labelIsPlaceholder = isPlaceholder(`analytics.ads_conversion_labels.${kind}`)
  const names = { lead: 'generate_lead', checkout: 'begin_checkout', purchase: 'purchase' } as const
  trackEvent(names[kind], params)
  if (ads && label && !labelIsPlaceholder) trackEvent('conversion', { send_to: `${ads}/${label}`, ...params })
}
