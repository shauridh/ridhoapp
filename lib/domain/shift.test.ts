import { describe, expect, it } from "vitest"
import { calcCashDifference, calcExpectedCash } from "./shift"

describe("calcExpectedCash", () => {
  it("menghitung expected = opening + penjualan tunai - cash out", () => {
    expect(calcExpectedCash(50000, 120000, 15000)).toBe(155000)
  })
})

describe("calcCashDifference", () => {
  it("menghitung selisih counted - expected", () => {
    expect(calcCashDifference(155000, 156000)).toBe(1000)
  })

  it("mengembalikan negatif bila kurang", () => {
    expect(calcCashDifference(155000, 154000)).toBe(-1000)
  })
})
