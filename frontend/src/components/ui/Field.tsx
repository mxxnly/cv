import type { ComponentProps } from 'react'

import { cn } from '../../lib/cn'

interface FieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, name, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-bold">
        {label}
        {required && <span aria-hidden className="text-primary"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

const INPUT =
  'w-full rounded-card-sm border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] outline-none focus:border-primary focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]'

export function Input({ className, invalid, ...rest }: ComponentProps<'input'> & { invalid?: boolean }) {
  return <input className={cn(INPUT, invalid && 'border-danger', className)} aria-invalid={invalid || undefined} {...rest} />
}

export function Textarea({ className, invalid, ...rest }: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return <textarea className={cn(INPUT, 'min-h-32 resize-y', invalid && 'border-danger', className)} aria-invalid={invalid || undefined} {...rest} />
}

export function Select({ className, children, ...rest }: ComponentProps<'select'>) {
  return (
    <select className={cn(INPUT, 'appearance-none', className)} {...rest}>
      {children}
    </select>
  )
}
