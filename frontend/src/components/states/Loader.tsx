import { motion, useAnimationFrame } from 'motion/react'
import { useRef } from 'react'

import { moonPhasePath } from '../../lib/moon'
import { EASE_OUT_EXPO } from '../../lib/motion'

/** Splash screen: a moon cycling through its phases while the data loads. */
export function Loader() {
  const pathRef = useRef<SVGPathElement>(null)

  useAnimationFrame((time) => {
    const fraction = (1 - Math.cos(time / 650)) / 2
    pathRef.current?.setAttribute('d', moonPhasePath(0.03 + fraction * 0.94, 26, 40, 40))
  })

  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center bg-bg"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      role="status"
      aria-label="Loading"
    >
      <motion.div
        className="relative grid size-40 place-items-center"
        exit={{ scale: 1.4, opacity: 0, filter: 'blur(12px)' }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      >
        <div className="animate-orbit absolute inset-0 rounded-full border border-dashed border-line-strong [--orbit-duration:14s]" />
        <div className="animate-orbit-reverse absolute inset-5 rounded-full border border-line [--orbit-duration:9s]">
          <span className="absolute top-1/2 -right-1 size-2 rounded-full bg-accent shadow-[0_0_14px_var(--accent)]" />
        </div>
        <svg viewBox="0 0 80 80" className="size-20 drop-shadow-[0_0_24px_var(--glow)]" aria-hidden>
          <circle cx="40" cy="40" r="26" fill="color-mix(in oklab, var(--fg) 6%, transparent)" stroke="var(--line-strong)" />
          <path ref={pathRef} fill="var(--accent)" />
        </svg>
      </motion.div>
    </motion.div>
  )
}
