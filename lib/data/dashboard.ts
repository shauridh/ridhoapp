import { createClient } from "@/lib/supabase/server"
import type { SaleLine } from "@/lib/domain/report"

export interface DashboardData {
  lines: SaleLine[]
  totalOmzet: number
  totalTransaksi: number
  totalItem: number
  cashTotal: number
  qrisTotal: number
}

// Ambil data penjualan untuk rentang tanggal (default: hari ini),
// hanya order completed. Mengembalikan baris untuk agregasi report.
export async function getDashboardData(
  startIso: string,
  endIso: string,
): Promise<DashboardData> {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, total, payment_method, created_at, order_items(product_name, qty, subtotal)")
    .eq("status", "completed")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
  if (error) throw new Error(error.message)

  const lines: SaleLine[] = []
  let totalOmzet = 0
  let totalItem = 0
  let cashTotal = 0
  let qrisTotal = 0
  const orderList = orders ?? []

  for (const o of orderList) {
    totalOmzet += Number(o.total)
    if (o.payment_method === "cash") cashTotal += Number(o.total)
    if (o.payment_method === "qris") qrisTotal += Number(o.total)

    const hour = new Date(o.created_at).getHours()
    const items =
      (o.order_items as unknown as {
        product_name: string
        qty: number
        subtotal: number
      }[]) ?? []
    for (const item of items) {
      totalItem += item.qty
      lines.push({
        name: item.product_name,
        qty: item.qty,
        subtotal: Number(item.subtotal),
        hour,
      })
    }
  }

  return {
    lines,
    totalOmzet,
    totalTransaksi: orderList.length,
    totalItem,
    cashTotal,
    qrisTotal,
  }
}
