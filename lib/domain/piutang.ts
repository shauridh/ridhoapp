export function totalWithInterest(principal: number, interestPct: number): number {
  return principal + (principal * interestPct) / 100
}

export function calcInstallment(
  principal: number,
  interestPct: number,
  tenorMonths: number,
): number {
  if (tenorMonths <= 0) return 0
  return Math.round(totalWithInterest(principal, interestPct) / tenorMonths)
}
