import { useState } from 'react'
import { Link } from 'react-router'

import { useProducts } from '../api/queries'
import type { Availability } from '../api/types'
import { PriceNotes } from '../components/PlanCard'
import { ProductCard } from '../components/ProductCard'
import { PageHeader, Skeleton } from '../components/ui/primitives'
import { Reveal } from '../components/ui/Reveal'
import { useI18n } from '../i18n/context'
import { cn } from '../lib/cn'
import { useSeo } from '../lib/seo'

type Filter = 'all' | Availability

export function ProductsPage() {
  const { t, href } = useI18n()
  const products = useProducts()
  const [filter, setFilter] = useState<Filter>('all')
  useSeo({ title: t.catalog.title, description: t.catalog.lead, path: '/products' })

  const visible = (products.data ?? []).filter((p) => filter === 'all' || p.availability === filter)
  const hasSoon = (products.data ?? []).some((p) => p.availability === 'soon')

  return (
    <>
      <PageHeader eyebrow={t.nav.products} title={t.catalog.title} lead={t.catalog.lead}>
        <div role="group" aria-label={t.catalog.category} className="mt-6 flex flex-wrap gap-2">
          {(['all', 'available', 'beta', 'soon'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn('h-11 rounded-full px-5 text-sm font-bold transition-colors', filter === key ? 'bg-primary text-primary-ink' : 'bg-primary-soft text-ink')}
            >
              {t.catalog.filters[key]}
            </button>
          ))}
        </div>
      </PageHeader>

      <section className="container-page pb-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="h-96" />)}
          {visible.map((product, index) => (
            <Reveal key={product.slug} delay={index * 70} className="h-full">
              <ProductCard product={product} />
            </Reveal>
          ))}
          {products.isSuccess && !hasSoon && (filter === 'all' || filter === 'soon') && (
            <div className="flex min-h-64 flex-col justify-center rounded-card border-2 border-dashed border-line p-6 sm:p-7">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-mauve px-2.5 py-1 text-xs font-bold text-mauve-ink">{t.status.soon}</span>
              <h3 className="mt-4 text-2xl text-muted">{t.catalog.nextTitle}</h3>
              <p className="mt-2 text-muted">{t.catalog.nextText}</p>
              <Link className="mt-4 font-bold text-primary" to={`${href('/contacts')}?topic=general`}>{t.cta.notify} →</Link>
            </div>
          )}
        </div>
        {products.isSuccess && visible.length === 0 && (hasSoon || filter !== 'soon') && <p className="mt-6 text-muted">{t.catalog.empty}</p>}
        <div className="mt-6">
          <PriceNotes />
        </div>
      </section>
    </>
  )
}
