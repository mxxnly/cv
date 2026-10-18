import { Menu, X } from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'motion/react'
import { useState } from 'react'

import type { SocialLink } from '../../api/types'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useI18n } from '../../i18n/context'
import { cn } from '../../lib/cn'
import { moonPhasePath } from '../../lib/moon'
import { EASE_OUT_EXPO } from '../../lib/motion'
import { scrollToTarget, useLenisInstance } from '../../lib/scroll'
import { SocialIcon } from '../ui/SocialIcon'
import { ThemeToggle } from './ThemeToggle'

export type NavSection = 'about' | 'skills' | 'experience' | 'projects' | 'contact'

interface NavbarProps {
  brand: string
  sections: NavSection[]
  socials: SocialLink[]
}

/** Logo moon whose phase fills up as you scroll through the page. */
function ProgressMoon() {
  const { scrollYProgress } = useScroll()
  const path = useTransform(scrollYProgress, (p) => moonPhasePath(0.06 + p * 0.94, 9, 12, 12))
  return (
    <svg viewBox="0 0 24 24" className="size-7 drop-shadow-[0_0_10px_var(--glow)]" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="color-mix(in oklab, var(--fg) 8%, transparent)" stroke="var(--line-strong)" />
      <motion.path d={path} fill="var(--accent)" />
    </svg>
  )
}

export function Navbar({ brand, sections, socials }: NavbarProps) {
  const { t } = useI18n()
  const lenis = useLenisInstance()
  const active = useActiveSection(sections)
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (value) => setScrolled(value > 24))

  const go = (target: string | number) => {
    setMenuOpen(false)
    scrollToTarget(lenis, target)
  }

  return (
    <>
      <motion.header
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 1, ease: EASE_OUT_EXPO }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
      >
        <nav
          aria-label="Main"
          className={cn(
            'flex w-full max-w-5xl items-center justify-between rounded-full border py-1.5 pr-1.5 pl-3 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500',
            scrolled || menuOpen ? 'glass shadow-moon' : 'border-transparent',
          )}
        >
          <button
            type="button"
            onClick={() => go(0)}
            className="flex items-center gap-2.5 rounded-full py-1 pr-2"
            aria-label={brand}
          >
            <ProgressMoon />
            <span className="font-serif text-[1.45rem] leading-none font-medium tracking-tight italic">
              {brand}
            </span>
          </button>

          <ul className="hidden items-center gap-0.5 md:flex">
            {sections.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(event) => {
                    event.preventDefault()
                    go(`#${id}`)
                  }}
                  aria-current={active === id ? 'true' : undefined}
                  className={cn(
                    'relative block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300',
                    active === id ? 'text-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  {active === id && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full border border-line bg-card-hover"
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.6 }}
                    />
                  )}
                  <span className="relative">{t.nav[id]}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? t.nav.close : t.nav.menu}
              aria-expanded={menuOpen}
              className="grid size-10 place-items-center rounded-full border border-line bg-card md:hidden"
            >
              {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-bg/85 px-6 pt-28 pb-10 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.ul
              className="flex flex-col gap-2"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
            >
              {sections.map((id, index) => (
                <motion.li
                  key={id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
                  }}
                >
                  <a
                    href={`#${id}`}
                    onClick={(event) => {
                      event.preventDefault()
                      go(`#${id}`)
                    }}
                    className="flex items-baseline gap-4 border-b border-line py-4 text-4xl font-semibold tracking-tight"
                  >
                    <span className="font-mono text-xs text-subtle">0{index + 1}</span>
                    {t.nav[id]}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <div className="mt-auto flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.url}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid size-11 place-items-center rounded-full border border-line bg-card"
                >
                  <SocialIcon platform={social.platform} className="size-[18px]" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
