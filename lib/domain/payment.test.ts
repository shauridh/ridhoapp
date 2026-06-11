import { describe, it, expect } from "vitest"
import { calcChange, isPaymentSufficient, quickNominals } from "./payment"

describe("calcChange", () => {
  it("menghitung kembalian", () => {
    expect(calcChange(28000, 50000)).toBe(22000)
  })
  it("kembalian 0 bila uang pas", () => {
    expect(calcChange(28000, 28000)).toBe(0)
  })
  it("tidak pernah negatif bila uang kurang", () => {
    expect(calcChange(28000, 20000)).toBe(0)
  })
})

describe("isPaymentSufficient", () => {
  it("cukup bila paid >= total", () => {
    expect(isPaymentSufficient(28000, 28000)).toBe(true)
    expect(isPaymentSufficient(28000, 30000)).toBe(true)
  })
  it("kurang bila paid < total", () => {
    expect(isPaymentSufficient(28000, 27000)).toBe(false)
  })
})

describe("quickNominals", () => {
  it("menyertakan nominal pas sebagai opsi pertama", () => {
    const result = quickNominals(28000)
    expect(result[0]).toBe(28000)
  })
  it("menghasilkan saran terurut naik dan unik", () => {
    const result = quickNominals(28000)
    const sorted = [...result].sort((a, b) => a - b)
    expect(result).toEqual(sorted)
    expect(new Set(result).size).toBe(result.length)
  })
  it("menyertakan pembulatan ke atas yang relevan di atas total", () => {
    const result = quickNominals(28000)
    expect(result).toContain(30000)
    expect(result).toContain(50000)
    expect(result).toContain(100000)
  })
})
