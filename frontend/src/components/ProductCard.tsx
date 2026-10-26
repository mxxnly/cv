import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import type { MinPrice, ProductSummary } from '../api/types'
import { useI18n } from '../i18n/context'
import { cn } from '../lib/cn'
import { trackConversion } from '../lib/consent'
import { formatPrice } from '../lib/format'
import { Button } from './ui/Button'
import { Card, ExampleChip, ProductIconMark, StatusBadge } from './ui/primitives'
import { tintInk } from '../lib/tint'

export function PriceFrom({ price, size = 'md' }: { price: MinPrice | null; size?: 'md' | 'lg' }) {
  const { t, lang } = useI18n()
  if (!price) return <p className="text-sm text-muted">{t.price.notPublished}</p>
  const big = size === 'lg' ? 'text-4xl' : 'text-3xl'
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {price.price !== null ? (
        <>
          <span className="text-sm font-semibold text-muted">{t.price.from}</span>
          <span className={cn('font-bold tracking-tight', big)}>{formatPrice(price.price, price.currency, lang).split(' ')[0]}</span>
          <span className="text-sm font-semibold text-muted">{price.currency} {price.period_label}</span>
        </>
      ) : (
        <span className="text-lg font-bold">{t.price.onRequest}</span>
      )}
      {price.is_example && <ExampleChip />}
    </p>
  )
}

export function PrimaryCta({ product, size = 'md' }: { product: ProductSummary; size?: 'md' | 'sm' }) {
  const { t, href } = useI18n()
  const buyLink = product.links.find((l) => l.kind === 'buy')
  if (product.cta === 'buy' && buyLink) {
    return (
      <Button size={size} href={buyLink.url} onClick={() => trackConversion('checkout', { item_id: product.slug })}>
        {t.cta.buy}
      </Button>
    )
  }
  if (product.cta === 'buy') {
    return <Button size={size} to={href(`/products/${product.slug}#plans`)}>{t.cta.buy}</Button>
  }
  if (product.cta === 'demo') {
    return <Button size={size} to={`${href('/contacts')}?topic=sales&product=${product.slug}`}>{t.cta.demo}</Button>
  }
  return <Button size={size} to={`${href('/contacts')}?product=${product.slug}`}>{t.cta.contact}</Button>
}

export function ProductCard({ product, compact = false }: { product: ProductSummary; compact?: boolean }) {
  const { t, lang, href } = useI18n()
  const detailsHref = href(`/products/${product.slug}`)

  if (compact) {
    return (
      <Link to={detailsHref} className="block">
        <Card tint={product.tint} className="lift h-full">
          <ProductIconMark icon={product.icon} tint={product.tint} />
          <h3 className={cn('mt-5 text-lg font-bold', tintInk(product.tint))}>{product.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {t.status[product.availability]}
            {product.min_price?.price && <> · {t.price.from} {formatPrice(product.min_price.price, product.min_price.currency, lang)} {product.min_price.period_label}</>}
          </p>
        </Card>
      </Link>
    )
  }

  return (
    <Card tint={product.tint} className="lift flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <ProductIconMark icon={product.icon} tint={product.tint} />
        <StatusBadge status={product.availability} />
      </div>
      <h3 className={cn('mt-5 text-2xl', tintInk(product.tint))}>{product.name}</h3>
      <p className="mt-2 text-muted">{product.tagline}</p>
      <div className="mt-6">
        <PriceFrom price={product.min_price} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <PrimaryCta product={product} />
        <Button variant="secondary" to={detailsHref} icon={<ArrowRight className="size-4" />}>{t.cta.details}</Button>
      </div>
    </Card>
  )
}
