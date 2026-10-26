/* Company data injected at build time from config/company.json (see vite.config.ts). */

export const company = __COMPANY__
export const companyPlaceholders: readonly string[] = __COMPANY_PLACEHOLDERS__
export const siteEnv = __SITE_ENV__

export const hasPlaceholders = companyPlaceholders.length > 0
/** The «Тестові дані» badge is shown only outside production and only while placeholders remain. */
export const showTestDataBadge = siteEnv !== 'production' && hasPlaceholders

export function isPlaceholder(path: string): boolean {
  return companyPlaceholders.includes(path)
}

/** Dotted lookup into the company data, e.g. `companyValue('contacts.email')`. */
export function companyValue(path: string): string {
  let node: unknown = company
  for (const part of path.split('.')) {
    if (node && typeof node === 'object' && part in node) node = (node as Record<string, unknown>)[part]
    else return ''
  }
  return typeof node === 'string' || typeof node === 'number' ? String(node) : ''
}

export const siteOrigin = `https://${company.site.domain}`
