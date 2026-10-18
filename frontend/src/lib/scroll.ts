import { createContext, use } from 'react'
import type Lenis from 'lenis'

export const LenisContext = createContext<Lenis | null>(null)

export function useLenisInstance() {
  return use(LenisContext)
}

export const NAV_OFFSET = -88

/** Smoothly scroll to a section id (or the top), falling back to native scrolling. */
export function scrollToTarget(lenis: Lenis | null, target: string | number) {
  if (lenis) {
    lenis.scrollTo(target, { offset: typeof target === 'string' ? NAV_OFFSET : 0, duration: 1.4 })
    return
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' })
    return
  }
  const element = document.querySelector(target)
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY + NAV_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }
}
