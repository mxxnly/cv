import { beforeEach, describe, expect, it } from 'vitest'

import { makeI18n } from '../i18n/context'
import { parseAttribution } from './attribution'
import { CONSENT_KEY, readConsent, saveConsent } from './consent'
import { fillTokens, formatDate, formatPrice } from './format'

describe('formatPrice', () => {
  it('drops decimals for whole numbers and keeps the currency code', () => {
    expect(formatPrice('5.00', 'USD', 'en')).toBe('5 USD')
    expect(formatPrice('129.00', 'USD', 'uk')).toBe('129 USD')
  })
  it('keeps two decimals otherwise and tolerates bad input', () => {
    expect(formatPrice('4.50', 'USD', 'en')).toBe('4.50 USD')
    expect(formatPrice(null, 'USD', 'en')).toBe('')
    expect(formatPrice('abc', 'USD', 'en')).toBe('')
  })
})

describe('formatDate', () => {
  it('formats ISO dates per language', () => {
    expect(formatDate('2026-12-31', 'uk')).toBe('31.12.2026')
    expect(formatDate('2026-12-31', 'en')).toBe('12/31/2026')
    expect(formatDate(null, 'en')).toBe('')
  })
})

describe('fillTokens', () => {
  it('replaces known tokens and leaves unknown ones visible', () => {
    const lookup = (path: string) => ({ 'contacts.email': 'a@b.c' })[path] ?? ''
    expect(fillTokens('Email: {{contacts.email}}, tax: {{ seller.tax_id }}', lookup)).toBe('Email: a@b.c, tax: {{seller.tax_id}}')
  })
})

describe('parseAttribution', () => {
  it('keeps only campaign parameters and records the landing page', () => {
    const found = parseAttribution('?utm_source=google&utm_medium=cpc&gclid=abc&foo=bar', '/uk/lp/vpn', 'https://google.com/')
    expect(found).toEqual({ utm_source: 'google', utm_medium: 'cpc', gclid: 'abc', landing: '/uk/lp/vpn', referrer: 'https://google.com/' })
  })
  it('returns nothing without campaign parameters', () => {
    expect(parseAttribution('?foo=bar', '/uk', '')).toEqual({})
  })
})

describe('consent', () => {
  beforeEach(() => localStorage.clear())
  it('is undecided by default and persists the choice', () => {
    expect(readConsent()).toBeNull()
    saveConsent({ analytics: true, ads: false })
    expect(readConsent()).toMatchObject({ analytics: true, ads: false })
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY) ?? '{}').decidedAt).toBeTruthy()
  })
  it('pushes a Consent Mode update to the dataLayer', () => {
    saveConsent({ analytics: false, ads: true })
    const updates = (window.dataLayer ?? []).filter((entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update')
    expect(updates.at(-1)).toEqual(['consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'denied' }])
  })
  it('ignores corrupted storage', () => {
    localStorage.setItem(CONSENT_KEY, '{"analytics":"yes"}')
    expect(readConsent()).toBeNull()
  })
})

describe('i18n href', () => {
  it('prefixes paths with the language', () => {
    expect(makeI18n('uk').href('/')).toBe('/uk')
    expect(makeI18n('en').href('/products/vpn')).toBe('/en/products/vpn')
  })
})
