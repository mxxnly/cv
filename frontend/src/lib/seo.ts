/* Per-route <head> management: title, description, canonical, hreflang, Open Graph, JSON-LD. */

import { useEffect } from 'react'

import { company, siteOrigin } from '../company'
import { useI18n } from '../i18n/context'
import { LANGUAGES, type Language } from '../i18n/strings'

export interface SeoProps {
  title: string
  description?: string
  /** Site path without the language prefix, e.g. `/products/vpn`. */
  path: string
  type?: 'website' | 'product'
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  noindex?: boolean
}

function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  let element = document.head.querySelector<HTMLElement>(selector)
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  return element
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  const element = upsert(`meta[${attribute}="${key}"]`, () => {
    const meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    return meta
  })
  element.setAttribute('content', content)
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`
  const element = upsert(selector, () => {
    const link = document.createElement('link')
    link.rel = rel
    if (hreflang) link.hreflang = hreflang
    return link
  })
  element.setAttribute('href', href)
}

export function localizedUrl(path: string, lang: Language): string {
  return `${siteOrigin}/${lang}${path === '/' ? '' : path}`
}

export function organizationJsonLd(lang: Language) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.brand.name,
    legalName: lang === 'uk' ? company.seller.legal_name : company.seller.legal_name_en,
    url: siteOrigin,
    logo: `${siteOrigin}/icon-512.png`,
    email: company.contacts.email,
    telephone: company.contacts.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: lang === 'uk' ? company.seller.address : company.seller.address_en,
      addressCountry: company.seller.country,
    },
  }
}

export function useSeo({ title, description, path, type = 'website', jsonLd, noindex }: SeoProps) {
  const { lang } = useI18n()
  const fullTitle = title === company.brand.name ? title : `${title} · ${company.brand.name}`
  const desc = description ?? company.brand.description[lang]
  const jsonLdText = JSON.stringify(jsonLd ?? organizationJsonLd(lang))

  useEffect(() => {
    document.title = fullTitle
    document.documentElement.lang = lang
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:type', type === 'product' ? 'product' : 'website')
    setMeta('property', 'og:url', localizedUrl(path, lang))
    setMeta('property', 'og:locale', lang === 'uk' ? 'uk_UA' : 'en_US')
    setLink('canonical', localizedUrl(path, lang))
    for (const alternate of LANGUAGES) setLink('alternate', localizedUrl(path, alternate), alternate)
    setLink('alternate', localizedUrl(path, 'uk'), 'x-default')
    if (noindex) setMeta('name', 'robots', 'noindex, nofollow')
    else document.head.querySelector('meta[name="robots"]')?.remove()

    const script = upsert('script[data-seo-jsonld]', () => {
      const element = document.createElement('script')
      element.type = 'application/ld+json'
      element.dataset.seoJsonld = ''
      return element
    })
    script.textContent = jsonLdText
  }, [fullTitle, desc, path, lang, type, jsonLdText, noindex])
}
