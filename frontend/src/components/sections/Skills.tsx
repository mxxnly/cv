import type { SkillCategory, SkillLevel } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { LEVEL_FRACTION } from '../../lib/moon'
import { Marquee } from '../ui/Marquee'
import { MoonPhase } from '../ui/MoonPhase'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { SpotlightCard } from '../ui/SpotlightCard'

const LEVELS: SkillLevel[] = [1, 2, 3, 4, 5]

function Legend() {
  const { t } = useI18n()
  return (
    <div className="glass rounded-2xl p-4">
      <p className="eyebrow mb-3">{t.skills.legend}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {LEVELS.map((level) => (
          <li key={level} className="flex items-center gap-1.5 text-xs text-muted">
            <MoonPhase fraction={LEVEL_FRACTION[level]} size={14} />
            {t.skills.levels[level - 1]}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface SkillsProps {
  categories: SkillCategory[]
  featured: string[]
  index: number
  total: number
}

export function Skills({ categories, featured, index, total }: SkillsProps) {
  const { t } = useI18n()
  const half = Math.ceil(featured.length / 2)
  const firstRow = featured.length > 6 ? featured.slice(0, half) : featured
  const secondRow = featured.length > 6 ? featured.slice(half) : [...featured].reverse()

  return (
    <section id="skills" className="relative py-28 md:py-40">
      <div className="container-page">
        <SectionHeading
          index={index}
          total={total}
          eyebrow={t.sections.skills.eyebrow}
          title={t.sections.skills.title}
          aside={<Legend />}
        />
      </div>

      {featured.length > 0 && (
        <Reveal className="mb-20 space-y-3 md:mb-24">
          <Marquee items={firstRow} duration={55} />
          <Marquee items={secondRow} duration={65} reverse />
        </Reveal>
      )}

      <div className="container-page grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category, i) => (
          <Reveal key={category.id} delay={(i % 3) * 0.08} className="h-full">
            <SpotlightCard className="h-full p-7 md:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-2xl font-semibold tracking-tight">{category.name || t.skills.other}</h3>
                <span className="font-mono text-xs text-subtle">{String(category.skills.length).padStart(2, '0')}</span>
              </div>
              {category.description && <p className="mt-2 text-sm text-muted">{category.description}</p>}
              <ul className="mt-6">
                {category.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="group/skill flex items-center justify-between gap-4 border-b border-line py-3 last:border-0"
                  >
                    <span className="font-medium transition-transform duration-300 group-hover/skill:translate-x-1">
                      {skill.name}
                    </span>
                    <span className="flex items-center gap-2.5 text-xs text-subtle">
                      <span className="opacity-0 transition-opacity duration-300 group-hover/skill:opacity-100">
                        {t.skills.levels[skill.level - 1]}
                      </span>
                      <MoonPhase
                        fraction={LEVEL_FRACTION[skill.level]}
                        size={20}
                        title={t.skills.levels[skill.level - 1]}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
