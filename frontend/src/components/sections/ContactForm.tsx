import { ArrowRight, LoaderCircle } from 'lucide-react'
import { AnimatePresence, animate, motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { ApiError } from '../../api/client'
import { useContactMutation } from '../../api/queries'
import type { ContactPayload } from '../../api/types'
import { useI18n } from '../../i18n/context'
import { cn } from '../../lib/cn'
import { moonPhasePath } from '../../lib/moon'
import { EASE_OUT_EXPO } from '../../lib/motion'
import { Button } from '../ui/Button'

type Field = 'name' | 'email' | 'subject' | 'message'
type Errors = Partial<Record<Field, string>>

const EMPTY: ContactPayload = { name: '', email: '', subject: '', message: '', website: '' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** A moon that waxes to full — the success state of the form. */
function FullMoon() {
  const pathRef = useRef<SVGPathElement>(null)
  useEffect(() => {
    const controls = animate(0.02, 1, {
      duration: 1.6,
      ease: EASE_OUT_EXPO,
      onUpdate: (value) => pathRef.current?.setAttribute('d', moonPhasePath(value, 30, 40, 40)),
    })
    return () => controls.stop()
  }, [])
  return (
    <svg viewBox="0 0 80 80" className="size-24 drop-shadow-[0_0_30px_var(--glow)]" aria-hidden>
      <circle cx="40" cy="40" r="30" fill="color-mix(in oklab, var(--fg) 6%, transparent)" stroke="var(--line-strong)" />
      <path ref={pathRef} fill="var(--accent)" />
    </svg>
  )
}

export function ContactForm() {
  const { t } = useI18n()
  const copy = t.contact.form
  const mutation = useContactMutation()
  const [values, setValues] = useState<ContactPayload>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})

  const validate = (): Errors => {
    const next: Errors = {}
    if (values.name.trim().length < 2) next.name = copy.name
    if (!EMAIL_PATTERN.test(values.email.trim())) next.email = copy.email
    if (values.message.trim().length < 10) next.message = copy.message
    return next
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return
    mutation.mutate(values, {
      onSuccess: () => setValues(EMPTY),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          const server: Errors = {}
          for (const field of ['name', 'email', 'subject', 'message'] as const) {
            const message = error.errors[field]?.[0]
            if (message) server[field] = message
          }
          setErrors(server)
        }
      },
    })
  }

  const update = (field: keyof ContactPayload) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field as Field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const failure =
    mutation.error instanceof ApiError && mutation.error.status === 429
      ? copy.throttled
      : mutation.isError && !(mutation.error instanceof ApiError && mutation.error.status === 400)
        ? copy.error
        : null

  const fieldClass = (field: Field) =>
    cn(
      'w-full rounded-2xl border bg-bg/40 px-4 py-3.5 text-[0.95rem] text-fg placeholder:text-subtle transition-[border-color,box-shadow,background-color] duration-300 outline-none focus:bg-bg/60 focus:border-accent focus:shadow-[0_0_0_4px_var(--glow)]',
      errors[field] ? 'border-rose-400/70' : 'border-line',
    )

  return (
    <div className="glass shadow-moon relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
      <AnimatePresence mode="wait" initial={false}>
        {mutation.isSuccess ? (
          <motion.div
            key="success"
            className="flex min-h-[28rem] flex-col items-center justify-center gap-5 text-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            <FullMoon />
            <h3 className="text-2xl font-semibold tracking-tight">{copy.successTitle}</h3>
            <p className="max-w-sm text-muted">{copy.successText}</p>
            <Button variant="ghost" onClick={() => mutation.reset()}>
              {copy.again}
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={onSubmit}
            className="grid gap-5 sm:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            {(
              [
                ['name', copy.name, copy.namePlaceholder, 'text', 'name'],
                ['email', copy.email, copy.emailPlaceholder, 'email', 'email'],
              ] as const
            ).map(([field, label, placeholder, type, autoComplete]) => (
              <label key={field} className="flex flex-col gap-2">
                <span className="eyebrow">{label}</span>
                <input
                  type={type}
                  name={field}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  value={values[field]}
                  onChange={(event) => update(field)(event.target.value)}
                  aria-invalid={Boolean(errors[field])}
                  className={fieldClass(field)}
                />
              </label>
            ))}
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="eyebrow">{copy.subject}</span>
              <input
                type="text"
                name="subject"
                placeholder={copy.subjectPlaceholder}
                value={values.subject}
                onChange={(event) => update('subject')(event.target.value)}
                className={fieldClass('subject')}
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="eyebrow">{copy.message}</span>
              <textarea
                name="message"
                rows={6}
                placeholder={copy.messagePlaceholder}
                value={values.message}
                onChange={(event) => update('message')(event.target.value)}
                aria-invalid={Boolean(errors.message)}
                className={cn(fieldClass('message'), 'resize-none')}
              />
            </label>

            {/* Honeypot: invisible to people, tempting for bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(event) => update('website')(event.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden
            />

            <div className="flex flex-col-reverse items-start gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p role="alert" className="min-h-5 text-sm text-rose-400 light:text-rose-600">
                {failure}
              </p>
              <Button
                type="submit"
                disabled={mutation.isPending}
                icon={
                  mutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )
                }
              >
                {mutation.isPending ? copy.sending : copy.send}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
