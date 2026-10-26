import { Check } from 'lucide-react'

import type { Plan, Product } from '../api/types'
import { company } from '../company'
import { useI18n } from '../i18n/context'
import { cn } from '../lib/cn'
import { trackConversion } from '../lib/consent'
import { formatDate, formatPrice } from '../lib/format'
import { Button } from './ui/Button'
import { ExampleChip } from './ui/primitives'

export function PlanCard({ plan, product }: { plan: Plan; product: Product }) {
  const { t, lang, href } = useI18n()
  const onRequest = plan.price === null
  return (
    <article className={cn('lift relative flex flex-col rounded-card bg-surface p-6', plan.is_recommended && 'ring-2 ring-primary')}>
      {plan.is_recommended && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-ink">{t.price.recommended}</span>
      )}
      <h3 className="text-xl">{plan.name}</h3>
      {plan.limit && <p className="mt-1 text-sm text-muted">{plan.limit}</p>}
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {onRequest ? (
          <span className="text-2xl font-bold">{t.price.onRequest}</span>
        ) : (
          <>
            <span className="text-4xl font-bold tracking-tight">{formatPrice(plan.price, plan.currency, lang).split(' ')[0]}</span>
            <span className="text-sm font-semibold text-muted">{plan.currency} {plan.period_label}</span>
          </>
        )}
        {plan.is_example && <ExampleChip />}
      </p>
      {plan.includes.length > 0 && (
        <ul className="mt-5 space-y-2 text-sm">
          {plan.includes.map((item) => (
            <li key={item} className="flex gap-2">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-col gap-2 pt-2">
        {onRequest || product.cta !== 'buy' ? (
          <Button to={`${href('/contacts')}?topic=sales&product=${product.slug}&plan=${plan.slug}`} variant={plan.is_recommended ? 'primary' : 'secondary'}>
            {product.cta === 'demo' ? t.cta.demo : t.cta.contact}
          </Button>
        ) : (
          <Button href={plan.buy_url} variant={plan.is_recommended ? 'primary' : 'secondary'} onClick={() => trackConversion('checkout', { item_id: `${product.slug}/${plan.slug}`, value: Number(plan.price), currency: plan.currency })}>
            {t.cta.buy}
          </Button>
        )}
        {plan.valid_until && (
          <p className="text-xs text-muted">{t.price.validUntil} {formatDate(plan.valid_until, lang)}</p>
        )}
      </div>
    </article>
  )
}

/** Tax, refund and payment notes that must sit next to every price (Google Ads transparency). */
export function PriceNotes({ taxNote, refundDays, updatedAt, note }: { taxNote?: string; refundDays?: number; updatedAt?: string | null; note?: string }) {
  const { t, lang } = useI18n()
  const tax = taxNote ?? company.pricing.tax_note[lang]
  const days = refundDays ?? company.pricing.refund_days
  return (
    <div className="rounded-card bg-mauve px-6 py-4 text-sm text-mauve-ink">
      <p>{tax}. {t.price.refund(days)}. {t.prices.paymentText(company.payment.provider)}</p>
      {note && <p className="mt-1">{note}</p>}
      {updatedAt && <p className="mt-1">{t.price.updated}: {formatDate(updatedAt, lang)}</p>}
    </div>
  )
}
