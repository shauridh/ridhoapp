import { describe, it, expect } from "vitest"
import {
  aggregateByHour,
  topSellers,
  aggregateByDay,
  aggregateByCategory,
  comparePeriod,
  type SaleLine,
  type DatedSale,
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

describe("aggregateByDay", () => {
  const sales: DatedSale[] = [
    { date: "2026-06-10", total: 100000 },
    { date: "2026-06-10", total: 50000 },
    { date: "2026-06-12", total: 75000 },
  ]

  it("menjumlahkan omzet per hari mengisi tanggal kosong", () => {
    const result = aggregateByDay(sales, "2026-06-10", "2026-06-12")
    expect(result).toEqual([
      { date: "2026-06-10", total: 150000 },
      { date: "2026-06-11", total: 0 },
      { date: "2026-06-12", total: 75000 },
    ])
  })

  it("mengembalikan deret kosong saat tidak ada penjualan", () => {
    const result = aggregateByDay([], "2026-06-10", "2026-06-11")
    expect(result).toEqual([
      { date: "2026-06-10", total: 0 },
      { date: "2026-06-11", total: 0 },
    ])
  })
})

describe("aggregateByCategory", () => {
  const catLines = [
    { category: "Ayam", subtotal: 36000 },
    { category: "Minuman", subtotal: 8000 },
    { category: "Ayam", subtotal: 12000 },
    { category: "Nasi", subtotal: 25000 },
  ]

  it("menjumlahkan omzet per kategori dan urut menurun", () => {
    const result = aggregateByCategory(catLines)
    expect(result[0]).toEqual({ category: "Ayam", omzet: 48000 })
    expect(result[1]).toEqual({ category: "Nasi", omzet: 25000 })
    expect(result[2]).toEqual({ category: "Minuman", omzet: 8000 })
  })

  it("mengelompokkan kategori kosong sebagai 'Lainnya'", () => {
    const result = aggregateByCategory([{ category: "", subtotal: 5000 }])
    expect(result[0]).toEqual({ category: "Lainnya", omzet: 5000 })
  })
})

describe("comparePeriod", () => {
  it("menghitung persentase naik", () => {
    expect(comparePeriod(150000, 100000)).toEqual({
      diff: 50000,
      percent: 50,
      direction: "up",
    })
  })

  it("menghitung persentase turun", () => {
    expect(comparePeriod(80000, 100000)).toEqual({
      diff: -20000,
      percent: -20,
      direction: "down",
    })
  })

  it("menangani periode sebelumnya nol", () => {
    expect(comparePeriod(50000, 0)).toEqual({
      diff: 50000,
      percent: 100,
      direction: "up",
    })
  })

  it("menandai sama saat tidak berubah", () => {
    expect(comparePeriod(100000, 100000)).toEqual({
      diff: 0,
      percent: 0,
      direction: "flat",
    })
  })
})
