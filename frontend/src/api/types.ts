export type Availability = 'available' | 'beta' | 'soon'
export type Tint = 'lavender' | 'periwinkle' | 'mauve'
export type ProductIcon = 'shield' | 'document' | 'box' | 'bot' | 'chart' | 'globe'
export type Cta = 'buy' | 'demo' | 'contact'
export type Period = 'month' | 'year' | 'once' | 'on_request'
export type LinkKind = 'buy' | 'docs' | 'demo' | 'other'

export interface MinPrice {
  price: string | null
  currency: string
  period: Period
  period_label: string
  is_example: boolean
}

export interface Plan extends MinPrice {
  id: number
  slug: string
  name: string
  limit: string
  includes: string[]
  is_recommended: boolean
  valid_until: string | null
  buy_url: string
}

export interface ProductLink {
  kind: LinkKind
  label: string
  url: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ProductSummary {
  id: number
  slug: string
  name: string
  tagline: string
  category: { slug: string; name: string } | null
  availability: Availability
  tint: Tint
  icon: ProductIcon
  cta: Cta
  min_price: MinPrice | null
  has_example_prices: boolean
  links: ProductLink[]
  prices_updated_at: string | null
}

export interface Product extends ProductSummary {
  description: string[]
  features: string[]
  audience: string[]
  support_terms: string[]
  plans: Plan[]
  faq: FAQItem[]
  seo: { title: string; description: string }
}

export interface PriceList {
  currency: string
  tax_note: string
  refund_days: number
  note: string
  products: Product[]
}

export interface Testimonial {
  id: number
  author: string
  role: string
  company: string
  text: string
  language: string
  url: string
  product: string | null
}

export interface SiteContent {
  settings: {
    support_sla: string
    price_note: string
    about: string[]
    about_is_placeholder: boolean
    testimonials_enabled: boolean
  }
  testimonials: Testimonial[]
}

export interface SiteFlags {
  environment: string
  has_placeholders: boolean
  show_test_data_badge: boolean
  indexable: boolean
}

export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  gclid?: string
  landing?: string
  referrer?: string
}

export interface ContactPayload {
  name: string
  email: string
  topic: 'general' | 'sales' | 'partnership'
  message: string
  product?: string | null
  language: string
  attribution: Attribution
  website: string
  turnstile_token?: string
}

export interface SupportPayload {
  name: string
  email: string
  subject: string
  message: string
  product?: string | null
  language: string
  attribution: Attribution
  website: string
  turnstile_token?: string
}

export type FormErrors = Partial<Record<string, string[]>>
