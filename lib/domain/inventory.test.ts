import { describe, it, expect } from "vitest"
import { selectActiveRecipe, type RecipeVersion } from "./inventory"

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
