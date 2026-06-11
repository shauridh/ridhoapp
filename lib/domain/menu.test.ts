import { describe, it, expect } from "vitest"
import { validateProductInput, calcLinePrice, type ProductInput } from "./menu"

describe("validateProductInput", () => {
  it("menerima produk single yang valid", () => {
    const input: ProductInput = {
      name: "Ayam Goreng",
      type: "single",
      basePrice: 12000,
      category: "Ayam",
    }
    expect(validateProductInput(input)).toEqual({ ok: true })
  })

  it("menolak nama kosong", () => {
    const input: ProductInput = {
      name: "  ",
      type: "single",
      basePrice: 12000,
      category: "Ayam",
    }
    const result = validateProductInput(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/nama/i)
  })

  it("menolak harga negatif", () => {
    const input: ProductInput = {
      name: "Ayam",
      type: "single",
      basePrice: -1,
      category: "Ayam",
    }
    const result = validateProductInput(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/harga/i)
  })
})

describe("calcLinePrice", () => {
  it("menghitung harga dasar tanpa varian", () => {
    expect(calcLinePrice(12000, [])).toBe(12000)
  })

  it("menambahkan price_delta dari varian terpilih", () => {
    expect(calcLinePrice(12000, [2000, 5000])).toBe(19000)
  })

  it("mengabaikan delta negatif tidak wajar dengan tetap menjumlahkan", () => {
    expect(calcLinePrice(12000, [-2000])).toBe(10000)
  })
})
