import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import type { KeyboardEvent } from 'react'

import type { Project } from '../../../api/types'
import { useI18n } from '../../../i18n/context'
import { cn } from '../../../lib/cn'
import { EASE_OUT_EXPO } from '../../../lib/motion'
import { SpotlightCard } from '../../ui/SpotlightCard'
import { Tag } from '../../ui/Tag'
import { ProjectArt } from './ProjectArt'
import { StatusBadge } from './StatusBadge'

export const DEFAULT_ACCENT = '#c8c1ff'

interface ProjectCardProps {
  project: Project
  categoryName?: string
  featured: boolean
  onOpen: () => void
}

export function ProjectCard({ project, categoryName, featured, onOpen }: ProjectCardProps) {
  const { t } = useI18n()
  const maxTags = featured ? 7 : 4
  const hiddenTags = project.technologies.length - maxTags
  const accent = project.accent_color || DEFAULT_ACCENT

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      className={cn('h-full', featured && 'md:col-span-2')}
    >
      <SpotlightCard
        color={accent}
        role="button"
        tabIndex={0}
        aria-label={`${project.title} — ${t.projects.details}`}
        onClick={onOpen}
        onKeyDown={onKeyDown}
        className="flex h-full cursor-pointer flex-col p-2 hover:-translate-y-1"
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-[1.3rem] border border-line',
            featured ? 'aspect-[16/9]' : 'aspect-[16/10]',
          )}
        >
          {project.cover ? (
            <img
              src={project.cover}
              alt={project.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            />
          ) : (
            <div className="size-full transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]">
              <ProjectArt seed={project.id} color={accent} title={project.title} />
            </div>
          )}
          <StatusBadge status={project.status} className="absolute top-3 left-3" />
          <span className="absolute top-3 right-3 grid size-10 scale-75 place-items-center rounded-full bg-fg text-bg opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
            <ArrowUpRight className="size-4" />
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 pt-5 pb-4">
          <div className="flex items-center justify-between font-mono text-[0.7rem] tracking-wider text-subtle uppercase">
            <span>{categoryName}</span>
            <span>{project.year}</span>
          </div>
          <h3 className={cn('mt-2 font-semibold tracking-tight', featured ? 'text-3xl' : 'text-2xl')}>
            {project.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{project.summary}</p>
          {project.technologies.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
              {project.technologies.slice(0, maxTags).map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
              {hiddenTags > 0 && <Tag>+{hiddenTags}</Tag>}
            </div>
          )}
        </div>
      </SpotlightCard>
    </motion.article>
  )
}
