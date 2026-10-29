import { marked } from 'marked'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'

import { company, companyValue } from '../company'
import { useI18n } from '../i18n/context'
import { fillTokens } from '../lib/format'
import { useSeo } from '../lib/seo'
import { NotFoundPage } from './NotFound'

import cookiesEn from '../content/legal/cookies.en.md?raw'
import cookiesUk from '../content/legal/cookies.uk.md?raw'
import offerEn from '../content/legal/offer.en.md?raw'
import offerUk from '../content/legal/offer.uk.md?raw'
import privacyEn from '../content/legal/privacy.en.md?raw'
import privacyUk from '../content/legal/privacy.uk.md?raw'
import refundEn from '../content/legal/refund.en.md?raw'
import refundUk from '../content/legal/refund.uk.md?raw'
import termsEn from '../content/legal/terms.en.md?raw'
import termsUk from '../content/legal/terms.uk.md?raw'

/* Ukrainian is the legally binding version; English files are courtesy translations. */
const DOCS = {
  offer: { uk: offerUk, en: offerEn },
  privacy: { uk: privacyUk, en: privacyEn },
  terms: { uk: termsUk, en: termsEn },
  refund: { uk: refundUk, en: refundEn },
  cookies: { uk: cookiesUk, en: cookiesEn },
} as const
export type LegalDoc = keyof typeof DOCS
const ORDER: LegalDoc[] = ['offer', 'privacy', 'terms', 'refund', 'cookies']

function isLegalDoc(value: string | undefined): value is LegalDoc {
  return value !== undefined && value in DOCS
}

/** Legal drafts in both languages; company data is filled from config/company.json tokens. */
export function LegalPage() {
  const { doc } = useParams()
  const { t, lang, href } = useI18n()
  const valid = isLegalDoc(doc)
  const title = valid ? t.legal.docs[doc] : t.notFound.title
  useSeo({ title, path: `/legal/${doc ?? ''}` })

  const html = useMemo(() => {
    if (!valid) return ''
    const text = fillTokens(DOCS[doc][lang] || DOCS[doc].uk, companyValue)
    return marked.parse(text, { async: false }) as string
  }, [doc, lang, valid])

  if (!valid) return <NotFoundPage />

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[14rem_1fr] lg:py-16">
      <nav aria-label={t.footer.legal} className="lg:sticky lg:top-6 lg:self-start">
        <ul className="flex flex-wrap gap-2 lg:flex-col">
          {ORDER.map((key) => (
            <li key={key}>
              <Link to={href(`/legal/${key}`)} aria-current={key === doc ? 'page' : undefined} className={key === doc ? 'inline-block rounded-sm bg-primary-soft px-4 py-2 text-sm font-bold' : 'inline-block rounded-sm px-4 py-2 text-sm font-semibold text-muted hover:text-ink'}>
                {t.legal.docs[key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="max-w-3xl">
        <p className="mb-6 inline-block rounded-sm bg-warning px-3 py-1 text-xs font-bold tracking-wide text-warning-ink uppercase">{t.legal.draft}</p>
        <div lang={lang} className="prose-legal" dangerouslySetInnerHTML={{ __html: html }} />
        <p className="mt-10 text-sm text-muted">{company.brand.name} · {lang === 'uk' ? company.seller.legal_name : company.seller.legal_name_en}</p>
      </article>
    </div>
  )
}
