import { describe, it, expect } from "vitest"
import { selectActiveRecipe, calcStockDeductions, avgDailyUsage, projectShopping, type RecipeVersion } from "./inventory"

const recipes: RecipeVersion[] = [
  { id: "r1", effectiveFrom: "2026-01-01", lines: [] },
  { id: "r2", effectiveFrom: "2026-03-01", lines: [] },
  { id: "r3", effectiveFrom: "2026-06-01", lines: [] },
]

describe("selectActiveRecipe", () => {
  it("memilih versi dengan effectiveFrom terbaru yang <= tanggal jual", () => {
    expect(selectActiveRecipe(recipes, "2026-04-15")?.id).toBe("r2")
  })

  it("memilih versi terbaru bila tanggal jual setelah semua versi", () => {
    expect(selectActiveRecipe(recipes, "2026-12-01")?.id).toBe("r3")
  })

  it("mengembalikan null bila tanggal jual sebelum semua versi", () => {
    expect(selectActiveRecipe(recipes, "2025-12-31")).toBeNull()
  })

  it("memilih versi tepat pada tanggal effectiveFrom", () => {
    expect(selectActiveRecipe(recipes, "2026-03-01")?.id).toBe("r2")
  })
})

describe("calcStockDeductions", () => {
  it("mengalikan qty_used resep dengan jumlah porsi terjual", () => {
    const recipe: RecipeVersion = {
      id: "r1",
      effectiveFrom: "2026-01-01",
      lines: [
        { ingredientId: "ayam", qtyUsed: 1 },
        { ingredientId: "terigu", qtyUsed: 0.037 },
        { ingredientId: "minyak", qtyUsed: 0.022 },
      ],
    }
    const result = calcStockDeductions(recipe, 3)
    expect(result).toEqual([
      { ingredientId: "ayam", changeQty: -3 },
      { ingredientId: "terigu", changeQty: -0.111 },
      { ingredientId: "minyak", changeQty: -0.066 },
    ])
  })

  it("mengembalikan array kosong untuk resep tanpa baris", () => {
    const recipe: RecipeVersion = {
      id: "r1",
      effectiveFrom: "2026-01-01",
      lines: [],
    }
    expect(calcStockDeductions(recipe, 5)).toEqual([])
  })
})

describe("avgDailyUsage", () => {
  it("menghitung rata-rata pemakaian per hari dari total konsumsi", () => {
    expect(avgDailyUsage(70, 7)).toBe(10)
  })

  it("mengembalikan 0 bila rentang hari 0 untuk hindari bagi nol", () => {
    expect(avgDailyUsage(70, 0)).toBe(0)
  })
})

describe("projectShopping", () => {
  it("menghitung jumlah unit beli untuk menutup kebutuhan N hari dikurangi stok", () => {
    const result = projectShopping({
      avgPerDay: 10,
      daysToCover: 7,
      currentStock: 12,
      purchaseUnitQty: 9,
    })
    expect(result.neededQty).toBe(58)
    expect(result.purchaseUnits).toBe(7)
  })

  it("mengembalikan 0 unit bila stok sudah cukup", () => {
    const result = projectShopping({
      avgPerDay: 5,
      daysToCover: 7,
      currentStock: 100,
      purchaseUnitQty: 9,
    })
    expect(result.neededQty).toBe(0)
    expect(result.purchaseUnits).toBe(0)
  })
})
