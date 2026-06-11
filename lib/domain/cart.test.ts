import { describe, it, expect } from "vitest"
import { createCart, addItem, removeItem, type CartItem } from "./cart"

describe("createCart", () => {
  it("membuat keranjang kosong", () => {
    expect(createCart()).toEqual([])
  })
})

describe("addItem", () => {
  it("menambah item baru ke keranjang", () => {
    const cart = addItem([], { productId: "p1", name: "Ayam", qty: 2, unitPrice: 12000, variants: [] })
    expect(cart).toHaveLength(1)
    expect(cart[0].qty).toBe(2)
  })

  it("menjumlahkan qty bila produk sama & varian sama", () => {
    let cart = addItem([], { productId: "p1", name: "Ayam", qty: 1, unitPrice: 12000, variants: [] })
    cart = addItem(cart, { productId: "p1", name: "Ayam", qty: 2, unitPrice: 12000, variants: [] })
    expect(cart).toHaveLength(1)
    expect(cart[0].qty).toBe(3)
  })
})

describe("removeItem", () => {
  it("menghapus item dari keranjang", () => {
    let cart = addItem([], { productId: "p1", name: "Ayam", qty: 1, unitPrice: 12000, variants: [] })
    cart = removeItem(cart, 0)
    expect(cart).toHaveLength(0)
  })
})
