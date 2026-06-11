import type { TLV } from "./types"

// Parse string EMVCo TLV jadi daftar elemen tingkat atas.
// Format tiap elemen: tag (2 digit) + length (2 digit) + value (length char).
export function parseTLV(input: string): TLV[] {
  const elements: TLV[] = []
  let i = 0
  while (i + 4 <= input.length) {
    const tag = input.slice(i, i + 2)
    const length = parseInt(input.slice(i + 2, i + 4), 10)
    if (Number.isNaN(length)) break
    const value = input.slice(i + 4, i + 4 + length)
    elements.push({ tag, length, value })
    i += 4 + length
  }
  return elements
}
