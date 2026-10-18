import { ArrowUpRight, Check, Copy, Phone } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import type { Profile } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { SocialIcon } from '../ui/SocialIcon'
import { ContactForm } from './ContactForm'

function EmailCard({ email }: { email: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <div className="glass group relative rounded-3xl p-6">
      <p className="eyebrow">{t.contact.write}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <a
          href={`mailto:${email}`}
          className="truncate text-xl font-semibold tracking-tight underline-offset-4 hover:underline sm:text-2xl"
        >
          {email}
        </a>
        <button
          type="button"
          onClick={copy}
          aria-label={t.contact.copy}
          title={copied ? t.contact.copied : t.contact.copy}
          className="relative grid size-10 shrink-0 place-items-center rounded-full border border-line bg-card transition-colors hover:bg-card-hover"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={copied ? 'check' : 'copy'}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <AnimatePresence>
        {copied && (
          <motion.span
            className="absolute -top-3 right-6 rounded-full bg-fg px-3 py-1 text-xs font-medium text-bg"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            {t.contact.copied}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ContactProps {
  profile: Profile
  index: number
  total: number
}

export function Contact({ profile, index, total }: ContactProps) {
  const { t } = useI18n()
  const socials = profile.socials.filter((social) => social.platform !== 'email')

  return (
    <section id="contact" className="relative py-20 md:py-40">
      <div className="container-page">
        <SectionHeading
          index={index}
          total={total}
          eyebrow={t.sections.contact.eyebrow}
          title={t.sections.contact.title}
        />
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="space-y-6 lg:col-span-5">
            {profile.contact_text && <p className="text-lg leading-relaxed text-muted">{profile.contact_text}</p>}
            {profile.email && <EmailCard email={profile.email} />}
            {profile.phone && (
              <a
                href={`tel:${profile.phone.replace(/\s/g, '')}`}
                className="glass flex items-center gap-3 rounded-2xl px-5 py-4 font-medium transition-colors hover:bg-card-hover"
              >
                <Phone className="size-4 text-accent" />
                {profile.phone}
              </a>
            )}
            {socials.length > 0 && (
              <div>
                <p className="eyebrow mb-3">{t.contact.socials}</p>
                <ul className="divide-y divide-line border-y border-line">
                  {socials.map((social) => (
                    <li key={social.url}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 py-4 transition-colors hover:text-fg"
                      >
                        <SocialIcon platform={social.platform} className="size-[18px] text-muted transition-colors group-hover:text-accent" />
                        <span className="flex-1 font-medium">{social.label}</span>
                        <ArrowUpRight className="size-4 text-subtle transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
