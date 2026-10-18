import { AnimatePresence } from 'motion/react'

import { usePortfolio } from './api/queries'
import type { Portfolio, Profile } from './api/types'
import { Footer } from './components/layout/Footer'
import { Navbar, type NavSection } from './components/layout/Navbar'
import { About } from './components/sections/About'
import { Certificates } from './components/sections/Certificates'
import { Contact } from './components/sections/Contact'
import { Experience } from './components/sections/Experience'
import { Hero } from './components/sections/Hero'
import { Projects } from './components/sections/projects/Projects'
import { Skills } from './components/sections/Skills'
import { Testimonials } from './components/sections/Testimonials'
import { SkyBackground } from './components/sky/SkyBackground'
import { Loader } from './components/states/Loader'
import { ErrorScreen, SetupScreen } from './components/states/StatusScreen'
import { useDocumentMeta } from './hooks/useDocumentMeta'
import { I18nProvider } from './i18n/I18nProvider'
import { useI18n } from './i18n/context'
import { SmoothScroll } from './lib/SmoothScroll'

type SectionId = NavSection | 'certificates' | 'testimonials'

/** Sections with content, in page order. Empty ones are skipped and the numbering adapts. */
function visibleSections(data: Portfolio, profile: Profile): SectionId[] {
  const candidates: [SectionId, boolean][] = [
    ['about', Boolean(profile.about || profile.stats.length || data.services.length)],
    ['skills', data.skill_categories.length > 0 || data.featured_skills.length > 0],
    ['experience', data.experience.length > 0],
    ['projects', data.projects.length > 0],
    ['certificates', data.certificates.length > 0],
    ['testimonials', data.testimonials.length > 0],
    ['contact', true],
  ]
  return candidates.filter(([, visible]) => visible).map(([id]) => id)
}

const NAV_SECTIONS: NavSection[] = ['about', 'skills', 'experience', 'projects', 'contact']

function SkipLink() {
  const { t } = useI18n()
  return (
    <a
      href="#main"
      className="glass fixed top-4 left-4 z-[100] -translate-y-24 rounded-full px-4 py-2 text-sm font-medium transition-transform focus:translate-y-0"
    >
      {t.skipToContent}
    </a>
  )
}

function Site({ data, profile }: { data: Portfolio; profile: Profile }) {
  useDocumentMeta(profile)
  const sections = visibleSections(data, profile)
  const total = sections.length
  const numberOf = (id: SectionId) => sections.indexOf(id) + 1
  const has = (id: SectionId) => sections.includes(id)
  const navSections = NAV_SECTIONS.filter(has)

  return (
    <I18nProvider lang={profile.language}>
      <SkipLink />
      <Navbar brand={profile.brand} sections={navSections} socials={profile.socials} />
      <main id="main" className="relative z-10">
        <Hero profile={profile} />
        {has('about') && (
          <About profile={profile} services={data.services} index={numberOf('about')} total={total} />
        )}
        {has('skills') && (
          <Skills
            categories={data.skill_categories}
            featured={data.featured_skills}
            index={numberOf('skills')}
            total={total}
          />
        )}
        {has('experience') && (
          <Experience items={data.experience} index={numberOf('experience')} total={total} />
        )}
        {has('projects') && (
          <Projects
            projects={data.projects}
            categories={data.project_categories}
            index={numberOf('projects')}
            total={total}
          />
        )}
        {has('certificates') && (
          <Certificates items={data.certificates} index={numberOf('certificates')} total={total} />
        )}
        {has('testimonials') && (
          <Testimonials items={data.testimonials} index={numberOf('testimonials')} total={total} />
        )}
        <Contact profile={profile} index={numberOf('contact')} total={total} />
      </main>
      <Footer profile={profile} />
    </I18nProvider>
  )
}

export function App() {
  const { data, isPending, isError, refetch } = usePortfolio()

  return (
    <SmoothScroll>
      <SkyBackground />
      <div aria-hidden className="grain" />
      <AnimatePresence>{isPending && <Loader key="loader" />}</AnimatePresence>
      {isError && <ErrorScreen onRetry={() => void refetch()} />}
      {data && (data.profile ? <Site data={data} profile={data.profile} /> : <SetupScreen />)}
    </SmoothScroll>
  )
}
