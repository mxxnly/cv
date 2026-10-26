import { Link } from 'react-router'

import { company, isPlaceholder } from '../../company'
import { useI18n } from '../../i18n/context'
import { cn } from '../../lib/cn'
import { useTestDataMode } from '../../lib/testData'
import { openCookieSettings } from '../../lib/cookieSettings'
import { Logo } from './Logo'

const LEGAL = ['offer', 'privacy', 'terms', 'refund', 'cookies'] as const
const NAV = ['products', 'prices', 'support', 'about', 'contacts'] as const

function Placeholder({ path, children }: { path: string; children: React.ReactNode }) {
  const { t } = useI18n()
  const marked = useTestDataMode() && isPlaceholder(path)
  return (
    <span className={cn(marked && 'underline decoration-dotted decoration-warning-ink/60 underline-offset-4')} title={marked ? t.testData.badge : undefined}>
      {children}
    </span>
  )
}

export function SellerBlock({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useI18n()
  const address = lang === 'uk' ? company.seller.address : company.seller.address_en
  const legalName = lang === 'uk' ? company.seller.legal_name : company.seller.legal_name_en
  return (
    <dl className={cn('grid gap-x-6 gap-y-1 text-sm', compact ? 'grid-cols-1' : 'sm:grid-cols-[auto_1fr]')}>
      <dt className="text-muted">{t.footer.tradeName}</dt>
      <dd className="font-semibold">{company.brand.name}</dd>
      <dt className="text-muted">{t.footer.seller}</dt>
      <dd className="font-semibold">{legalName}</dd>
      <dt className="text-muted">{t.contacts.taxId}</dt>
      <dd><Placeholder path="seller.tax_id">{company.seller.tax_id}</Placeholder></dd>
      <dt className="text-muted">{t.contacts.address}</dt>
      <dd><Placeholder path="seller.address">{address}</Placeholder></dd>
    </dl>
  )
}

export function ContactLinks({ className }: { className?: string }) {
  const { t } = useI18n()
  const telegram = company.contacts.telegram.replace(/^@/, '')
  return (
    <ul className={cn('space-y-1 text-sm', className)}>
      <li>
        <span className="text-muted">{t.contacts.email}: </span>
        <a className="font-semibold hover:text-primary" href={`mailto:${company.contacts.email}`}><Placeholder path="contacts.email">{company.contacts.email}</Placeholder></a>
      </li>
      <li>
        <span className="text-muted">{t.contacts.phone}: </span>
        <a className="font-semibold hover:text-primary" href={`tel:${company.contacts.phone.replace(/\s/g, '')}`}><Placeholder path="contacts.phone">{company.contacts.phone}</Placeholder></a>
      </li>
      <li>
        <span className="text-muted">{t.contacts.telegram}: </span>
        <a className="font-semibold hover:text-primary" href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer"><Placeholder path="contacts.telegram">{company.contacts.telegram}</Placeholder></a>
      </li>
    </ul>
  )
}

export function Footer({ minimal = false }: { minimal?: boolean }) {
  const { t, lang, href } = useI18n()
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-line bg-surface/60">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo className="h-6 w-auto" />
          <p className="max-w-xs text-sm text-muted">{company.brand.description[lang]}</p>
          <SellerBlock compact />
        </div>
        {!minimal && (
          <div>
            <h2 className="mb-3 text-sm font-bold">{t.footer.navigation}</h2>
            <ul className="space-y-2 text-sm">
              {NAV.map((key) => (
                <li key={key}><Link className="hover:text-primary" to={href(`/${key}`)}>{t.nav[key]}</Link></li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h2 className="mb-3 text-sm font-bold">{t.footer.legal}</h2>
          <ul className="space-y-2 text-sm">
            {LEGAL.map((doc) => (
              <li key={doc}><Link className="hover:text-primary" to={href(`/legal/${doc}`)}>{t.legal.docs[doc]}</Link></li>
            ))}
            <li><button type="button" className="hover:text-primary" onClick={openCookieSettings}>{t.cookie.manage}</button></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold">{t.footer.contacts}</h2>
          <ContactLinks />
          <p className="mt-3 text-sm text-muted">{company.contacts.support_hours[lang]}</p>
        </div>
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-line py-5 text-xs text-muted sm:flex-row sm:justify-between">
        <p>© {company.site.launch_year === year ? year : `${company.site.launch_year}–${year}`} {company.brand.name} · {lang === 'uk' ? company.seller.legal_name : company.seller.legal_name_en}. {t.footer.rights}.</p>
        <p>{t.footer.pricesExample}</p>
      </div>
    </footer>
  )
}
