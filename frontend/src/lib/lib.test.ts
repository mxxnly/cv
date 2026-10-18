import { describe, expect, it } from 'vitest'

import { dictionaries } from '../i18n/strings'
import { formatDuration, initials, paragraphs } from './format'
import { moonPhasePath } from './moon'
import { parseStat, tokenize } from './text'

describe('moonPhasePath', () => {
  it('is empty for a new moon', () => {
    expect(moonPhasePath(0)).toBe('')
  })

  it('draws a full disc for a full moon', () => {
    expect(moonPhasePath(1)).toContain('A 10 10 0 1 1')
  })

  it('uses a straight terminator at first quarter', () => {
    expect(moonPhasePath(0.5)).toContain('A 0 10')
  })

  it('bulges the terminator outward for crescents and inward for gibbous phases', () => {
    expect(moonPhasePath(0.25)).toMatch(/A 5 10 0 0 0/)
    expect(moonPhasePath(0.75)).toMatch(/A 5 10 0 0 1/)
  })
})

describe('formatDuration', () => {
  const t = dictionaries.uk

  it('counts the starting month inclusively', () => {
    expect(formatDuration('2024-01-01', '2024-01-31', t)).toBe('1 міс.')
  })

  it('combines years and months', () => {
    expect(formatDuration('2022-06-01', '2024-08-01', t)).toBe('2 р. 3 міс.')
  })

  it('uses "now" for ongoing positions', () => {
    expect(formatDuration('2025-01-01', null, dictionaries.en, new Date('2026-01-15'))).toBe('1 yr 1 mo')
  })
})

describe('text helpers', () => {
  it('splits paragraphs on blank lines', () => {
    expect(paragraphs('one\n\n two \n\n\nthree')).toEqual(['one', 'two', 'three'])
  })

  it('builds initials from the first two words', () => {
    expect(initials('Олекса Місяць Третій')).toBe('ОМ')
  })

  it('tokenizes emphasised words', () => {
    expect(tokenize('Selected *great work*')).toEqual([
      { word: 'Selected', emphasis: false },
      { word: 'great', emphasis: true },
      { word: 'work', emphasis: true },
    ])
  })

  it('parses numeric stats with prefixes and suffixes', () => {
    expect(parseStat('30+')).toEqual({ prefix: '', target: 30, suffix: '+', decimals: 0 })
    expect(parseStat('~1.5k')).toEqual({ prefix: '~', target: 1.5, suffix: 'k', decimals: 1 })
    expect(parseStat('∞')).toBeNull()
  })
})
