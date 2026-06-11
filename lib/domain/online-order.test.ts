import { describe, it, expect } from "vitest"
import { calcOrderTotal, type OnlineCartItem } from "./online-order"

const items: OnlineCartItem[] = [
  { name: "Ayam Dada", qty: 2, harga: 12000 },
  { name: "Es Teh", qty: 1, harga: 4000 },
]

describe("calcOrderTotal", () => {
  it("menjumlahkan subtotal item + ongkir", () => {
    const r = calcOrderTotal(items, 5000)
    expect(r.subtotal).toBe(28000)
    expect(r.total).toBe(33000)
  })
  it("ongkir 0 bila tidak ada", () => {
    const r = calcOrderTotal(items, 0)
    expect(r.total).toBe(28000)
  })
  it("keranjang kosong menghasilkan 0", () => {
    const r = calcOrderTotal([], 5000)
    expect(r.subtotal).toBe(0)
    expect(r.total).toBe(5000)
  })
})
