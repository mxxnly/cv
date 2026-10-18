import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

import { parseStat } from '../../lib/text'

/** Counts up to a stat like "30+" or "99%" when it scrolls into view; other text is shown as-is. */
export function Counter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduceMotion = useReducedMotion()
  const parsed = parseStat(value)

  useEffect(() => {
    const element = ref.current
    const stat = parseStat(value)
    if (!element || !stat || !inView || reduceMotion) return
    const { prefix, target, suffix, decimals } = stat
    const controls = animate(0, target, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        element.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`
      },
    })
    return () => controls.stop()
  }, [inView, value, reduceMotion])

  const initial = parsed && !reduceMotion ? `${parsed.prefix}0${parsed.suffix}` : value
  return (
    <span ref={ref} className={className}>
      {initial}
    </span>
  )
}
