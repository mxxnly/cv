export interface Token {
  word: string
  emphasis: boolean
}

/** "Selected *work*" → words, with the ones between asterisks marked as emphasised. */
export function tokenize(text: string): Token[] {
  return text.split('*').flatMap((segment, index) =>
    segment
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, emphasis: index % 2 === 1 })),
  )
}

const NUMBER_PATTERN = /^(\D*)(\d+(?:[.,]\d+)?)(.*)$/

/** "30+" → { prefix: '', target: 30, suffix: '+', decimals: 0 }; non-numeric values → null. */
export function parseStat(value: string) {
  const match = value.trim().match(NUMBER_PATTERN)
  if (!match) return null
  const [, prefix, number, suffix] = match
  const decimals = number.split(/[.,]/)[1]?.length ?? 0
  return { prefix, target: Number(number.replace(',', '.')), suffix, decimals }
}
