import { describe, it, expect } from "vitest"
import {
  formatShiftReport,
  renderShiftTemplate,
  DEFAULT_SHIFT_TEMPLATE,
  type ShiftReportData,
} from "./shift-report"

const base: ShiftReportData = {
  storeName: "Sabana Fried Chicken",
  closedAt: "2026-06-12T10:29:00.000Z",
  omzet: 1250000,
  transaksi: 48,
  item: 132,
  tunai: 800000,
  qris: 450000,
  kasAwal: 200000,
  kasAkhir: 300000,
  selisih: 0,
  topSellers: [
    { name: "Paket Ayam", qty: 40 },
    { name: "Nasi", qty: 32 },
  ],
}

describe("formatShiftReport", () => {
  it("memuat judul dengan nama toko", () => {
    const msg = formatShiftReport(base)
    expect(msg).toContain("REKAP SHIFT")
    expect(msg).toContain("Sabana Fried Chicken")
  })

  it("memformat angka rupiah dengan pemisah ribuan", () => {
    const msg = formatShiftReport(base)
    expect(msg).toContain("Rp 1.250.000")
    expect(msg).toContain("Rp 800.000")
    expect(msg).toContain("Rp 450.000")
  })

  it("menampilkan jumlah transaksi dan item", () => {
    const msg = formatShiftReport(base)
    expect(msg).toContain("48")
    expect(msg).toContain("132")
  })

  it("menandai selisih cocok saat nol", () => {
    const msg = formatShiftReport({ ...base, selisih: 0 })
    expect(msg.toLowerCase()).toContain("cocok")
  })

  it("menandai selisih lebih saat positif", () => {
    const msg = formatShiftReport({ ...base, selisih: 5000 })
    expect(msg.toLowerCase()).toContain("lebih")
    expect(msg).toContain("Rp 5.000")
  })

  it("menandai selisih kurang saat negatif", () => {
    const msg = formatShiftReport({ ...base, selisih: -5000 })
    expect(msg.toLowerCase()).toContain("kurang")
    expect(msg).toContain("Rp 5.000")
  })

  it("menampilkan daftar produk terlaris bernomor", () => {
    const msg = formatShiftReport(base)
    expect(msg).toContain("1. Paket Ayam x40")
    expect(msg).toContain("2. Nasi x32")
  })

  it("menampilkan pesan kosong saat tidak ada penjualan", () => {
    const msg = formatShiftReport({ ...base, topSellers: [] })
    expect(msg.toLowerCase()).toContain("belum ada penjualan")
  })
})

describe("renderShiftTemplate", () => {
  it("mengganti placeholder dengan nilai terformat", () => {
    const tpl = "Toko {toko}\nOmzet {omzet}\nTrx {transaksi}"
    const msg = renderShiftTemplate(tpl, base)
    expect(msg).toBe("Toko Sabana Fried Chicken\nOmzet Rp 1.250.000\nTrx 48")
  })

  it("mengganti placeholder pembayaran dan kas", () => {
    const tpl = "{tunai} {qris} {kasAwal} {kasAkhir} {selisih}"
    const msg = renderShiftTemplate(tpl, base)
    expect(msg).toBe(
      "Rp 800.000 Rp 450.000 Rp 200.000 Rp 300.000 Rp 0 (cocok)",
    )
  })

  it("mengganti placeholder item dan terlaris", () => {
    const msg = renderShiftTemplate("{item}\n{terlaris}", base)
    expect(msg).toContain("132")
    expect(msg).toContain("1. Paket Ayam x40")
    expect(msg).toContain("2. Nasi x32")
  })

  it("placeholder tak dikenal dibiarkan apa adanya", () => {
    expect(renderShiftTemplate("{xyz}", base)).toBe("{xyz}")
  })

  it("template default menghasilkan pesan lengkap", () => {
    const msg = renderShiftTemplate(DEFAULT_SHIFT_TEMPLATE, base)
    expect(msg).toContain("Sabana Fried Chicken")
    expect(msg).toContain("Rp 1.250.000")
    expect(msg).toContain("Paket Ayam")
  })

  it("tanggal tersedia sebagai placeholder", () => {
    const msg = renderShiftTemplate("{tanggal}", base)
    expect(msg).toContain("2026")
  })
})
