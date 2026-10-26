import type { ContactPayload } from '../api/types'
import type { Dictionary } from '../i18n/strings'

export type Kind = 'contact' | 'support'
export type Values = { name: string; email: string; subject: string; topic: ContactPayload['topic']; product: string; message: string; website: string }
export type Errors = Partial<Record<keyof Values, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validate(values: Values, kind: Kind, t: Dictionary): Errors {
  const errors: Errors = {}
  if (values.name.trim().length < 2) errors.name = t.form.invalidName
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = t.form.invalidEmail
  if (values.message.trim().length < 10) errors.message = t.form.invalidMessage
  if (kind === 'support' && values.subject.trim().length < 3) errors.subject = t.form.invalidSubject
  return errors
}
