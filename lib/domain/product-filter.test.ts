import { describe, it, expect } from "vitest"
import { filterProducts, extractCategories, type FilterableProduct } from "./product-filter"

const products: FilterableProduct[] = [
  { id: "1", name: "Ayam Dada", category: "Ayam" },
  { id: "2", name: "Ayam Paha", category: "Ayam" },
  { id: "3", name: "Es Teh", category: "Minuman" },
  { id: "4", name: "Nasi Putih", category: "" },
]

describe("extractCategories", () => {
  it("mengembalikan kategori unik terurut", () => {
    expect(extractCategories(products)).toEqual(["Ayam", "Minuman", "Lainnya"])
  })

  it("mengembalikan array kosong saat tidak ada produk", () => {
    expect(extractCategories([])).toEqual([])
  })
})

describe("filterProducts", () => {
  it("mengembalikan semua saat tanpa filter", () => {
    expect(filterProducts(products, "", null)).toHaveLength(4)
  })

  it("memfilter berdasar kategori", () => {
    const result = filterProducts(products, "", "Ayam")
    expect(result.map((p) => p.id)).toEqual(["1", "2"])
  })

  it("memfilter kategori 'Lainnya' untuk produk tanpa kategori", () => {
    const result = filterProducts(products, "", "Lainnya")
    expect(result.map((p) => p.id)).toEqual(["4"])
  })

  it("mencari nama tidak peka huruf besar/kecil", () => {
    const result = filterProducts(products, "ayam", null)
    expect(result.map((p) => p.id)).toEqual(["1", "2"])
  })

  it("menggabungkan pencarian dan kategori", () => {
    const result = filterProducts(products, "paha", "Ayam")
    expect(result.map((p) => p.id)).toEqual(["2"])
  })

  it("mengabaikan spasi di query", () => {
    expect(filterProducts(products, "  es  ", null).map((p) => p.id)).toEqual(["3"])
  })
})
