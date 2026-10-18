import { ArrowRight, Download, MapPin } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

import type { Profile } from '../../api/types'
import { useLocalTime } from '../../hooks/useLocalTime'
import { useI18n } from '../../i18n/context'
import { EASE_OUT_EXPO, fadeUp, stagger } from '../../lib/motion'
import { scrollToTarget, useLenisInstance } from '../../lib/scroll'
import { Button } from '../ui/Button'
import { SocialIcon } from '../ui/SocialIcon'
import { SplitHeading } from '../ui/SplitHeading'

function RotatingRoles({ roles }: { roles: string[] }) {
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (roles.length < 2 || reduceMotion) return
    const interval = window.setInterval(() => setIndex((i) => (i + 1) % roles.length), 2800)
    return () => window.clearInterval(interval)
  }, [roles.length, reduceMotion])

  if (roles.length === 0) return null
  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={index}
          className="text-aurora animate-shimmer font-serif text-[1.18em] font-medium italic"
          initial={{ y: '100%', opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-100%', opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          {roles[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function LocalTime({ timezone, location }: { timezone: string; location: string }) {
  const { t } = useI18n()
  const { time, offset } = useLocalTime(timezone)
  return (
    <div className="text-right">
      <p className="eyebrow">{t.hero.localTime}</p>
      <p className="mt-1.5 font-mono text-sm text-fg tabular-nums">
        {location && <span className="text-muted">{location.split(',')[0]} · </span>}
        {time}
        {offset && <span className="text-subtle"> {offset}</span>}
      </p>
    </div>
  )
}

export function Hero({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  const lenis = useLenisInstance()
  const words = profile.full_name.trim().split(/\s+/)
  // The last word of the name gets the italic serif accent: "Olexa *Misiats*".
  const nameMarkup = words.length > 1 ? `${words.slice(0, -1).join(' ')} *${words.at(-1)}*` : words[0]

  return (
    <section id="top" className="relative flex min-h-svh flex-col justify-center pt-32 pb-36">
      <motion.div className="container-page" initial="hidden" animate="show" variants={stagger(0.5, 0.12)}>
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
          {profile.is_available && profile.availability_text && (
            <span className="glass inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-3 text-sm font-medium">
              <span className="relative flex size-2">
                <span className="animate-pulse-soft absolute inset-0 rounded-full bg-emerald-400" />
                <span className="relative size-2 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400" />
              </span>
              {profile.availability_text}
            </span>
          )}
          {profile.location && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-3.5" />
              {profile.location}
            </span>
          )}
        </motion.div>

        <SplitHeading
          as="h1"
          text={nameMarkup}
          immediate
          delay={0.6}
          className="mt-8 max-w-[14ch] text-[clamp(3.4rem,10.5vw,9.6rem)] leading-[0.9] font-semibold tracking-[-0.055em]"
        />

        <motion.p
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xl font-medium tracking-tight md:text-2xl"
        >
          <span>{profile.headline}</span>
          {profile.roles.length > 0 && (
            <>
              <span className="text-subtle">/</span>
              <RotatingRoles roles={profile.roles} />
            </>
          )}
        </motion.p>

        {profile.tagline && (
          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {profile.tagline}
          </motion.p>
        )}

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => scrollToTarget(lenis, '#projects')}
            icon={<ArrowRight className="size-4" />}
          >
            {t.hero.viewProjects}
          </Button>
          <Button variant="ghost" onClick={() => scrollToTarget(lenis, '#contact')}>
            {t.hero.contact}
          </Button>
          {profile.resume && (
            <Button
              variant="ghost"
              href={profile.resume}
              external
              icon={<Download className="size-4" />}
            >
              {t.hero.resume}
            </Button>
          )}
        </motion.div>
      </motion.div>

      <motion.div
        className="container-page absolute inset-x-0 bottom-8 flex items-end justify-between gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="flex items-center gap-1">
          {profile.socials.map((social) => (
            <a
              key={social.url}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              title={social.label}
              className="grid size-10 place-items-center rounded-full text-muted transition-all duration-300 hover:-translate-y-0.5 hover:bg-card-hover hover:text-fg"
            >
              <SocialIcon platform={social.platform} className="size-[18px]" />
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollToTarget(lenis, '#about')}
          className="group hidden flex-col items-center gap-3 text-muted transition-colors hover:text-fg md:flex"
        >
          <span className="eyebrow">{t.hero.scroll}</span>
          <span className="relative flex h-12 w-7 justify-center rounded-full border border-line-strong">
            <motion.span
              className="mt-2 size-1.5 rounded-full bg-accent"
              animate={{ y: [0, 18, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </button>

        <LocalTime timezone={profile.timezone} location={profile.location} />
      </motion.div>
    </section>
  )
}
