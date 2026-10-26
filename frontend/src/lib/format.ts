import type { Language } from '../i18n/strings'

const LOCALES: Record<Language, string> = { uk: 'uk-UA', en: 'en-US' }

/** `formatPrice('5.00', 'USD', 'uk')` → `5 USD`; decimals are shown only when needed. */
export function formatPrice(amount: string | number | null, currency: string, lang: Language): string {
  if (amount === null || amount === '') return ''
  const value = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(value)) return ''
  const digits = Number.isInteger(value) ? 0 : 2
  const number = new Intl.NumberFormat(LOCALES[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
  return `${number} ${currency}`
}

export function formatDate(iso: string | null | undefined, lang: Language): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALES[lang], { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

/** Replaces `{{dotted.path}}` tokens with values from a lookup function. */
export function fillTokens(text: string, lookup: (path: string) => string): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => lookup(path) || `{{${path}}}`)
}
