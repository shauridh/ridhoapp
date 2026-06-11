import { describe, it, expect } from "vitest"
import { gridStyle } from "./grid"

describe("gridStyle", () => {
  it("memakai auto-fill untuk Auto", () => {
    expect(gridStyle("auto").gridTemplateColumns).toBe(
      "repeat(auto-fill, minmax(140px, 1fr))",
    )
  })

  it("mengunci jumlah kolom untuk angka", () => {
    expect(gridStyle(4).gridTemplateColumns).toBe("repeat(4, 1fr)")
  })
})
