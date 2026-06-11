import { describe, it, expect } from "vitest"
import { calcInstallment, totalWithInterest } from "./piutang"

describe("totalWithInterest", () => {
  it("menambahkan bunga persen ke pokok", () => {
    expect(totalWithInterest(1000000, 10)).toBe(1100000)
  })
  it("tanpa bunga mengembalikan pokok", () => {
    expect(totalWithInterest(1000000, 0)).toBe(1000000)
  })
})

describe("calcInstallment", () => {
  it("membagi total (pokok+bunga) dengan tenor", () => {
    // 1.000.000 + 10% = 1.100.000 / 11 bulan = 100.000
    expect(calcInstallment(1000000, 10, 11)).toBe(100000)
  })
  it("tenor 0 menghindari bagi nol, kembalikan 0", () => {
    expect(calcInstallment(1000000, 10, 0)).toBe(0)
  })
  it("membulatkan ke rupiah terdekat", () => {
    // 1.000.000 / 3 = 333333.33 -> 333333
    expect(calcInstallment(1000000, 0, 3)).toBe(333333)
  })
})
