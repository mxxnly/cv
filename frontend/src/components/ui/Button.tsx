import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'react-router'

import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'link'
type Size = 'md' | 'sm'

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  /** Internal route (rendered with <Link>) */
  to?: string
  /** External URL (rendered with <a target=_blank>) */
  href?: string
  onClick?: ComponentProps<'button'>['onClick'] & ComponentProps<'a'>['onClick']
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  icon?: ReactNode
  ariaLabel?: string
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-ink shadow-[3px_3px_0_var(--pink)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--pink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
  secondary: 'border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-bg',
  ghost: 'bg-transparent text-ink border border-line hover:bg-surface',
  link: 'h-auto justify-start bg-transparent px-0 font-bold text-primary underline-offset-4 hover:underline',
}

const SIZES: Record<Size, string> = {
  md: 'h-12 px-6 text-base',
  sm: 'h-10 px-4 text-sm',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  type = 'button',
  disabled,
  className,
  icon,
  ariaLabel,
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-sm font-bold tracking-tight transition-[background-color,color,transform,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    variant !== 'link' && SIZES[size],
    className,
  )
  const content = (
    <>
      <span>{children}</span>
      {icon && <span aria-hidden>{icon}</span>}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        {content}
      </a>
    )
  }
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {content}
    </button>
  )
}
