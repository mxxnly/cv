import type {
  ContactPayload,
  FormErrors,
  PriceList,
  Product,
  ProductSummary,
  SiteContent,
  SiteFlags,
  SupportPayload,
} from './types'

export class ApiError extends Error {
  readonly status: number
  readonly errors: FormErrors

  constructor(status: number, errors: FormErrors = {}) {
    super(`API request failed with status ${status}`)
    this.status = status
    this.errors = errors
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, body as FormErrors)
  return body as T
}

const withLang = (path: string, lang: string) => `${path}?lang=${lang}`

export const api = {
  products: (lang: string) => request<ProductSummary[]>(withLang('/api/products/', lang)),
  product: (slug: string, lang: string) => request<Product>(withLang(`/api/products/${slug}/`, lang)),
  prices: (lang: string) => request<PriceList>(withLang('/api/prices/', lang)),
  site: (lang: string) => request<SiteContent>(withLang('/api/site/', lang)),
  flags: () => request<{ flags: SiteFlags }>('/api/company/').then((data) => data.flags),
  contact: (payload: ContactPayload) =>
    request<{ ok: boolean }>('/api/contact/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  support: (payload: SupportPayload) =>
    request<{ ok: boolean }>('/api/support/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
}
