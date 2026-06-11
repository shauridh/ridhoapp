import { createClient } from "@/lib/supabase/server"

export interface OrderRow {
  id: string
  total: number
  payment_method: "cash" | "qris"
  source: string
  status: string
  void_reason: string | null
  created_at: string
}

export async function listRecentOrders(limit = 50): Promise<OrderRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}
