import { ArrowUp } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { Profile } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { scrollToTarget, useLenisInstance } from '../../lib/scroll'
import { MoonPhase } from '../ui/MoonPhase'
import { SocialIcon } from '../ui/SocialIcon'

const CURRENT_YEAR = new Date().getFullYear()
const SURFACE_RADIUS_VW = 110

/** Vertical drop (in vw) of the horizon curve at `x` vw from the centre. */
const sag = (x: number) => SURFACE_RADIUS_VW - Math.sqrt(SURFACE_RADIUS_VW ** 2 - x ** 2)

// x: offset from centre (vw), depth: below the horizon (px), width: px — nearer craters are bigger.
const CRATERS = [
  { x: -44, depth: 14, width: 70 },
  { x: -31, depth: 46, width: 150 },
  { x: -17, depth: 10, width: 46 },
  { x: -6, depth: 70, width: 210 },
  { x: 9, depth: 22, width: 90 },
  { x: 18, depth: 96, width: 260 },
  { x: 31, depth: 16, width: 64 },
  { x: 42, depth: 52, width: 170 },
  { x: -40, depth: 120, width: 300 },
]

function LunarHorizon() {
  return (
    <div aria-hidden className="lunar-horizon">
      <div className="earth" style={{ left: 'calc(50% + 24vw)', top: `calc(${sag(24)}vw - 2.4rem)` }} />
      <div className="lunar-surface">
        {CRATERS.map((crater) => (
          <span
            key={crater.x}
            className="crater"
            style={
              {
                left: `calc(${SURFACE_RADIUS_VW}vw + ${crater.x}vw)`,
                top: `calc(${sag(crater.x)}vw + ${crater.depth}px)`,
                width: crater.width,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}

export function Footer({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  const lenis = useLenisInstance()

  return (
    <footer className="relative z-10 mt-16 overflow-hidden">
      <div className="container-page flex flex-col items-center gap-5 pt-10 text-center">
        <MoonPhase fraction={1} size={22} />
        {profile.footer_text && <p className="eyebrow">{profile.footer_text}</p>}
        <button
          type="button"
          onClick={() => scrollToTarget(lenis, 0)}
          className="group glass mt-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowUp className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          {t.footer.top}
        </button>
      </div>

      <div className="relative mt-6">
        <p
          aria-hidden
          className="text-moonlight pointer-events-none text-center font-serif text-[clamp(6rem,26vw,24rem)] leading-[0.82] font-medium tracking-[-0.04em] italic opacity-60 select-none"
        >
          {profile.brand}
        </p>
        <div className="relative -mt-[8vw] h-[clamp(9rem,17vw,15rem)]">
          <LunarHorizon />
          <div className="container-page absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-between gap-3 pb-6 text-xs text-muted sm:flex-row">
            <span>
              © {CURRENT_YEAR} {profile.full_name}. {t.footer.rights}
            </span>
            <span className="flex items-center gap-1">
              {profile.socials.map((social) => (
                <a
                  key={social.url}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid size-8 place-items-center rounded-full transition-colors hover:bg-card-hover hover:text-fg"
                >
                  <SocialIcon platform={social.platform} className="size-3.5" />
                </a>
              ))}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
