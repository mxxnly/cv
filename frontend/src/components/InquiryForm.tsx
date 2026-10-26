import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'

import { ApiError } from '../api/client'
import { useContactMutation, useProducts, useSupportMutation } from '../api/queries'
import type { ContactPayload, SupportPayload } from '../api/types'
import { company } from '../company'
import { useI18n } from '../i18n/context'
import { getAttribution } from '../lib/attribution'
import { trackConversion } from '../lib/consent'
import { validate, type Errors, type Kind, type Values } from '../lib/validation'
import { Button } from './ui/Button'
import { Field, Input, Select, Textarea } from './ui/Field'

export function InquiryForm({ kind, defaultProduct }: { kind: Kind; defaultProduct?: string }) {
  const { t, lang } = useI18n()
  const [params] = useSearchParams()
  const products = useProducts()
  const contact = useContactMutation()
  const support = useSupportMutation()
  const mutation = kind === 'contact' ? contact : support

  const topicParam = params.get('topic')
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    subject: '',
    topic: topicParam === 'sales' || topicParam === 'partnership' ? topicParam : 'general',
    product: defaultProduct ?? params.get('product') ?? '',
    message: params.get('plan') ? `${params.get('product')} / ${params.get('plan')}: ` : '',
    website: '',
  })
  const [errors, setErrors] = useState<Errors>({})

  const update = (field: keyof Values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const found = validate(values, kind, t)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const base = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
      product: values.product || null,
      language: lang,
      attribution: getAttribution(),
      website: values.website,
    }
    const onSuccess = () => trackConversion('lead', { form: kind, product: values.product || undefined })
    const onError = (error: Error) => {
      if (error instanceof ApiError && error.status === 400) {
        const server: Errors = {}
        for (const field of ['name', 'email', 'subject', 'message'] as const) {
          const message = error.errors[field]?.[0]
          if (message) server[field] = message
        }
        setErrors(server)
      }
    }
    if (kind === 'contact') contact.mutate({ ...base, topic: values.topic } satisfies ContactPayload, { onSuccess, onError })
    else support.mutate({ ...base, subject: values.subject.trim() } satisfies SupportPayload, { onSuccess, onError })
  }

  if (mutation.isSuccess) {
    return (
      <div className="rounded-card bg-lavender p-8 text-center">
        <h3 className="text-2xl text-lavender-ink">{t.form.successTitle}</h3>
        <p className="mt-2 text-muted">{t.form.successText}</p>
        <Button className="mt-6" variant="secondary" onClick={() => mutation.reset()}>{t.cta.again}</Button>
      </div>
    )
  }

  const failure =
    mutation.error instanceof ApiError && mutation.error.status === 429
      ? t.form.throttled
      : mutation.isError && !(mutation.error instanceof ApiError && mutation.error.status === 400)
        ? t.form.error
        : null

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-card bg-surface p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.form.name} name="name" error={errors.name} required>
          <Input id="name" name="name" autoComplete="name" value={values.name} onChange={(e) => update('name')(e.target.value)} placeholder={t.form.namePlaceholder} invalid={Boolean(errors.name)} />
        </Field>
        <Field label={t.form.email} name="email" error={errors.email} required>
          <Input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => update('email')(e.target.value)} placeholder={t.form.emailPlaceholder} invalid={Boolean(errors.email)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === 'contact' ? (
          <Field label={t.form.topic} name="topic">
            <Select id="topic" name="topic" value={values.topic} onChange={(e) => update('topic')(e.target.value)}>
              {(['general', 'sales', 'partnership'] as const).map((topic) => (
                <option key={topic} value={topic}>{t.form.topics[topic]}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label={t.support.form.subject} name="subject" error={errors.subject} required>
            <Input id="subject" name="subject" value={values.subject} onChange={(e) => update('subject')(e.target.value)} invalid={Boolean(errors.subject)} />
          </Field>
        )}
        <Field label={t.support.form.product} name="product">
          <Select id="product" name="product" value={values.product} onChange={(e) => update('product')(e.target.value)}>
            <option value="">{t.support.form.productAny}</option>
            {products.data?.map((product) => (
              <option key={product.slug} value={product.slug}>{product.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t.form.message} name="message" error={errors.message} required>
        <Textarea id="message" name="message" value={values.message} onChange={(e) => update('message')(e.target.value)} placeholder={t.form.messagePlaceholder} invalid={Boolean(errors.message)} />
      </Field>
      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update('website')(e.target.value)} />
      </div>
      {failure && <p role="alert" className="text-sm text-danger">{failure}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{t.form.consent} {company.contacts.email}</p>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? t.cta.sending : t.cta.send}</Button>
      </div>
    </form>
  )
}
