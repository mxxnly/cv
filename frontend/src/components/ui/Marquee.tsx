import type { CSSProperties } from 'react'

import { cn } from '../../lib/cn'

interface MarqueeProps {
  items: string[]
  reverse?: boolean
  duration?: number
  className?: string
}

const MIN_ITEMS = 12

/** Infinite, seamless ticker. Pauses on hover. */
export function Marquee({ items, reverse, duration = 50, className }: MarqueeProps) {
  if (items.length === 0) return null
  const repeat = Math.ceil(MIN_ITEMS / items.length)
  const base = Array.from({ length: repeat }, () => items).flat()

  return (
    <div className={cn('mask-fade-x group flex overflow-hidden', className)}>
      <div
        className={cn(
          'flex w-max shrink-0 group-hover:[animation-play-state:paused]',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee',
        )}
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        {[...base, ...base].map((item, index) => (
          <span
            key={index}
            aria-hidden={index >= base.length || undefined}
            className="flex items-center gap-8 pr-8 text-3xl font-semibold tracking-[-0.03em] whitespace-nowrap text-subtle transition-colors duration-300 hover:text-fg md:text-5xl"
          >
            {item}
            <svg viewBox="0 0 24 24" className="size-4 text-accent/70 md:size-5" aria-hidden>
              <path
                fill="currentColor"
                d="M12 0c.7 6.6 5.4 11.3 12 12-6.6.7-11.3 5.4-12 12-.7-6.6-5.4-11.3-12-12C6.6 11.3 11.3 6.6 12 0Z"
              />
            </svg>
          </span>
        ))}
      </div>
    </div>
  )
}
