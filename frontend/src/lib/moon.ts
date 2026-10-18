import type { SkillLevel } from '../api/types'

/** Illuminated fraction shown for each skill level (1 = thin crescent, 5 = full moon). */
export const LEVEL_FRACTION: Record<SkillLevel, number> = {
  1: 0.1,
  2: 0.28,
  3: 0.5,
  4: 0.74,
  5: 1,
}

/**
 * SVG path of the lit part of a waxing moon (light from the right).
 * `fraction` is the illuminated share of the disc: 0 = new moon, 1 = full moon.
 */
export function moonPhasePath(fraction: number, r = 10, cx = 12, cy = 12): string {
  const f = Math.min(Math.max(fraction, 0), 1)
  if (f <= 0.001) return ''
  if (f >= 0.999) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
  }
  const rx = Math.abs(1 - 2 * f) * r
  // Crescent: terminator bulges towards the lit limb; gibbous: away from it.
  const sweep = f < 0.5 ? 0 : 1
  const round = (n: number) => Math.round(n * 1000) / 1000
  return [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 0 1 ${cx} ${cy + r}`,
    `A ${round(rx)} ${r} 0 0 ${sweep} ${cx} ${cy - r}`,
    'Z',
  ].join(' ')
}
