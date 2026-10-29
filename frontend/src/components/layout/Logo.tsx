import { company } from '../../company'

/* Riso lockup (design-proposals/round-2/logos/01-riso) drawn inline: ink follows the theme through
   currentColor, the two X's are pink and cobalt overprinted (multiply on paper, screen on dark, see .riso-ink). */
const X = 'M0 0L7 10M7 0L0 10'

function Xx({ x, dx, dy, width }: { x: number; dx: number; dy: number; width: number }) {
  return (
    <g transform={`translate(${x} 5)`} fill="none" strokeWidth={width}>
      <path d={X} stroke="var(--pink)" className="riso-ink" />
      <path d={X} transform={`translate(${dx} ${dy})`} stroke="var(--primary)" className="riso-ink" />
    </g>
  )
}

export function Logo({ className }: { className?: string }) {
  const ink = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'butt', strokeLinejoin: 'miter' } as const
  return (
    <svg viewBox="0 0 113.658 20" className={className} role="img" aria-label={company.brand.logo_name}>
      <g transform="translate(3 3) scale(1.45)" fill="none" strokeWidth={2.6}>
        <path d={X} stroke="var(--pink)" className="riso-ink" />
        <path d={X} transform="translate(2.2 1.6)" stroke="var(--primary)" className="riso-ink" />
      </g>
      <g {...ink} strokeWidth={2.3}>
        <path transform="translate(24 5)" d="M0 10V0L3.5 6L7 0V10" />
        <g transform="translate(58.4 5)">
          <path d="M0 10V0L7 10V0" />
          <path transform="translate(10.4 0)" d="M0 0V10H6" />
          <path transform="translate(19 0)" d="M0 0L3.5 5L7 0M3.5 5V10" />
        </g>
      </g>
      <Xx x={34.4} dx={1.6} dy={1.2} width={2.3} />
      <Xx x={46.4} dx={1.6} dy={1.2} width={2.3} />
      <g {...ink} strokeWidth={3} transform="translate(90.4 8.8) scale(0.62)">
        <path d="M0 0V10H6" />
        <path transform="translate(8.6 0)" d="M0 10L3.5 0L7 10M1.4 6H5.6" />
        <path transform="translate(19 0)" d="M0 10V0H3.8A2.5 2.5 0 0 1 3.8 5H0M3.8 5H4A2.5 2.5 0 0 1 4 10H0" />
        <path transform="translate(28.9 0)" d="M6.5 2.5A2.5 2.5 0 0 0 4 0H3A2.5 2.5 0 0 0 3 5H4A2.5 2.5 0 0 1 4 10H3A2.5 2.5 0 0 1 0.5 7.5" />
      </g>
    </svg>
  )
}
