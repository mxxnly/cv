import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useCallback, useState } from 'react'

import type { Project, ProjectCategory } from '../../../api/types'
import { useI18n } from '../../../i18n/context'
import { cn } from '../../../lib/cn'
import { SectionHeading } from '../../ui/SectionHeading'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'

interface ProjectsProps {
  projects: Project[]
  categories: ProjectCategory[]
  index: number
  total: number
}

export function Projects({ projects, categories, index, total }: ProjectsProps) {
  const { t } = useI18n()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Project | null>(null)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  const names = Object.fromEntries(categories.map((category) => [category.slug, category.name]))
  const visible = filter === 'all' ? projects : projects.filter((project) => project.category === filter)
  const options = [{ slug: 'all', name: t.projects.all }, ...categories]

  const filters =
    categories.length > 1 ? (
      <div role="tablist" className="glass flex flex-wrap gap-1 rounded-full p-1">
        {options.map((option) => (
          <button
            key={option.slug}
            type="button"
            role="tab"
            aria-selected={filter === option.slug}
            onClick={() => setFilter(option.slug)}
            className={cn(
              'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
              filter === option.slug ? 'text-bg' : 'text-muted hover:text-fg',
            )}
          >
            {filter === option.slug && (
              <motion.span
                layoutId="project-filter"
                className="absolute inset-0 rounded-full bg-fg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative">{option.name}</span>
          </button>
        ))}
      </div>
    ) : undefined

  return (
    <section id="projects" className="relative py-28 md:py-40">
      <div className="container-page">
        <SectionHeading
          index={index}
          total={total}
          eyebrow={t.sections.projects.eyebrow}
          title={t.sections.projects.title}
          aside={filters}
        />
        <LayoutGroup>
          <motion.div layout className="grid grid-flow-dense gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  categoryName={project.category ? names[project.category] : undefined}
                  featured={project.is_featured}
                  onOpen={() => {
                    setSelected(project)
                    setOpen(true)
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
      <ProjectModal
        project={selected}
        categoryName={selected?.category ? names[selected.category] : undefined}
        open={open}
        onClose={close}
      />
    </section>
  )
}
