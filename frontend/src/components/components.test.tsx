import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'

import type { ProductSummary } from '../api/types'
import { I18nContext, makeI18n } from '../i18n/context'
import { validate } from '../lib/validation'
import { PriceFrom, ProductCard } from './ProductCard'
import { ExampleChip, StatusBadge } from './ui/primitives'

const product: ProductSummary = {
  id: 1,
  slug: 'vpn',
  name: 'MXXNLY VPN',
  tagline: 'Шифроване з’єднання',
  category: null,
  availability: 'available',
  tint: 'periwinkle',
  icon: 'shield',
  cta: 'buy',
  min_price: { price: '5.00', currency: 'USD', period: 'month', period_label: '/ міс', is_example: true },
  has_example_prices: true,
  links: [],
  prices_updated_at: '2026-10-26T00:00:00Z',
}

function wrap(ui: React.ReactNode, lang: 'uk' | 'en' = 'uk') {
  return render(
    <MemoryRouter>
      <I18nContext value={makeI18n(lang)}>{ui}</I18nContext>
    </MemoryRouter>,
  )
}

describe('PriceFrom', () => {
  it('shows the price, the currency and the «приклад» label', () => {
    wrap(<PriceFrom price={product.min_price} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/USD/)).toBeInTheDocument()
    expect(screen.getByText('приклад')).toBeInTheDocument()
  })
  it('explains when prices are not published yet', () => {
    wrap(<PriceFrom price={null} />, 'en')
    expect(screen.getByText(/not published yet/)).toBeInTheDocument()
  })
})

describe('ProductCard', () => {
  it('links to the product page and shows the status', () => {
    wrap(<ProductCard product={product} />)
    expect(screen.getByRole('link', { name: /Детальніше/ })).toHaveAttribute('href', '/uk/products/vpn')
    expect(screen.getByText('Доступний')).toBeInTheDocument()
  })
})

describe('badges', () => {
  it('render localized labels', () => {
    wrap(<><StatusBadge status="beta" /><ExampleChip /></>, 'en')
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('example')).toBeInTheDocument()
  })
})

describe('form validation', () => {
  const t = makeI18n('uk').t
  const base = { name: 'Ок', email: 'a@b.co', subject: 'Тема', topic: 'general' as const, product: '', message: 'Десять символів тут', website: '' }
  it('accepts a valid contact form', () => {
    expect(validate(base, 'contact', t)).toEqual({})
  })
  it('reports every invalid field', () => {
    const errors = validate({ ...base, name: 'A', email: 'nope', message: 'short', subject: '' }, 'support', t)
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'subject'])
  })
})
