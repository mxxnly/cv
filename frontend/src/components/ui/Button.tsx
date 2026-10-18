import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  href?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
  icon?: ReactNode
  external?: boolean
  download?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

const VARIANTS = {
  primary:
    'bg-fg text-bg shadow-[0_10px_40px_-12px_var(--glow)] hover:shadow-[0_14px_50px_-10px_var(--glow)]',
  ghost: 'glass text-fg hover:bg-card-hover hover:border-line-strong',
}

/** Pill button that leans towards the cursor ("magnetic"); renders a link when `href` is set. */
export function Button({
  children,
  variant = 'primary',
  href,
  onClick,
  icon,
  external,
  download,
  type = 'button',
  disabled,
  className,
}: ButtonProps) {
  const reduceMotion = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 })

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - rect.left - rect.width / 2) * 0.22)
    y.set((event.clientY - rect.top - rect.height / 2) * 0.3)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const classes = cn(
    'group/button relative inline-flex h-12 items-center justify-center gap-2.5 overflow-hidden rounded-full px-6 text-[0.95rem] font-semibold tracking-tight transition-[background-color,border-color,box-shadow] duration-300 disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    className,
  )

  const content = (
    <>
      {variant === 'primary' && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-700 group-hover/button:left-[120%] group-hover/button:opacity-100 light:via-white/25"
        />
      )}
      <span className="relative">{children}</span>
      {icon && (
        <span className="relative transition-transform duration-300 group-hover/button:translate-x-0.5">
          {icon}
        </span>
      )}
    </>
  )

  const motionProps = {
    style: { x, y },
    onPointerMove,
    onPointerLeave: reset,
    className: classes,
    whileTap: { scale: 0.97 },
  }

  if (href) {
    return (
      <motion.a
        {...motionProps}
        href={href}
        onClick={onClick}
        download={download || undefined}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </motion.a>
    )
  }

  return (
    <motion.button {...motionProps} type={type} onClick={onClick} disabled={disabled}>
      {content}
    </motion.button>
  )
}
