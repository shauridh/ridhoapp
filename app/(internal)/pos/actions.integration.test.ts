import { describe, it, expect, vi, beforeEach } from "vitest"
import { createFakeSupabase, type FakeDbSeed } from "../../../tests/fake-supabase"

// Mock next/cache (revalidatePath dipanggil di action).
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// Holder agar tiap test bisa set fake client-nya sendiri.
let fake: ReturnType<typeof createFakeSupabase>
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(fake),
}))

// Import action SETELAH mock terpasang.
import { checkout, voidOrder } from "./actions"

function seedBase(): FakeDbSeed {
  return {
    profiles: [{ id: "user-1", is_active: true }],
    shifts: [{ id: "shift-1", status: "open" }],
    products: [{ id: "prod-1", name: "Ayam", base_price: 12000, is_active: true }],
    // resep aktif: 1 Ayam butuh 1 "ayam_potong" + 0.1 "minyak"
    recipes: [
      { id: "rec-1", product_id: "prod-1", effective_from: "2020-01-01" },
    ],
    recipe_lines: [
      { id: "rl-1", recipe_id: "rec-1", ingredient_id: "ing-ayam", qty_used: 1 },
      { id: "rl-2", recipe_id: "rec-1", ingredient_id: "ing-minyak", qty_used: 0.1 },
    ],
    ingredients: [
      { id: "ing-ayam", name: "Ayam Potong", stock_qty: 100 },
      { id: "ing-minyak", name: "Minyak", stock_qty: 50 },
    ],
    orders: [],
    order_items: [],
    order_item_variants: [],
    order_edits: [],
    stock_movements: [],
  }
}

const sampleItem = {
  productId: "prod-1",
  productName: "Ayam",
  qty: 3,
  unitPrice: 12000,
  variants: [],
}

describe("checkout (integration)", () => {
  beforeEach(() => {
    fake = createFakeSupabase(seedBase())
  })

  it("membuat order completed dengan total benar", async () => {
    const res = await checkout({
      items: [sampleItem],
      total: 36000,
      paymentMethod: "cash",
    })
    expect(res.ok).toBe(true)
    const orders = fake.__db.orders
    expect(orders).toHaveLength(1)
    expect(orders[0].total).toBe(36000)
    expect(orders[0].status).toBe("completed")
    expect(orders[0].shift_id).toBe("shift-1")
  })

  it("mengurangi stok bahan sesuai resep aktif x qty", async () => {
    await checkout({ items: [sampleItem], total: 36000, paymentMethod: "cash" })
    const ayam = fake.__db.ingredients.find((i) => i.id === "ing-ayam")
    const minyak = fake.__db.ingredients.find((i) => i.id === "ing-minyak")
    // 3 porsi: ayam 100 - (1*3) = 97 ; minyak 50 - (0.1*3) = 49.7
    expect(ayam?.stock_qty).toBeCloseTo(97)
    expect(minyak?.stock_qty).toBeCloseTo(49.7)
  })

  it("mencatat stock_movements untuk penjualan", async () => {
    await checkout({ items: [sampleItem], total: 36000, paymentMethod: "cash" })
    const moves = fake.__db.stock_movements
    expect(moves.length).toBe(2)
    expect(moves.every((m) => m.reason === "sale")).toBe(true)
  })

  it("menolak keranjang kosong", async () => {
    const res = await checkout({ items: [], total: 0, paymentMethod: "cash" })
    expect(res.ok).toBe(false)
  })

  it("menolak jika tidak terautentikasi", async () => {
    fake = createFakeSupabase(seedBase(), null)
    const res = await checkout({
      items: [sampleItem],
      total: 36000,
      paymentMethod: "cash",
    })
    expect(res.ok).toBe(false)
  })
})

describe("voidOrder (integration)", () => {
  beforeEach(() => {
    fake = createFakeSupabase(seedBase())
  })

  it("membatalkan order dan mengembalikan stok", async () => {
    // checkout dulu
    await checkout({ items: [sampleItem], total: 36000, paymentMethod: "cash" })
    const orderId = fake.__db.orders[0].id
    expect(fake.__db.ingredients.find((i) => i.id === "ing-ayam")?.stock_qty).toBeCloseTo(97)

    const res = await voidOrder(orderId, "salah input")
    expect(res.ok).toBe(true)

    const order = fake.__db.orders.find((o) => o.id === orderId)
    expect(order?.status).toBe("voided")
    expect(order?.void_reason).toBe("salah input")
    // stok kembali: 97 + 3 = 100
    expect(fake.__db.ingredients.find((i) => i.id === "ing-ayam")?.stock_qty).toBeCloseTo(100)
  })

  it("menolak void tanpa alasan", async () => {
    await checkout({ items: [sampleItem], total: 36000, paymentMethod: "cash" })
    const orderId = fake.__db.orders[0].id
    const res = await voidOrder(orderId, "")
    expect(res.ok).toBe(false)
  })

  it("mencatat audit di order_edits", async () => {
    await checkout({ items: [sampleItem], total: 36000, paymentMethod: "cash" })
    const orderId = fake.__db.orders[0].id
    await voidOrder(orderId, "salah input")
    expect(fake.__db.order_edits.length).toBe(1)
    expect(fake.__db.order_edits[0].action).toBe("void")
  })
})
