import { describe, it, expect } from "vitest"
import { calcOpnameDelta, parseBulkIngredients } from "./opname"

describe("calcOpnameDelta", () => {
  it("menghitung selisih positif bila fisik lebih banyak", () => {
    expect(calcOpnameDelta(10, 13)).toBe(3)
  })
  it("menghitung selisih negatif bila fisik lebih sedikit", () => {
    expect(calcOpnameDelta(10, 7)).toBe(-3)
  })
  it("nol bila sama", () => {
    expect(calcOpnameDelta(10, 10)).toBe(0)
  })
})

describe("parseBulkIngredients", () => {
  it("mem-parse baris nama,satuan,satuan_beli,isi,batas", () => {
    const input = "Ayam,potong,kantung,9,18\nTerigu,kg,sak,25,5"
    const rows = parseBulkIngredients(input)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      name: "Ayam",
      unit: "potong",
      purchaseUnit: "kantung",
      purchaseUnitQty: 9,
      lowStockThreshold: 18,
    })
  })
  it("mengabaikan baris kosong & spasi", () => {
    const input = "  \nAyam,potong,kantung,9,18\n\n"
    expect(parseBulkIngredients(input)).toHaveLength(1)
  })
  it("memberi default aman bila kolom kurang", () => {
    const rows = parseBulkIngredients("Garam")
    expect(rows[0]).toEqual({
      name: "Garam",
      unit: "",
      purchaseUnit: "",
      purchaseUnitQty: 1,
      lowStockThreshold: 0,
    })
  })
  it("melewati baris tanpa nama", () => {
    expect(parseBulkIngredients(",potong,kantung,9,18")).toHaveLength(0)
  })
})
