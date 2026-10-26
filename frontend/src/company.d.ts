/* Injected at build time by the company plugin in vite.config.ts from config/company.json. */
declare const __COMPANY__: {
  brand: {
    name: string
    logo_name: string
    owner_nick: string
    tagline: Record<string, string>
    description: Record<string, string>
  }
  seller: {
    legal_form: string
    legal_name: string
    legal_name_en: string
    tax_id: string
    address: string
    address_en: string
    country: string
  }
  contacts: { email: string; phone: string; telegram: string; support_hours: Record<string, string> }
  site: { domain: string; default_language: string; languages: string[]; launch_year: number }
  payment: { provider: string; link_base: string; cards_processed_on_site: boolean }
  pricing: { currency: string; refund_days: number; tax_note: Record<string, string> }
  analytics: {
    ga4_measurement_id: string
    ads_conversion_id: string
    ads_conversion_labels: Record<'lead' | 'checkout' | 'purchase', string>
  }
  legal: { documents_status: string; lawyer_reviewed: boolean }
}
declare const __COMPANY_PLACEHOLDERS__: string[]
declare const __SITE_ENV__: 'development' | 'staging' | 'production'
