import type { CSSProperties, HTMLAttributes, PointerEvent, ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Glow colour; defaults to the theme accent ("moonlight"). */
  color?: string
}

/** Glass card lit by a soft spotlight and a glowing border that follow the cursor. */
export function SpotlightCard({ children, color, className, style, ...rest }: SpotlightCardProps) {
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }

  return (
    <div
      {...rest}
      onPointerMove={onPointerMove}
      className={cn('spotlight-card group glass relative rounded-3xl', className)}
      style={{ '--spot': color || 'var(--accent)', ...style } as CSSProperties}
    >
      <div aria-hidden className="spotlight-glow" />
      <div aria-hidden className="spotlight-border" />
      {children}
    </div>
  )
}
