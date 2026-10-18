import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { MoonPhase } from './MoonPhase'
import { Reveal } from './Reveal'
import { SplitHeading } from './SplitHeading'

interface SectionHeadingProps {
  index: number
  total: number
  eyebrow: string
  title: string
  aside?: ReactNode
  className?: string
}

/** "02 ── SKILLS" label + big split title. The phase icon grows with the section number. */
export function SectionHeading({ index, total, eyebrow, title, aside, className }: SectionHeadingProps) {
  const number = String(index).padStart(2, '0')
  return (
    <div className={cn('mb-10 grid items-end gap-6 md:mb-20 md:gap-8 lg:grid-cols-[1fr_auto]', className)}>
      <div>
        <Reveal>
          <div className="eyebrow flex items-center gap-3">
            <MoonPhase fraction={index / total} size={16} />
            <span className="text-fg">{number}</span>
            <span className="h-px w-10 bg-line-strong" />
            <span>{eyebrow}</span>
          </div>
        </Reveal>
        <SplitHeading
          text={title}
          className="mt-6 max-w-4xl text-[clamp(2.5rem,6.2vw,5.4rem)] leading-[0.98] font-semibold tracking-[-0.045em]"
        />
      </div>
      {aside && <Reveal delay={0.2}>{aside}</Reveal>}
    </div>
  )
}
