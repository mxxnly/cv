import type { Language } from '../api/types'
import type { Dictionary } from '../i18n/strings'

const LOCALES: Record<Language, string> = { uk: 'uk-UA', en: 'en-US' }

export function formatMonthYear(isoDate: string, lang: Language): string {
  const formatted = new Intl.DateTimeFormat(LOCALES[lang], { month: 'short', year: 'numeric' })
    .format(new Date(`${isoDate}T00:00:00`))
  // Ukrainian locale appends "р." (year): "бер. 2024 р." → "бер. 2024"
  return formatted.replace(/\s?р\.$/, '')
}

export function formatDate(isoDate: string, lang: Language): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { month: 'long', year: 'numeric' })
    .format(new Date(`${isoDate}T00:00:00`))
    .replace(/\s?р\.$/, '')
}

/** Human duration between two dates, inclusive of the starting month: "2 yr 3 mo" */
export function formatDuration(
  start: string,
  end: string | null,
  t: Dictionary,
  now: Date = new Date(),
): string {
  const from = new Date(`${start}T00:00:00`)
  const to = end ? new Date(`${end}T00:00:00`) : now
  const totalMonths = Math.max(
    1,
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1,
  )
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  return [years && t.duration.years(years), months && t.duration.months(months)]
    .filter(Boolean)
    .join(' ')
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}
