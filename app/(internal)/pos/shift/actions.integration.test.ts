import { describe, it, expect, vi, beforeEach } from "vitest"
import { createFakeSupabase, type FakeDbSeed } from "../../../../tests/fake-supabase"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

let fake: ReturnType<typeof createFakeSupabase>
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(fake),
}))

// Gateway WA di-stub agar tidak ada I/O jaringan saat test.
vi.mock("@/lib/wa/getsender", () => ({
  sendWa: vi.fn(() => Promise.resolve({ ok: true })),
}))

import { closeShift, openShift, cashOut } from "./actions"

function seed(): FakeDbSeed {
  return {
    profiles: [{ id: "user-1", is_active: true }],
    shifts: [
      {
        id: "shift-1",
        status: "open",
        opening_balance: 200000,
        opened_by: "user-1",
      },
    ],
    orders: [
      { id: "o1", shift_id: "shift-1", payment_method: "cash", status: "completed", total: 100000 },
      { id: "o2", shift_id: "shift-1", payment_method: "cash", status: "completed", total: 50000 },
      { id: "o3", shift_id: "shift-1", payment_method: "qris", status: "completed", total: 75000 },
      { id: "o4", shift_id: "shift-1", payment_method: "cash", status: "voided", total: 99999 },
    ],
    cash_drawer_movements: [
      { id: "m1", shift_id: "shift-1", direction: "out", amount: 20000 },
    ],
    cashflow_entries: [],
    app_settings: [{ key: "wa_report_enabled", value: "false" }],
    order_items: [],
  }
}

describe("closeShift (integration)", () => {
  beforeEach(() => {
    fake = createFakeSupabase(seed())
  })

  it("menghitung expected cash = saldo awal + tunai - cash out (abaikan voided & qris)", async () => {
    const res = await closeShift({
      shiftId: "shift-1",
      countedCash: 330000,
      ownerWithdrawal: 0,
    })
    expect(res.ok).toBe(true)
    const shift = fake.__db.shifts.find((s) => s.id === "shift-1")
    // 200000 + (100000+50000) - 20000 = 330000
    expect(shift?.expected_cash).toBe(330000)
    expect(shift?.qris_total).toBe(75000)
    expect(shift?.status).toBe("closed")
  })

  it("menghitung selisih kas (counted - expected)", async () => {
    await closeShift({ shiftId: "shift-1", countedCash: 325000, ownerWithdrawal: 0 })
    const shift = fake.__db.shifts.find((s) => s.id === "shift-1")
    // 325000 - 330000 = -5000 (kurang)
    expect(shift?.cash_difference).toBe(-5000)
  })

  it("closing balance = counted - owner withdrawal", async () => {
    await closeShift({ shiftId: "shift-1", countedCash: 330000, ownerWithdrawal: 130000 })
    const shift = fake.__db.shifts.find((s) => s.id === "shift-1")
    expect(shift?.closing_balance).toBe(200000)
  })

  it("mencatat pemasukan ke cashflow_entries", async () => {
    await closeShift({ shiftId: "shift-1", countedCash: 330000, ownerWithdrawal: 0 })
    const income = fake.__db.cashflow_entries.find((e) => e.source === "sale")
    // total income = cash 150000 + qris 75000 = 225000
    expect(income?.amount).toBe(225000)
  })

  it("menolak menutup shift yang sudah closed", async () => {
    fake.__db.shifts[0].status = "closed"
    const res = await closeShift({ shiftId: "shift-1", countedCash: 0, ownerWithdrawal: 0 })
    expect(res.ok).toBe(false)
  })
})

describe("cashOut (integration)", () => {
  beforeEach(() => {
    fake = createFakeSupabase(seed())
  })

  it("mencatat pengeluaran drawer + cashflow opex", async () => {
    const res = await cashOut("shift-1", 30000, "beli es batu")
    expect(res.ok).toBe(true)
    const move = fake.__db.cash_drawer_movements.find((m) => m.amount === 30000)
    expect(move?.direction).toBe("out")
    const cf = fake.__db.cashflow_entries.find((e) => e.source === "drawer")
    expect(cf?.amount).toBe(30000)
  })

  it("menolak nominal <= 0", async () => {
    const res = await cashOut("shift-1", 0, "x")
    expect(res.ok).toBe(false)
  })
})

describe("openShift (integration)", () => {
  it("menolak jika sudah ada shift terbuka", async () => {
    fake = createFakeSupabase(seed())
    const res = await openShift(100000)
    expect(res.ok).toBe(false)
  })

  it("membuka shift baru saat tidak ada yang terbuka", async () => {
    const s = seed()
    s.shifts = []
    fake = createFakeSupabase(s)
    const res = await openShift(100000)
    expect(res.ok).toBe(true)
    expect(fake.__db.shifts).toHaveLength(1)
    expect(fake.__db.shifts[0].opening_balance).toBe(100000)
  })
})
