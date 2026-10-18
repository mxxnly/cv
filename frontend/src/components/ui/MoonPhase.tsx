import { moonPhasePath } from '../../lib/moon'
import { cn } from '../../lib/cn'

interface MoonPhaseProps {
  /** Illuminated share of the disc, 0…1. */
  fraction: number
  size?: number
  className?: string
  title?: string
}

export function MoonPhase({ fraction, size = 18, className, title }: MoonPhaseProps) {
  const lit = moonPhasePath(fraction, 9.5, 12, 12)
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="color-mix(in oklab, var(--fg) 7%, transparent)"
        stroke="var(--line-strong)"
        strokeWidth="1"
      />
      {lit && <path d={lit} fill="var(--accent)" />}
    </svg>
  )
}
