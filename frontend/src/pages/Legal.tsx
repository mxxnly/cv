import { marked } from 'marked'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'

import { company, companyValue } from '../company'
import { useI18n } from '../i18n/context'
import { fillTokens } from '../lib/format'
import { useSeo } from '../lib/seo'
import { NotFoundPage } from './NotFound'

import cookies from '../content/legal/cookies.uk.md?raw'
import offer from '../content/legal/offer.uk.md?raw'
import privacy from '../content/legal/privacy.uk.md?raw'
import refund from '../content/legal/refund.uk.md?raw'
import terms from '../content/legal/terms.uk.md?raw'

const DOCS = { offer, privacy, terms, refund, cookies } as const
export type LegalDoc = keyof typeof DOCS
const ORDER: LegalDoc[] = ['offer', 'privacy', 'terms', 'refund', 'cookies']

function isLegalDoc(value: string | undefined): value is LegalDoc {
  return value !== undefined && value in DOCS
}

/** Legal texts are Ukrainian drafts; company data is filled from config/company.json tokens. */
export function LegalPage() {
  const { doc } = useParams()
  const { t, lang, href } = useI18n()
  const valid = isLegalDoc(doc)
  const title = valid ? t.legal.docs[doc] : t.notFound.title
  useSeo({ title, path: `/legal/${doc ?? ''}` })

  const html = useMemo(() => {
    if (!valid) return ''
    const text = fillTokens(DOCS[doc], companyValue)
    return marked.parse(text, { async: false }) as string
  }, [doc, valid])

  if (!valid) return <NotFoundPage />

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[14rem_1fr] lg:py-16">
      <nav aria-label={t.footer.legal} className="lg:sticky lg:top-6 lg:self-start">
        <ul className="flex flex-wrap gap-2 lg:flex-col">
          {ORDER.map((key) => (
            <li key={key}>
              <Link to={href(`/legal/${key}`)} aria-current={key === doc ? 'page' : undefined} className={key === doc ? 'inline-block rounded-full bg-primary-soft px-4 py-2 text-sm font-bold' : 'inline-block rounded-full px-4 py-2 text-sm font-semibold text-muted hover:text-ink'}>
                {t.legal.docs[key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="max-w-3xl">
        <p className="mb-6 inline-block rounded-full bg-warning px-3 py-1 text-xs font-bold tracking-wide text-warning-ink uppercase">{t.legal.draft}</p>
        {lang === 'en' && <p className="mb-6 rounded-card-sm bg-lavender px-4 py-3 text-sm text-lavender-ink">{t.legal.enNote}</p>}
        <div lang="uk" className="prose-legal" dangerouslySetInnerHTML={{ __html: html }} />
        <p className="mt-10 text-sm text-muted">{company.brand.name} · {company.seller.legal_name}</p>
      </article>
    </div>
  )
}
