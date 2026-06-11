import { createClient } from "@/lib/supabase/server"
import { calcExpectedCash } from "@/lib/domain/shift"

export interface ShiftRow {
  id: string
  opened_by: string
  opened_at: string
  closed_by: string | null
  closed_at: string | null
  opening_balance: number
  expected_cash: number
  counted_cash: number | null
  cash_difference: number | null
  owner_withdrawal: number | null
  closing_balance: number | null
  qris_total: number
  status: "open" | "closed"
}

export async function getCurrentOpenShift(): Promise<ShiftRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("status", "open")
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function listRecentShifts(limit = 20): Promise<ShiftRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .order("opened_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getShiftCashSummary(shift: ShiftRow) {
  const supabase = await createClient()

  const { data: cashOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shift.id)
    .eq("payment_method", "cash")
    .eq("status", "completed")
  const cashSales = (cashOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0)

  const { data: qrisOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shift.id)
    .eq("payment_method", "qris")
    .eq("status", "completed")
  const qrisTotal = (qrisOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0)

  const { data: cashOutRows } = await supabase
    .from("cash_drawer_movements")
    .select("amount")
    .eq("shift_id", shift.id)
    .eq("direction", "out")
  const cashOut = (cashOutRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  )

  return {
    cashSales,
    qrisTotal,
    cashOut,
    expectedCash: calcExpectedCash(Number(shift.opening_balance), cashSales, cashOut),
  }
}
