import { Clock, LifeBuoy } from 'lucide-react'
import { Link } from 'react-router'

import { useProducts, useSiteContent } from '../api/queries'
import { company } from '../company'
import { InquiryForm } from '../components/InquiryForm'
import { ContactLinks } from '../components/layout/Footer'
import { ProductCard } from '../components/ProductCard'
import { Button } from '../components/ui/Button'
import { Card, Section, Skeleton } from '../components/ui/primitives'
import { useI18n } from '../i18n/context'
import { useSeo } from '../lib/seo'

export function HomePage() {
  const { t, lang, href } = useI18n()
  const products = useProducts()
  const site = useSiteContent()
  useSeo({ title: company.brand.name, description: company.brand.description[lang], path: '/' })

  const featured = products.data?.slice(0, 2) ?? []
  const testimonials = site.data?.testimonials ?? []

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow mb-3">{t.home.eyebrow}</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl">{company.brand.tagline[lang]}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{company.brand.description[lang]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={href('/products')}>{t.cta.catalog}</Button>
            <Button variant="secondary" to={href('/contacts')}>{t.cta.contact}</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {products.isPending && [0, 1].map((i) => <Skeleton key={i} className="h-40" />)}
          {featured.map((product) => <ProductCard key={product.slug} product={product} compact />)}
          <Card className="h-full">
            <span aria-hidden className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary"><LifeBuoy className="size-5" strokeWidth={1.75} /></span>
            <h3 className="mt-5 text-lg font-bold">{t.home.supportCard.title}</h3>
            <p className="mt-1 text-sm text-muted">{site.data?.settings.support_sla ?? t.home.supportCard.text}</p>
          </Card>
          <Card tint="mauve" className="h-full">
            <span aria-hidden className="grid size-11 place-items-center rounded-2xl bg-surface/80 text-mauve-ink"><Clock className="size-5" strokeWidth={1.75} /></span>
            <h3 className="mt-5 text-lg font-bold text-mauve-ink">{t.home.next.title}</h3>
            <p className="mt-1 text-sm text-muted">{t.home.next.text}</p>
          </Card>
        </div>
      </section>

      {/* ========== PRODUCTS ========== */}
      <Section
        eyebrow={t.home.products.eyebrow}
        title={t.home.products.title}
        aside={<Button variant="link" to={href('/products')}>{t.cta.allProducts} →</Button>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {products.isPending && [0, 1].map((i) => <Skeleton key={i} className="h-80" />)}
          {featured.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
        {site.data?.settings.price_note && <p className="mt-4 text-sm text-muted">{site.data.settings.price_note}</p>}
      </Section>

      {/* ========== HOW WE WORK ========== */}
      <Section eyebrow={t.home.how.eyebrow} title={t.home.how.title} lead={t.home.how.lead}>
        <div className="grid gap-4 md:grid-cols-3">
          {t.home.how.items.map((item, index) => (
            <Card key={item.title}>
              <p className="eyebrow">0{index + 1}</p>
              <h3 className="mt-3 text-xl">{item.title}</h3>
              <p className="mt-2 text-muted">{item.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ========== TESTIMONIALS (only real ones; hidden while empty) ========== */}
      {testimonials.length > 0 && (
        <Section eyebrow={t.home.testimonials.eyebrow} title={t.home.testimonials.title}>
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((item) => (
              <Card key={item.id} tint="lavender">
                <p className="text-lg">“{item.text}”</p>
                <p className="mt-4 text-sm font-bold">{item.author}</p>
                <p className="text-sm text-muted">{[item.role, item.company].filter(Boolean).join(', ')}</p>
                {item.url && <a className="mt-2 inline-block text-sm text-primary" href={item.url} target="_blank" rel="noopener noreferrer">↗</a>}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ========== CONTACT ========== */}
      <Section id="contact" eyebrow={t.home.contact.eyebrow} title={t.home.contact.title} lead={t.home.contact.lead}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <Card>
              <ContactLinks />
              <p className="mt-3 text-sm text-muted">{company.contacts.support_hours[lang]}</p>
            </Card>
            <p className="text-sm text-muted">
              <Link className="font-bold text-primary" to={href('/support')}>{t.nav.support}</Link> · <Link className="font-bold text-primary" to={href('/contacts')}>{t.nav.contacts}</Link>
            </p>
          </div>
          <InquiryForm kind="contact" />
        </div>
      </Section>
    </>
  )
}
