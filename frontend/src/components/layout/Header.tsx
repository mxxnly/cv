import { Menu, Moon, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

import { company } from '../../company'
import { useI18n } from '../../i18n/context'
import { cn } from '../../lib/cn'
import { useTestDataMode } from '../../lib/testData'
import { useTheme } from '../../theme/context'
import { Logo } from './Logo'

const NAV = ['products', 'prices', 'support', 'about', 'contacts'] as const

export function Header({ minimal = false }: { minimal?: boolean }) {
  const { t, lang, href } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const showTestDataBadge = useTestDataMode()

  const otherLang = lang === 'uk' ? 'en' : 'uk'
  const otherPath = location.pathname.replace(/^\/(uk|en)(?=\/|$)/, `/${otherLang}`)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn('rounded-sm px-4 py-2 text-[0.95rem] font-semibold transition-colors', isActive ? 'bg-primary-soft text-ink shadow-[inset_0_-3px_0_var(--pink)]' : 'text-muted hover:text-ink')

  return (
    <header className="relative z-40">
      {showTestDataBadge && (
        <div className="bg-warning px-4 py-1 text-center font-mono text-xs font-semibold text-warning-ink" title={t.testData.title}>
          {t.testData.badge}
        </div>
      )}
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-2 sm:gap-4">
        <Link to={href('/')} aria-label={`${company.brand.name}: ${t.nav.home}`} className="shrink-0">
          <Logo className="h-6 w-auto sm:h-8" />
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

        <div className="flex items-center gap-1 sm:gap-1.5">
          <Link to={otherPath} hrefLang={otherLang} lang={otherLang} className="rounded-sm px-2 py-2 text-sm font-bold whitespace-nowrap text-muted hover:text-ink sm:px-3" aria-label={t.lang.switchTo}>
            <span className="text-ink">{lang.toUpperCase()}</span>
            <span aria-hidden> | </span>
            {otherLang.toUpperCase()}
          </Link>
          <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? t.theme.toLight : t.theme.toDark} className="grid size-10 place-items-center sm:size-11 rounded-sm border border-line bg-surface text-ink">
            {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          {!minimal && (
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? t.nav.close : t.nav.menu} className="grid size-10 place-items-center sm:size-11 rounded-sm border border-line bg-surface text-ink md:hidden">
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
                <NavLink to={href(`/${key}`)} onClick={() => setOpen(false)} className={({ isActive }) => cn('block rounded-card-sm px-4 py-3 text-lg font-bold', isActive ? 'bg-primary-soft shadow-[inset_4px_0_0_var(--pink)]' : 'hover:bg-primary-soft/60')}>
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
