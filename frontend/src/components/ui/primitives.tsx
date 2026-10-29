import { Bot, Box, ChartNoAxesCombined, FileText, Globe, Shield } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import type { Availability, ProductIcon, Tint } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { cn } from '../../lib/cn'
import { tintInk } from '../../lib/tint'
import { Reveal } from './Reveal'

// ========== CARD ==========
const TINTS: Record<Tint | 'surface', string> = {
  lavender: 'bg-lavender',
  periwinkle: 'bg-periwinkle',
  mauve: 'bg-mauve',
  surface: 'bg-surface',
}

export function Card({ tint = 'surface', className, children, ...rest }: ComponentProps<'div'> & { tint?: Tint | 'surface' }) {
  return (
    <div className={cn('rounded-card p-6 sm:p-7', tint === 'surface' && 'border border-line', TINTS[tint], className)} {...rest}>
      {children}
    </div>
  )
}

// ========== BADGES ==========
const STATUS_DOT: Record<Availability, string> = {
  available: 'bg-emerald-600 dark:bg-emerald-400',
  beta: 'bg-primary',
  soon: 'bg-amber-600 dark:bg-amber-400',
}

export function StatusBadge({ status, className }: { status: Availability; className?: string }) {
  const { t } = useI18n()
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-sm border border-ink/70 bg-surface/80 px-2 py-0.5 font-mono text-[0.7rem] font-semibold tracking-wide text-ink uppercase', className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', STATUS_DOT[status])} />
      {t.status[status]}
    </span>
  )
}

export function ExampleChip({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <span className={cn('inline-flex items-center rounded-sm bg-warning px-2 py-0.5 font-mono text-[0.68rem] font-semibold tracking-wide text-warning-ink uppercase', className)}>
      {t.price.example}
    </span>
  )
}

// ========== ICONS ==========
const ICONS: Record<ProductIcon, typeof Shield> = {
  shield: Shield,
  document: FileText,
  box: Box,
  bot: Bot,
  chart: ChartNoAxesCombined,
  globe: Globe,
}

export function ProductIconMark({ icon, tint, className }: { icon: ProductIcon; tint: Tint; className?: string }) {
  const Icon = ICONS[icon] ?? Box
  return (
    <span aria-hidden className={cn('grid size-11 place-items-center rounded-sm border border-current/30 bg-surface/80', tintInk(tint), className)}>
      <Icon className="size-5" strokeWidth={1.75} />
    </span>
  )
}

// ========== SECTION ==========
interface SectionProps {
  id?: string
  eyebrow?: string
  title: string
  lead?: string
  children: ReactNode
  aside?: ReactNode
  className?: string
}

export function Section({ id, eyebrow, title, lead, children, aside, className }: SectionProps) {
  return (
    <section id={id} className={cn('container-page py-14 sm:py-20', className)}>
      <Reveal className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h2 className="text-3xl sm:text-4xl">{title}</h2>
          {lead && <p className="mt-3 text-muted">{lead}</p>}
        </div>
        {aside}
      </Reveal>
      <Reveal delay={80}>{children}</Reveal>
    </section>
  )
}

export function PageHeader({ eyebrow, title, lead, children }: { eyebrow?: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <header className="container-page pt-10 pb-6 sm:pt-16 sm:pb-8">
      {eyebrow && <p className="eyebrow enter enter-1 mb-2">{eyebrow}</p>}
      <h1 className="enter enter-2 riso-title text-4xl sm:text-5xl">{title}</h1>
      {lead && <p className="enter enter-3 mt-4 max-w-2xl text-lg text-muted">{lead}</p>}
      {children && <div className="enter enter-4">{children}</div>}
    </header>
  )
}

// ========== SKELETON ==========
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-card bg-primary-soft/60', className)} />
}

// ========== FAQ ==========
export function FAQList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface px-6">
      {items.map((item) => (
        <details key={item.question} className="faq group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
            {item.question}
            <span aria-hidden className="font-mono text-pink-ink transition-transform duration-300 group-open:rotate-45">+</span>
          </summary>
          <div>
            <p className="mt-2 max-w-3xl text-muted">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  )
}
