import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import type { Project } from '../../../api/types'
import { useI18n } from '../../../i18n/context'
import { cn } from '../../../lib/cn'
import { paragraphs } from '../../../lib/format'
import { EASE_OUT_EXPO } from '../../../lib/motion'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'
import { MoonPhase } from '../../ui/MoonPhase'
import { SocialIcon } from '../../ui/SocialIcon'
import { Tag } from '../../ui/Tag'
import { DEFAULT_ACCENT } from './ProjectCard'
import { ProjectArt } from './ProjectArt'
import { StatusBadge } from './StatusBadge'

function Gallery({ project }: { project: Project }) {
  const { t } = useI18n()
  const slides = [
    ...(project.cover ? [{ id: 0, image: project.cover, caption: '' }] : []),
    ...project.images,
  ]
  const [[index, direction], setState] = useState<[number, number]>([0, 0])
  const accent = project.accent_color || DEFAULT_ACCENT

  if (slides.length === 0) {
    return (
      <div className="aspect-[16/8] overflow-hidden rounded-t-[2rem] sm:rounded-t-[2rem]">
        <ProjectArt seed={project.id} color={accent} title={project.title} />
      </div>
    )
  }

  const go = (step: number) =>
    setState(([current]) => [(current + step + slides.length) % slides.length, step])
  const slide = slides[index]

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-t-[2rem] bg-bg">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.img
          key={slide.id}
          src={slide.image}
          alt={slide.caption || project.title}
          custom={direction}
          initial={{ opacity: 0, x: direction * 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -80 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="absolute inset-0 size-full object-cover"
        />
      </AnimatePresence>
      {slide.caption && (
        <p className="absolute right-4 bottom-4 left-4 rounded-xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur-md">
          {slide.caption}
        </p>
      )}
      {slides.length > 1 && (
        <>
          {(
            [
              [-1, t.projects.prev, ChevronLeft, 'left-4'],
              [1, t.projects.next, ChevronRight, 'right-4'],
            ] as const
          ).map(([step, label, Icon, position]) => (
            <button
              key={step}
              type="button"
              aria-label={label}
              onClick={() => go(step)}
              className={cn(
                'absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60',
                position,
              )}
            >
              <Icon className="size-5" />
            </button>
          ))}
          <div className="absolute top-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, i) => (
              <span
                key={s.id}
                className={cn('h-1 rounded-full bg-white transition-all', i === index ? 'w-6' : 'w-1.5 opacity-50')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Details({ project, categoryName }: { project: Project; categoryName?: string }) {
  const { t } = useI18n()
  const facts = [
    project.role && { label: t.projects.role, value: project.role },
    project.year && { label: t.projects.year, value: String(project.year) },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <Gallery project={project} />
      <div className="p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs tracking-wider text-subtle uppercase">
          <StatusBadge status={project.status} className="border-line bg-card text-fg" />
          {categoryName && <span>{categoryName}</span>}
        </div>
        <h2 id="project-modal-title" className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {project.title}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{project.summary}</p>

        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_15rem]">
          <div>
            {paragraphs(project.description).map((paragraph, i) => (
              <p key={i} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
            {project.highlights.length > 0 && (
              <>
                <h3 className="eyebrow mt-8 mb-4">{t.projects.highlights}</h3>
                <ul className="space-y-3">
                  {project.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3">
                      <MoonPhase fraction={0.75} size={16} className="mt-1" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="space-y-6">
            {facts.map((fact) => (
              <div key={fact.label}>
                <p className="eyebrow">{fact.label}</p>
                <p className="mt-1.5 font-medium">{fact.value}</p>
              </div>
            ))}
            {project.technologies.length > 0 && (
              <div>
                <p className="eyebrow">{t.projects.stack}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <Tag key={tech}>{tech}</Tag>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {project.live_url && (
                <Button href={project.live_url} external icon={<ArrowUpRight className="size-4" />}>
                  {t.projects.live}
                </Button>
              )}
              {project.repo_url && (
                <Button
                  href={project.repo_url}
                  external
                  variant="ghost"
                  icon={<SocialIcon platform="github" className="size-4" />}
                >
                  {t.projects.code}
                </Button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

interface ProjectModalProps {
  project: Project | null
  categoryName?: string
  open: boolean
  onClose: () => void
}

export function ProjectModal({ project, categoryName, open, onClose }: ProjectModalProps) {
  const { t } = useI18n()
  return (
    <Modal open={open} onClose={onClose} labelledBy="project-modal-title" closeLabel={t.projects.close}>
      {project && <Details key={project.id} project={project} categoryName={categoryName} />}
    </Modal>
  )
}
