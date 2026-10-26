import { company } from '../../company'
import { cn } from '../../lib/cn'

/* Lattice lockup (design-proposals/logos/04-lattice-violet) drawn inline so it follows the theme
   through currentColor; the diamond uses the primary colour. */
export function Logo({ className }: { className?: string }) {
  const stroke = 'fill-none stroke-current stroke-[1.5] [stroke-linecap:square] [stroke-linejoin:miter]'
  return (
    <svg viewBox="0 0 97.2 16" className={className} role="img" aria-label={company.brand.logo_name}>
      <g transform="translate(2 3)">
        <path d="M6 1.43L8.5 5L6 8.57L3.5 5Z" className="fill-primary" />
        <path d="M0 0L7 10M7 0L0 10M5 0L12 10M12 0L5 10" className={stroke} />
      </g>
      <g className={stroke}>
        <path transform="translate(20 3)" d="M0 10V0L3.5 6L7 0V10" />
        <path transform="translate(29.2 3)" d="M0 0L7 10M7 0L0 10M5 0L12 10M12 0L5 10" />
        <path transform="translate(43.4 3)" d="M0 10V0L7 10V0" />
        <path transform="translate(52.6 3)" d="M0 0V10H6" />
        <path transform="translate(61 3)" d="M0 0L3.5 5L7 0M3.5 5V10" />
      </g>
      <g transform="translate(73 6.8) scale(0.62)" className={cn(stroke, 'stroke-[1.9]')}>
        <path transform="translate(0 0)" d="M0 0V10H6" />
        <path transform="translate(8.4 0)" d="M0 10L3.5 0L7 10M1.4 6H5.6" />
        <path transform="translate(18.6 0)" d="M0 10V0H3.8A2.5 2.5 0 0 1 3.8 5H0M3.8 5H4A2.5 2.5 0 0 1 4 10H0" />
        <path transform="translate(28.3 0)" d="M6.5 2.5A2.5 2.5 0 0 0 4 0H3A2.5 2.5 0 0 0 3 5H4A2.5 2.5 0 0 1 4 10H3A2.5 2.5 0 0 1 0.5 7.5" />
      </g>
    </svg>
  )
}
