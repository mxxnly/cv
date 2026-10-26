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
  primary: 'bg-primary text-primary-ink hover:brightness-110 hover:-translate-y-px active:brightness-95',
  secondary: 'bg-primary-soft text-ink hover:brightness-95 dark:hover:brightness-125',
  ghost: 'bg-transparent text-ink border border-line hover:bg-surface',
  link: 'bg-transparent text-primary font-bold underline-offset-4 hover:underline px-0 h-auto',
}

const SIZES: Record<Size, string> = {
  md: 'h-12 px-6 text-[0.95rem]',
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
    'inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-tight transition-[filter,background-color,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60',
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
