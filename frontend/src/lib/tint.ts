import type { Tint } from '../api/types'

export function tintInk(tint: Tint): string {
  return { lavender: 'text-lavender-ink', periwinkle: 'text-periwinkle-ink', mauve: 'text-mauve-ink' }[tint]
}

export function tintBg(tint: Tint): string {
  return { lavender: 'bg-lavender', periwinkle: 'bg-periwinkle', mauve: 'bg-mauve' }[tint]
}
