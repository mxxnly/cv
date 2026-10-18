import type { Transition, Variants } from 'motion/react'

export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const revealTransition: Transition = { duration: 0.9, ease: EASE_OUT_EXPO }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: revealTransition },
}

export const stagger = (delayChildren = 0, staggerChildren = 0.08): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

export const inViewOnce = { once: true, margin: '0px 0px -12% 0px' } as const
