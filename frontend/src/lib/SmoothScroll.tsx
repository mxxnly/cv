import Lenis from 'lenis'
import { useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'

import { LenisContext } from './scroll'

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (reduceMotion) return
    const instance = new Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.95 })
    // Defer exposing the instance so the effect body itself stays free of state updates.
    const frame = requestAnimationFrame(() => setLenis(instance))
    return () => {
      cancelAnimationFrame(frame)
      instance.destroy()
      setLenis(null)
    }
  }, [reduceMotion])

  return <LenisContext value={lenis}>{children}</LenisContext>
}
