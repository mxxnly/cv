/* Captures UTM parameters and gclid on the first page view of a session, so that a form sent
   several pages later still carries the campaign that brought the visitor. Stored in
   sessionStorage only (no cookies, no third parties). */

import type { Attribution } from '../api/types'

const KEY = 'mxxnly-attribution'
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'] as const

export function parseAttribution(search: string, pathname: string, referrer: string): Attribution {
  const params = new URLSearchParams(search)
  const found: Attribution = {}
  for (const key of PARAMS) {
    const value = params.get(key)
    if (value) found[key] = value.slice(0, 200)
  }
  if (Object.keys(found).length === 0) return {}
  found.landing = pathname.slice(0, 200)
  if (referrer) found.referrer = referrer.slice(0, 200)
  return found
}

export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(KEY)) return
    const found = parseAttribution(location.search, location.pathname, document.referrer)
    if (Object.keys(found).length > 0) sessionStorage.setItem(KEY, JSON.stringify(found))
  } catch {
    /* storage unavailable: attribution is simply not recorded */
  }
}

export function getAttribution(): Attribution {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Attribution) : {}
  } catch {
    return {}
  }
}
