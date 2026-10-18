import { motion } from 'motion/react'
import type { ElementType } from 'react'

import { cn } from '../../lib/cn'
import { EASE_OUT_EXPO, inViewOnce } from '../../lib/motion'
import { tokenize } from '../../lib/text'

interface SplitHeadingProps {
  text: string
  as?: ElementType
  className?: string
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean
  delay?: number
}

/** Heading whose words slide up from behind a mask; *emphasised* words get the serif accent. */
export function SplitHeading({ text, as: Tag = 'h2', className, immediate, delay = 0 }: SplitHeadingProps) {
  const tokens = tokenize(text)
  const trigger = immediate ? { animate: 'show' } : { whileInView: 'show', viewport: inViewOnce }

  return (
    <Tag className={className} aria-label={text.replaceAll('*', '')}>
      <motion.span
        className="block"
        initial="hidden"
        {...trigger}
        transition={{ staggerChildren: 0.06, delayChildren: delay }}
        aria-hidden
      >
        {tokens.map((token, index) => (
          <span
            key={`${token.word}-${index}`}
            className={cn(
              'inline-block overflow-hidden pb-[0.12em] align-bottom',
              token.emphasis && '-mx-[0.06em] px-[0.06em]',
            )}
          >
            <motion.span
              className={cn(
                'inline-block',
                token.emphasis
                  ? 'text-aurora animate-shimmer font-serif text-[1.16em] leading-none font-medium tracking-[-0.01em] italic'
                  : 'text-moonlight',
              )}
              variants={{
                hidden: { y: '115%', rotate: 4 },
                show: { y: '0%', rotate: 0, transition: { duration: 1, ease: EASE_OUT_EXPO } },
              }}
            >
              {token.word}
            </motion.span>
            {index < tokens.length - 1 && ' '}
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
