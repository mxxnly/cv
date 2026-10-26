import { Menu, Moon, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

import { company, showTestDataBadge } from '../../company'
import { useI18n } from '../../i18n/context'
import { cn } from '../../lib/cn'
import { useTheme } from '../../theme/context'
import { Logo } from './Logo'

const NAV = ['products', 'prices', 'support', 'about', 'contacts'] as const

export function Header({ minimal = false }: { minimal?: boolean }) {
  const { t, lang, href } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const otherLang = lang === 'uk' ? 'en' : 'uk'
  const otherPath = location.pathname.replace(/^\/(uk|en)(?=\/|$)/, `/${otherLang}`)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn('rounded-full px-4 py-2 text-[0.95rem] font-semibold transition-colors', isActive ? 'bg-primary-soft text-ink' : 'text-muted hover:text-ink')

  return (
    <header className="relative z-40">
      {showTestDataBadge && (
        <div className="bg-warning px-4 py-1 text-center text-xs font-bold text-warning-ink" title={t.testData.title}>
          {t.testData.badge}
        </div>
      )}
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-4">
        <Link to={href('/')} aria-label={`${company.brand.name}: ${t.nav.home}`} className="shrink-0">
          <Logo className="h-7 w-auto" />
        </Link>

        {!minimal && (
          <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
            {NAV.map((key) => (
              <NavLink key={key} to={href(`/${key}`)} className={linkClass}>
                {t.nav[key]}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-1.5">
          <Link to={otherPath} hrefLang={otherLang} lang={otherLang} className="rounded-full px-3 py-2 text-sm font-bold text-muted hover:text-ink" aria-label={t.lang.switchTo}>
            <span className="text-ink">{lang.toUpperCase()}</span>
            <span aria-hidden> | </span>
            {otherLang.toUpperCase()}
          </Link>
          <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? t.theme.toLight : t.theme.toDark} className="grid size-11 place-items-center rounded-full bg-primary-soft text-ink">
            {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          {!minimal && (
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? t.nav.close : t.nav.menu} className="grid size-11 place-items-center rounded-full bg-primary-soft text-ink md:hidden">
              {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          )}
        </div>
      </div>

      {open && !minimal && (
        <nav aria-label="Main" className="page-enter container-page pb-4 md:hidden">
          <ul className="flex flex-col gap-1 rounded-card bg-surface p-2">
            {NAV.map((key) => (
              <li key={key}>
                <NavLink to={href(`/${key}`)} onClick={() => setOpen(false)} className={({ isActive }) => cn('block rounded-card-sm px-4 py-3 text-lg font-bold', isActive ? 'bg-primary-soft' : 'hover:bg-primary-soft/60')}>
                  {t.nav[key]}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
