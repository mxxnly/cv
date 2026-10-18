import { ArrowUpRight, Award } from 'lucide-react'

import type { Certificate } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { formatDate } from '../../lib/format'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

interface CertificatesProps {
  items: Certificate[]
  index: number
  total: number
}

export function Certificates({ items, index, total }: CertificatesProps) {
  const { t, lang } = useI18n()

  return (
    <section id="certificates" className="relative py-28 md:py-36">
      <div className="container-page">
        <SectionHeading
          index={index}
          total={total}
          eyebrow={t.sections.certificates.eyebrow}
          title={t.sections.certificates.title}
        />
        <Reveal>
          <ul className="glass divide-y divide-line overflow-hidden rounded-3xl">
            {items.map((item) => {
              const content = (
                <>
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-card-hover text-accent">
                    {item.image ? (
                      <img src={item.image} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <Award className="size-5" strokeWidth={1.6} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold tracking-tight">{item.title}</span>
                    <span className="block text-sm text-muted">{item.issuer}</span>
                  </span>
                  {item.issued_at && (
                    <span className="hidden font-mono text-xs tracking-wider text-subtle uppercase sm:block">
                      {formatDate(item.issued_at, lang)}
                    </span>
                  )}
                  {item.credential_url && (
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-line transition-all duration-300 group-hover:border-transparent group-hover:bg-fg group-hover:text-bg"
                      aria-hidden
                    >
                      <ArrowUpRight className="size-4" />
                    </span>
                  )}
                </>
              )
              return (
                <li key={item.id}>
                  {item.credential_url ? (
                    <a
                      href={item.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${item.title} — ${t.certificates.view}`}
                      className="group flex items-center gap-5 p-5 transition-colors hover:bg-card-hover md:px-8"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="flex items-center gap-5 p-5 md:px-8">{content}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
