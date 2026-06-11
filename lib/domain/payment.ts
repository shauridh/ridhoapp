export function calcChange(total: number, paid: number): number {
  return Math.max(0, paid - total)
}

export function isPaymentSufficient(total: number, paid: number): boolean {
  return paid >= total
}

// Saran nominal cepat: nilai pas + pembulatan ke atas ke kelipatan umum.
export function quickNominals(total: number): number[] {
  const set = new Set<number>()
  set.add(total)

  const steps = [5000, 10000, 20000, 50000, 100000]
  for (const step of steps) {
    const rounded = Math.ceil(total / step) * step
    if (rounded > total) set.add(rounded)
  }

  // Tambahkan pecahan uang umum di atas total.
  for (const note of [50000, 100000]) {
    if (note > total) set.add(note)
  }

  return Array.from(set).sort((a, b) => a - b)
}
