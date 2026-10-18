import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-line bg-card px-2.5 py-1 font-mono text-[0.68rem] tracking-wide text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
