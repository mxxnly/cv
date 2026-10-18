import type { ProjectStatus } from '../../../api/types'
import { useI18n } from '../../../i18n/context'
import { cn } from '../../../lib/cn'

const DOT: Record<ProjectStatus, string> = {
  live: 'bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400',
  in_progress: 'bg-amber-400 shadow-[0_0_10px] shadow-amber-400',
  completed: 'bg-accent',
  archived: 'bg-subtle',
}

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const { t } = useI18n()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[0.7rem] font-medium text-white backdrop-blur-md',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', DOT[status])} />
      {t.projects.status[status]}
    </span>
  )
}
