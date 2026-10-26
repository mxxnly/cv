import { Link } from 'react-router'

import { usePrices } from '../api/queries'
import { company } from '../company'
import { PlanCard, PriceNotes } from '../components/PlanCard'
import { Card, PageHeader, Skeleton, StatusBadge } from '../components/ui/primitives'
import { Reveal } from '../components/ui/Reveal'
import { useI18n } from '../i18n/context'
import { formatDate } from '../lib/format'
import { useSeo } from '../lib/seo'

export function PricesPage() {
  const { t, lang, href } = useI18n()
  const prices = usePrices()
  useSeo({ title: t.prices.title, description: t.prices.lead, path: '/prices' })

  return (
    <>
      <PageHeader eyebrow={t.nav.prices} title={t.prices.title} lead={t.prices.lead} />
      <section className="container-page pb-16">
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="text-sm"><p className="eyebrow mb-1">{t.prices.taxes}</p>{prices.data?.tax_note ?? company.pricing.tax_note[lang]}</Card>
          <Card className="text-sm"><p className="eyebrow mb-1">{t.prices.refund}</p>{t.price.refund(prices.data?.refund_days ?? company.pricing.refund_days)}. <Link className="font-bold text-primary" to={href('/legal/refund')}>{t.legal.docs.refund}</Link></Card>
          <Card className="text-sm"><p className="eyebrow mb-1">{t.prices.validity}</p>{t.price.validUntil}: {prices.data?.products.flatMap((p) => p.plans).find((plan) => plan.valid_until)?.valid_until ? formatDate(prices.data?.products.flatMap((p) => p.plans).find((plan) => plan.valid_until)?.valid_until, lang) : '—'}</Card>
          <Card className="text-sm"><p className="eyebrow mb-1">{t.prices.payment}</p>{t.prices.paymentText(company.payment.provider)}</Card>
        </div>

        {prices.isPending && <Skeleton className="h-80" />}
        {prices.data?.products.map((product) => (
          <section key={product.slug} id={product.slug} className="mb-14">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl">{product.name}</h2>
              <StatusBadge status={product.availability} className="bg-primary-soft" />
              <Link className="text-sm font-bold text-primary" to={href(`/products/${product.slug}`)}>{t.cta.details} →</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {product.plans.map((plan, index) => (
              <Reveal key={plan.id} delay={index * 80} className="h-full">
                <PlanCard plan={plan} product={product} />
              </Reveal>
            ))}
            </div>
            <div className="mt-4">
              <PriceNotes taxNote={prices.data?.tax_note} refundDays={prices.data?.refund_days} updatedAt={product.prices_updated_at} note={prices.data?.note} />
            </div>
          </section>
        ))}
        {prices.isSuccess && prices.data.products.length === 0 && <p className="text-muted">{t.price.notPublished}</p>}
      </section>
    </>
  )
}
