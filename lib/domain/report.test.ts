import { describe, it, expect } from "vitest"
import {
  aggregateByHour,
  topSellers,
  type SaleLine,
} from "./report"

const lines: SaleLine[] = [
  { name: "Ayam Dada", qty: 3, subtotal: 36000, hour: 10 },
  { name: "Es Teh", qty: 2, subtotal: 8000, hour: 10 },
  { name: "Ayam Dada", qty: 1, subtotal: 12000, hour: 12 },
  { name: "Nasi", qty: 5, subtotal: 25000, hour: 12 },
]

describe("aggregateByHour", () => {
  it("menjumlahkan omzet per jam", () => {
    const result = aggregateByHour(lines)
    expect(result[10]).toBe(44000)
    expect(result[12]).toBe(37000)
  })
  it("menghasilkan 24 slot jam", () => {
    const result = aggregateByHour(lines)
    expect(result).toHaveLength(24)
    expect(result[0]).toBe(0)
  })
})

describe("topSellers", () => {
  it("mengurutkan produk berdasar qty terjual menurun", () => {
    const result = topSellers(lines, 10)
    expect(result[0]).toEqual({ name: "Nasi", qty: 5, omzet: 25000 })
    expect(result[1]).toEqual({ name: "Ayam Dada", qty: 4, omzet: 48000 })
  })
  it("membatasi jumlah hasil", () => {
    expect(topSellers(lines, 1)).toHaveLength(1)
  })
})
