import { createClient } from "@/lib/supabase/server"

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
