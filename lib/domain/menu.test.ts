import { describe, it, expect } from "vitest"
import { validateProductInput, type ProductInput } from "./menu"

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
