export function calcExpectedCash(
  opening: number,
  cashSales: number,
  cashOut: number,
): number {
  return opening + cashSales - cashOut
}

export function calcCashDifference(expected: number, counted: number): number {
  return counted - expected
}
