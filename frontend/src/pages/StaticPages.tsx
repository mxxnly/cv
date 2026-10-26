import { Link, useRouteError } from 'react-router'

import { useSiteContent } from '../api/queries'
import { company } from '../company'
import { InquiryForm } from '../components/InquiryForm'
import { ContactLinks, SellerBlock } from '../components/layout/Footer'
import { Button } from '../components/ui/Button'
import { Card, FAQList, PageHeader } from '../components/ui/primitives'
import { useI18n } from '../i18n/context'
import { useSeo } from '../lib/seo'

// ========== SUPPORT ==========
export function SupportPage() {
  const { t, lang } = useI18n()
  const site = useSiteContent()
  useSeo({ title: t.support.title, description: t.support.lead, path: '/support' })
  return (
    <>
      <PageHeader eyebrow={t.nav.support} title={t.support.title} lead={t.support.lead} />
      <section className="container-page grid gap-6 pb-16 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <Card tint="lavender">
            <p className="eyebrow mb-1">{t.support.sla}</p>
            <p className="font-semibold text-lavender-ink">{site.data?.settings.support_sla ?? t.home.supportCard.text}</p>
          </Card>
          <Card>
            <p className="eyebrow mb-2">{t.support.channels}</p>
            <ContactLinks />
            <p className="mt-3 text-sm text-muted"><span className="font-bold">{t.support.hours}:</span> {company.contacts.support_hours[lang]}</p>
          </Card>
          <div>
            <h2 className="mb-3 text-xl">{t.support.faq}</h2>
            <FAQList items={t.support.faqItems.map((item) => ({ question: item.q, answer: item.a }))} />
          </div>
        </div>
        <InquiryForm kind="support" />
      </section>
    </>
  )
}

// ========== ABOUT ==========
export function AboutPage() {
  const { t, lang } = useI18n()
  const site = useSiteContent()
  useSeo({ title: t.about.title, description: t.about.lead, path: '/about' })
  const about = site.data?.settings.about ?? []
  return (
    <>
      <PageHeader eyebrow={t.nav.about} title={t.about.title} lead={t.about.lead} />
      <section className="container-page grid gap-6 pb-16 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4 text-lg">
          {site.data?.settings.about_is_placeholder && (
            <p className="inline-block rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-ink">{t.about.placeholderNote}</p>
          )}
          {about.length > 0 ? about.map((p) => <p key={p}>{p}</p>) : <p className="text-muted">{company.brand.description[lang]}</p>}
        </div>
        <Card>
          <p className="eyebrow mb-3">{t.about.seller}</p>
          <SellerBlock compact />
        </Card>
      </section>
    </>
  )
}

// ========== CONTACTS ==========
export function ContactsPage() {
  const { t, lang } = useI18n()
  useSeo({ title: t.contacts.title, description: t.contacts.lead, path: '/contacts' })
  return (
    <>
      <PageHeader eyebrow={t.nav.contacts} title={t.contacts.title} lead={t.contacts.lead} />
      <section className="container-page grid gap-6 pb-16 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <Card>
            <ContactLinks />
            <p className="mt-3 text-sm text-muted"><span className="font-bold">{t.contacts.hours}:</span> {company.contacts.support_hours[lang]}</p>
          </Card>
          <Card tint="lavender">
            <p className="eyebrow mb-3">{t.contacts.requisites}</p>
            <SellerBlock compact />
          </Card>
        </div>
        <InquiryForm kind="contact" />
      </section>
    </>
  )
}

// ========== 404 / ERROR ==========
export function NotFoundPage({ message }: { message?: string }) {
  const { t, href } = useI18n()
  useSeo({ title: t.notFound.title, path: '/404', noindex: true })
  return (
    <section className="container-page py-24 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="text-4xl">{t.notFound.title}</h1>
      <p className="mt-3 text-muted">{message ?? t.notFound.text}</p>
      <Button className="mt-8" to={href('/')}>{t.cta.back}</Button>
    </section>
  )
}

export function ErrorPage() {
  const error = useRouteError()
  const status = typeof error === 'object' && error && 'status' in error ? (error as { status: number }).status : 500
  const lang = /^\/en(\/|$)/.test(location.pathname) ? 'en' : 'uk'
  const copy = lang === 'en' ? { title: 'Something went wrong', text: 'The page could not be loaded. Try reloading it.', retry: 'Reload', home: 'Back home' } : { title: 'Щось пішло не так', text: 'Не вдалося завантажити сторінку. Спробуйте оновити її.', retry: 'Оновити', home: 'На головну' }
  if (status === 404) {
    return (
      <section className="container-page py-24 text-center">
        <p className="eyebrow mb-3">404</p>
        <h1 className="text-4xl">{lang === 'en' ? 'Page not found' : 'Сторінку не знайдено'}</h1>
        <Link className="mt-8 inline-flex h-12 items-center rounded-full bg-primary px-6 font-bold text-primary-ink" to={`/${lang}`}>{copy.home}</Link>
      </section>
    )
  }
  return (
    <section className="container-page py-24 text-center">
      <p className="eyebrow mb-3">{status}</p>
      <h1 className="text-4xl">{copy.title}</h1>
      <p className="mt-3 text-muted">{copy.text}</p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-bold text-primary-ink" onClick={() => location.reload()}>{copy.retry}</button>
        <Link className="inline-flex h-12 items-center rounded-full bg-primary-soft px-6 font-bold" to={`/${lang}`}>{copy.home}</Link>
      </div>
    </section>
  )
}
