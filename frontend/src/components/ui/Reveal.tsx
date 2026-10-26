import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '../../lib/cn'

function prefersReducedMotion(): boolean {
  return typeof window === 'undefined' || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Fades and lifts its content in when it scrolls into view; `delay` (ms) staggers siblings. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(prefersReducedMotion)

  useEffect(() => {
    const element = ref.current
    if (!element || visible) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(element)
    // Safety net: never leave content hidden if the observer does not fire (odd viewports, crawlers).
    const fallback = window.setTimeout(() => setVisible(true), 1500)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [visible])

  return (
    <div ref={ref} className={cn('reveal', visible && 'is-visible', className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  )
}
