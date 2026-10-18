import { useEffect } from 'react'

import type { Profile } from '../api/types'

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

export function useDocumentMeta(profile: Profile) {
  useEffect(() => {
    const title = profile.seo_title || `${profile.full_name} — ${profile.headline}`
    const description = profile.seo_description || profile.tagline || profile.headline
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  }, [profile])
}
