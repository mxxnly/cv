import { motion, useMotionValue, useScroll, useTransform, type MotionStyle } from 'motion/react'
import { useEffect } from 'react'

import { useTheme } from '../../theme/context'
import { MoonCanvas } from './MoonCanvas'
import { StarField } from './StarField'

const PHASE_START = Math.PI * 0.42
const PHASE_END = Math.PI

/**
 * Fixed sky behind the page. The moon starts large in the hero, then retreats to a corner;
 * its phase follows the scroll position — the page is one lunar cycle, ending on a full moon.
 */
export function SkyBackground() {
  const { theme } = useTheme()
  const isDay = theme === 'light'
  const { scrollY, scrollYProgress } = useScroll()
  const dayValue = useMotionValue(isDay ? 1 : 0)

  useEffect(() => {
    dayValue.set(isDay ? 1 : 0)
  }, [dayValue, isDay])

  const heroProgress = useTransform(scrollY, (y) =>
    Math.min(1, Math.max(0, y / (window.innerHeight * 0.9))),
  )
  const endFade = useTransform(scrollYProgress, [0.9, 0.99], [0, 1])
  const phase = useTransform(scrollYProgress, [0, 0.88], [PHASE_START, PHASE_END])
  const opacity = useTransform(() => {
    const restingOpacity = dayValue.get() > 0.5 ? 0.6 : 0.45
    return (1 - heroProgress.get() * (1 - restingOpacity)) * (1 - endFade.get())
  })

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="sky absolute inset-0" />
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <StarField isDay={isDay} />
      <motion.div className="moon-stage" style={{ '--t': heroProgress, opacity } as MotionStyle}>
        <MoonCanvas phase={phase} visibility={opacity} isDay={isDay} />
      </motion.div>
    </div>
  )
}
