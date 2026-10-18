import {
  Bot,
  Cloud,
  Code,
  Cpu,
  Database,
  PanelsTopLeft,
  Palette,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'

import type { Profile, Service, ServiceIcon } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { initials, paragraphs } from '../../lib/format'
import { Counter } from '../ui/Counter'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { SplitHeading } from '../ui/SplitHeading'
import { SpotlightCard } from '../ui/SpotlightCard'

const SERVICE_ICONS: Record<ServiceIcon, LucideIcon> = {
  code: Code,
  layout: PanelsTopLeft,
  server: Server,
  database: Database,
  smartphone: Smartphone,
  cloud: Cloud,
  bot: Bot,
  palette: Palette,
  shield: Shield,
  cpu: Cpu,
  rocket: Rocket,
  sparkles: Sparkles,
}

function Portrait({ profile }: { profile: Profile }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
      <div className="animate-orbit absolute -inset-[9%] rounded-full border border-line [--orbit-duration:40s]">
        <span className="absolute top-1/2 -left-1.5 size-3 rounded-full bg-accent shadow-[0_0_20px_4px_var(--glow)]" />
      </div>
      <div className="animate-orbit-reverse absolute -inset-[2%] rounded-full border border-dashed border-line-strong [--orbit-duration:90s]" />
      <div className="shadow-moon absolute inset-[6%] overflow-hidden rounded-full bg-elevated ring-1 ring-line">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.full_name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_35%_30%,color-mix(in_oklab,var(--accent)_30%,transparent),transparent_70%)]">
            <span className="text-aurora font-serif text-8xl font-medium italic">
              {initials(profile.full_name)}
            </span>
          </div>
        )}
        {/* Terminator shading: the portrait reads like a lit moon. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent_45%,color-mix(in_oklab,var(--bg)_70%,transparent)_100%)]" />
      </div>
    </div>
  )
}

function ScrollWord({
  word,
  progress,
  range,
}: {
  word: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0.16, 1])
  return <motion.span style={{ opacity }}>{word} </motion.span>
}

/** Paragraph that "lights up" word by word as it scrolls through the viewport. */
function ScrollRevealText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] })
  const words = text.split(/\s+/)
  return (
    <p
      ref={ref}
      className="text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.3] font-medium tracking-[-0.025em]"
    >
      {words.map((word, index) => (
        <ScrollWord
          key={index}
          word={word}
          progress={scrollYProgress}
          range={[index / words.length, (index + 1) / words.length]}
        />
      ))}
    </p>
  )
}

function Services({ services }: { services: Service[] }) {
  const { t } = useI18n()
  return (
    <div className="mt-28 md:mt-36">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <SplitHeading
          as="h3"
          text={t.sections.services.title}
          className="text-[clamp(2rem,4vw,3.25rem)] leading-none font-semibold tracking-[-0.04em]"
        />
        <Reveal>
          <span className="eyebrow">{t.sections.services.eyebrow}</span>
        </Reveal>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, index) => {
          const Icon = SERVICE_ICONS[service.icon] ?? Sparkles
          return (
            <Reveal key={service.id} delay={index * 0.08} className="h-full">
              <SpotlightCard className="flex h-full flex-col p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl border border-line bg-card-hover text-accent">
                    <Icon className="size-5" strokeWidth={1.6} />
                  </span>
                  <span className="font-mono text-xs text-subtle">0{index + 1}</span>
                </div>
                <h4 className="mt-8 text-xl font-semibold tracking-tight">{service.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-muted">{service.description}</p>
              </SpotlightCard>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

interface AboutProps {
  profile: Profile
  services: Service[]
  index: number
  total: number
}

export function About({ profile, services, index, total }: AboutProps) {
  const { t } = useI18n()
  const [lead, ...rest] = paragraphs(profile.about)

  return (
    <section id="about" className="relative py-28 md:py-40">
      <div className="container-page">
        <SectionHeading
          index={index}
          total={total}
          eyebrow={t.sections.about.eyebrow}
          title={t.sections.about.title}
        />

        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-5">
            <Portrait profile={profile} />
          </Reveal>
          <div className="lg:col-span-7">
            {lead && <ScrollRevealText text={lead} />}
            {rest.map((paragraph, i) => (
              <Reveal key={i} delay={0.05 * i}>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {profile.stats.length > 0 && (
          <div className="mt-24 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
            {profile.stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08} className="h-full">
                <div className="flex h-full flex-col justify-between gap-6 bg-bg/80 p-6 backdrop-blur-xl md:p-8">
                  <Counter
                    value={stat.value}
                    className="text-moonlight text-5xl font-semibold tracking-[-0.05em] tabular-nums md:text-6xl"
                  />
                  <span className="text-sm text-muted">{stat.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {services.length > 0 && <Services services={services} />}
      </div>
    </section>
  )
}
