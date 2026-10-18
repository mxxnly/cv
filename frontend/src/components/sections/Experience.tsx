import { ArrowUpRight } from 'lucide-react'
import { AnimatePresence, motion, useInView, useScroll, useSpring } from 'motion/react'
import { useRef, useState } from 'react'

import type { Experience as ExperienceItem } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { cn } from '../../lib/cn'
import { formatDuration, formatMonthYear, paragraphs } from '../../lib/format'
import { EASE_OUT_EXPO } from '../../lib/motion'
import { MoonPhase } from '../ui/MoonPhase'
import { SectionHeading } from '../ui/SectionHeading'
import { Tag } from '../ui/Tag'

type Tab = 'work' | 'education'

function TimelineItem({ item }: { item: ExperienceItem }) {
  const { t, lang } = useI18n()
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -35% 0px' })
  const period = `${formatMonthYear(item.start_date, lang)} — ${
    item.end_date ? formatMonthYear(item.end_date, lang) : t.experience.present
  }`
  const meta = [item.location, item.employment_type].filter(Boolean).join(' · ')

  return (
    <motion.li
      ref={ref}
      className="relative pb-16 pl-12 last:pb-0 md:pl-16"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
    >
      <span className="absolute top-0.5 left-0 grid size-6 place-items-center rounded-full bg-bg ring-1 ring-line-strong">
        <motion.span
          animate={{ rotate: inView ? 0 : -90, scale: inView ? 1 : 0.6 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
        >
          <MoonPhase fraction={inView ? 1 : 0.12} size={18} />
        </motion.span>
      </span>

      <div className="grid gap-4 md:grid-cols-[13rem_1fr] md:gap-10">
        <div>
          <p className="font-mono text-xs tracking-wider text-fg uppercase">{period}</p>
          <p className="mt-1.5 text-xs text-subtle">{formatDuration(item.start_date, item.end_date, t)}</p>
          {item.kind !== 'work' && item.kind !== 'education' && (
            <Tag className="mt-3">{t.experience.kinds[item.kind]}</Tag>
          )}
        </div>

        <div className="glass rounded-3xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            {item.logo && (
              <img
                src={item.logo}
                alt=""
                loading="lazy"
                className="size-12 shrink-0 rounded-xl border border-line bg-white object-contain p-1.5"
              />
            )}
            <div>
              <h3 className="text-2xl font-semibold tracking-tight md:text-[1.7rem]">{item.title}</h3>
              <p className="mt-1 text-muted">
                {item.organization_url ? (
                  <a
                    href={item.organization_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 font-medium text-fg underline-offset-4 hover:underline"
                  >
                    {item.organization}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ) : (
                  <span className="font-medium text-fg">{item.organization}</span>
                )}
                {meta && <span> · {meta}</span>}
              </p>
            </div>
          </div>

          {paragraphs(item.description).map((paragraph, i) => (
            <p key={i} className="mt-5 leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}

          {item.achievements.length > 0 && (
            <ul className="mt-5 space-y-2.5">
              {item.achievements.map((achievement) => (
                <li key={achievement} className="flex gap-3 text-[0.95rem] leading-relaxed">
                  <MoonPhase fraction={0.5} size={14} className="mt-1" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          )}

          {item.technologies.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {item.technologies.map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  )
}

function Timeline({ items }: { items: ExperienceItem[] }) {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.6'] })
  const scaleY = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })

  return (
    <ol ref={ref} className="relative">
      <span aria-hidden className="absolute top-3 bottom-0 left-[11.5px] w-px bg-line" />
      <motion.span
        aria-hidden
        style={{ scaleY }}
        className="absolute top-3 bottom-0 left-[11px] w-0.5 origin-top rounded-full bg-gradient-to-b from-accent via-accent to-gold shadow-[0_0_12px_var(--glow)]"
      />
      {items.map((item) => (
        <TimelineItem key={item.id} item={item} />
      ))}
    </ol>
  )
}

interface ExperienceProps {
  items: ExperienceItem[]
  index: number
  total: number
}

export function Experience({ items, index, total }: ExperienceProps) {
  const { t } = useI18n()
  const work = items.filter((item) => item.kind !== 'education')
  const education = items.filter((item) => item.kind === 'education')
  const hasTabs = work.length > 0 && education.length > 0
  const [tab, setTab] = useState<Tab>(work.length > 0 ? 'work' : 'education')
  const visible = hasTabs ? (tab === 'work' ? work : education) : items

  const tabs = hasTabs ? (
    <div role="tablist" className="glass inline-flex rounded-full p-1">
      {(['work', 'education'] as const).map((id) => (
        <button
          key={id}
          role="tab"
          type="button"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={cn(
            'relative rounded-full px-5 py-2 text-sm font-medium transition-colors',
            tab === id ? 'text-bg' : 'text-muted hover:text-fg',
          )}
        >
          {tab === id && (
            <motion.span
              layoutId="experience-tab"
              className="absolute inset-0 rounded-full bg-fg"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative">{t.experience.tabs[id]}</span>
        </button>
      ))}
    </div>
  ) : undefined

  return (
    <section id="experience" className="relative py-28 md:py-40">
      <div className="container-page">
        <SectionHeading
          index={index}
          total={total}
          eyebrow={t.sections.experience.eyebrow}
          title={t.sections.experience.title}
          aside={tabs}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          >
            <Timeline items={visible} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
