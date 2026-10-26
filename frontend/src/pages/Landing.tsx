import { useParams } from 'react-router'

import { ApiError } from '../api/client'
import { useProduct } from '../api/queries'
import { PlanCard, PriceNotes } from '../components/PlanCard'
import { PriceFrom, PrimaryCta } from '../components/ProductCard'
import { SellerBlock } from '../components/layout/Footer'
import { Button } from '../components/ui/Button'
import { Card, FAQList, ProductIconMark, Skeleton, StatusBadge } from '../components/ui/primitives'
import { tintBg, tintInk } from '../lib/tint'
import { useI18n } from '../i18n/context'
import { cn } from '../lib/cn'
import { useSeo } from '../lib/seo'
import { NotFoundPage } from './NotFound'

/**
 * Campaign landing page template: /:lang/lp/:slug. Same data as the product page, no site
 * navigation, one primary action, prices with their conditions, seller details. Use it as the
 * final URL of an ad group and keep the ad copy consistent with what is shown here.
 */
export function LandingPage() {
  const { slug = '' } = useParams()
  const { t, href } = useI18n()
  const query = useProduct(slug)
  const product = query.data
  useSeo({ title: product?.seo.title ?? t.nav.products, description: product?.seo.description, path: `/lp/${slug}`, noindex: true })

  if (query.isError) return <NotFoundPage message={query.error instanceof ApiError && query.error.status === 404 ? t.product.notFound : t.error.text} />
  if (!product) return <div className="container-page py-16"><Skeleton className="h-96" /></div>

  return (
    <>
      <section className={cn('rounded-b-[2rem]', tintBg(product.tint))}>
        <div className="container-page grid gap-8 py-14 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <ProductIconMark icon={product.icon} tint={product.tint} />
              <StatusBadge status={product.availability} />
            </div>
            <h1 className={cn('mt-5 text-4xl sm:text-5xl lg:text-6xl', tintInk(product.tint))}>{product.name}</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">{product.tagline}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {product.features.slice(0, 4).map((item) => <li key={item} className="rounded-card-sm bg-surface/70 px-4 py-3 text-sm">{item}</li>)}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryCta product={product} />
              <Button variant="link" to="#plans">{t.cta.allPrices} ↓</Button>
            </div>
          </div>
          <Card>
            <PriceFrom price={product.min_price} size="lg" />
            <p className="mt-3 text-sm text-muted">{t.landing.legalNote}</p>
          </Card>
        </div>
      </section>

      <section id="plans" className="container-page py-12 sm:py-16">
        <h2 className="mb-6 text-3xl">{t.product.plans.title}</h2>
        {product.plans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {product.plans.map((plan) => <PlanCard key={plan.id} plan={plan} product={product} />)}
          </div>
        ) : (
          <p className="text-muted">{t.price.notPublished}</p>
        )}
        <div className="mt-6"><PriceNotes updatedAt={product.prices_updated_at} /></div>
        <p className="mt-4 text-sm"><Button variant="link" to={href('/prices')}>{t.landing.pricesLink} →</Button></p>
      </section>

      {product.faq.length > 0 && (
        <section className="container-page pb-12">
          <h2 className="mb-6 text-3xl">{t.product.faq.title}</h2>
          <FAQList items={product.faq} />
        </section>
      )}

      <section className="container-page pb-16">
        <Card tint="lavender" className="max-w-xl">
          <p className="eyebrow mb-3">{t.contacts.requisites}</p>
          <SellerBlock compact />
        </Card>
      </section>
    </>
  )
}
