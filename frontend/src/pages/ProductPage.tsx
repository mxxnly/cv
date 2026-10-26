import { ArrowUpRight } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { ApiError } from '../api/client'
import { useProduct } from '../api/queries'
import type { Product } from '../api/types'
import { company, siteOrigin } from '../company'
import { PlanCard, PriceNotes } from '../components/PlanCard'
import { PriceFrom, PrimaryCta } from '../components/ProductCard'
import { Button } from '../components/ui/Button'
import { Card, FAQList, ProductIconMark, Section, Skeleton, StatusBadge } from '../components/ui/primitives'
import { tintBg, tintInk } from '../lib/tint'
import { Reveal } from '../components/ui/Reveal'
import { useI18n } from '../i18n/context'
import { cn } from '../lib/cn'
import { localizedUrl, organizationJsonLd, useSeo } from '../lib/seo'
import { NotFoundPage } from './NotFound'

function productJsonLd(product: Product, lang: 'uk' | 'en') {
  const offers = product.plans
    .filter((plan) => plan.price !== null)
    .map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price,
      priceCurrency: plan.currency,
      url: localizedUrl(`/products/${product.slug}`, lang),
      availability: product.availability === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      ...(plan.valid_until ? { priceValidUntil: plan.valid_until } : {}),
    }))
  return [
    organizationJsonLd(lang),
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.tagline,
      brand: { '@type': 'Brand', name: company.brand.name },
      image: `${siteOrigin}/og-image.png`,
      ...(offers.length ? { offers } : {}),
    },
  ]
}

export function ProductPage() {
  const { slug = '' } = useParams()
  const { t, lang, href } = useI18n()
  const query = useProduct(slug)
  const product = query.data
  useSeo({
    title: product?.seo.title ?? t.nav.products,
    description: product?.seo.description,
    path: `/products/${slug}`,
    type: 'product',
    jsonLd: product ? productJsonLd(product, lang) : undefined,
  })

  if (query.isError && query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage message={t.product.notFound} />
  if (query.isError) return <NotFoundPage message={t.error.text} />
  if (!product) {
    return (
      <div className="container-page space-y-4 py-16">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const docs = product.links.filter((l) => l.kind === 'docs')
  const demo = product.links.filter((l) => l.kind === 'demo')

  return (
    <>
      <section className={cn('rounded-b-[2rem]', tintBg(product.tint))}>
        <div className="container-page py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
            <Link to={href('/')} className="hover:text-ink">{t.nav.home}</Link> / <Link to={href('/products')} className="hover:text-ink">{t.nav.products}</Link> / <span className="text-ink">{product.name}</span>
          </nav>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <ProductIconMark icon={product.icon} tint={product.tint} />
                <StatusBadge status={product.availability} />
              </div>
              <h1 className={cn('mt-5 text-4xl sm:text-5xl', tintInk(product.tint))}>{product.name}</h1>
              <p className="mt-4 max-w-2xl text-lg text-muted">{product.tagline}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryCta product={product} />
                {docs.map((link) => <Button key={link.url} variant="secondary" href={link.url} icon={<ArrowUpRight className="size-4" />}>{link.label || t.cta.docs}</Button>)}
                {demo.map((link) => <Button key={link.url} variant="link" href={link.url}>{link.label || t.cta.demoLink} ↗</Button>)}
              </div>
            </div>
            <Card className="lg:justify-self-end">
              <PriceFrom price={product.min_price} size="lg" />
              {product.prices_updated_at && (
                <p className="mt-3 text-sm text-muted">{t.price.updated}: {new Date(product.prices_updated_at).toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US')}</p>
              )}
              {product.plans.length > 0 && <Button className="mt-4" variant="link" to="#plans">{t.cta.allPrices} ↓</Button>}
            </Card>
          </div>
        </div>
      </section>

      {product.description.length > 0 && (
        <section className="container-page max-w-3xl py-12 text-lg">
          {product.description.map((paragraph) => <p key={paragraph} className="mb-4 whitespace-pre-line">{paragraph}</p>)}
        </section>
      )}

      <div className="container-page grid gap-10 pb-6 lg:grid-cols-2">
        {product.features.length > 0 && (
          <div>
            <p className="eyebrow mb-2">{t.product.features.eyebrow}</p>
            <h2 className="text-3xl">{t.product.features.title}</h2>
            <ul className="mt-6 grid gap-3">
              {product.features.map((item, index) => (
                <li key={item} className="flex gap-4 rounded-card-sm bg-surface px-5 py-4"><span className="font-bold text-primary">{index + 1}</span>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {product.audience.length > 0 && (
          <div>
            <p className="eyebrow mb-2">{t.product.audience.eyebrow}</p>
            <h2 className="text-3xl">{t.product.audience.title}</h2>
            <ul className="mt-6 grid gap-3">
              {product.audience.map((item) => (
                <li key={item} className="rounded-card-sm bg-lavender px-5 py-4 text-lavender-ink">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Section id="plans" eyebrow={t.product.plans.eyebrow} title={t.product.plans.title}>
        {product.plans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {product.plans.map((plan, index) => (
              <Reveal key={plan.id} delay={index * 80} className="h-full">
                <PlanCard plan={plan} product={product} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-muted">{t.price.notPublished}</p>
        )}
        <div className="mt-6">
          <PriceNotes updatedAt={product.prices_updated_at} />
        </div>
      </Section>

      {product.faq.length > 0 && (
        <Section eyebrow={t.product.faq.eyebrow} title={t.product.faq.title}>
          <FAQList items={product.faq} />
        </Section>
      )}

      {product.support_terms.length > 0 && (
        <Section eyebrow={t.product.support.eyebrow} title={t.product.support.title}>
          <Card className="max-w-3xl">
            {product.support_terms.map((paragraph) => <p key={paragraph} className="mb-3 last:mb-0">{paragraph}</p>)}
            <Link className="mt-4 inline-block font-bold text-primary" to={href('/support')}>{t.nav.support} →</Link>
          </Card>
        </Section>
      )}
    </>
  )
}
