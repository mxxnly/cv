import type { Testimonial } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { initials } from '../../lib/format'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { SpotlightCard } from '../ui/SpotlightCard'

interface TestimonialsProps {
  items: Testimonial[]
  index: number
  total: number
}

export function Testimonials({ items, index, total }: TestimonialsProps) {
  const { t } = useI18n()

  return (
    <section id="testimonials" className="relative py-20 md:py-36">
      <div className="container-page">
        <SectionHeading
          index={index}
          total={total}
          eyebrow={t.sections.testimonials.eyebrow}
          title={t.sections.testimonials.title}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item, i) => {
            const subtitle = [item.role, item.company].filter(Boolean).join(' · ')
            const author = (
              <span className="flex items-center gap-4">
                {item.avatar ? (
                  <img src={item.avatar} alt="" loading="lazy" className="size-12 rounded-full object-cover ring-1 ring-line" />
                ) : (
                  <span className="grid size-12 place-items-center rounded-full bg-card-hover font-serif text-xl italic ring-1 ring-line">
                    {initials(item.author)}
                  </span>
                )}
                <span>
                  <span className="block font-semibold">{item.author}</span>
                  {subtitle && <span className="block text-sm text-muted">{subtitle}</span>}
                </span>
              </span>
            )
            return (
              <Reveal key={item.id} delay={(i % 2) * 0.1} className="h-full">
                <SpotlightCard className="flex h-full flex-col p-8 md:p-10">
                  <span aria-hidden className="text-aurora font-serif text-7xl leading-[0.6] italic">
                    “
                  </span>
                  <blockquote className="mt-4 flex-1 font-serif text-[1.55rem] leading-[1.35] font-medium tracking-[-0.01em] italic md:text-[1.8rem]">
                    {item.text}
                  </blockquote>
                  <div className="mt-8 border-t border-line pt-6">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                        {author}
                      </a>
                    ) : (
                      author
                    )}
                  </div>
                </SpotlightCard>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
