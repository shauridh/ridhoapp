import { createClient } from "@/lib/supabase/server"
import type { SaleLine, DatedSale, CategoryLine } from "@/lib/domain/report"

export interface DashboardData {
  lines: SaleLine[]
  datedSales: DatedSale[]
  categoryLines: CategoryLine[]
  totalOmzet: number
  totalTransaksi: number
  totalItem: number
  cashTotal: number
  qrisTotal: number
}

// Ambil data penjualan untuk rentang tanggal, hanya order completed.
// Mengembalikan baris untuk berbagai agregasi (jam, hari, kategori, produk).
export async function getDashboardData(
  startIso: string,
  endIso: string,
): Promise<DashboardData> {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, total, payment_method, created_at, order_items(product_name, qty, subtotal, products(category))",
    )
    .eq("status", "completed")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
  if (error) throw new Error(error.message)

  const lines: SaleLine[] = []
  const datedSales: DatedSale[] = []
  const categoryLines: CategoryLine[] = []
  let totalOmzet = 0
  let totalItem = 0
  let cashTotal = 0
  let qrisTotal = 0
  const orderList = orders ?? []

  for (const o of orderList) {
    totalOmzet += Number(o.total)
    if (o.payment_method === "cash") cashTotal += Number(o.total)
    if (o.payment_method === "qris") qrisTotal += Number(o.total)

    const d = new Date(o.created_at)
    const hour = d.getHours()
    datedSales.push({ date: d.toISOString().slice(0, 10), total: Number(o.total) })

    const items =
      (o.order_items as unknown as {
        product_name: string
        qty: number
        subtotal: number
        products: { category: string } | null
      }[]) ?? []
    for (const item of items) {
      totalItem += item.qty
      lines.push({
        name: item.product_name,
        qty: item.qty,
        subtotal: Number(item.subtotal),
        hour,
      })
      categoryLines.push({
        category: item.products?.category ?? "",
        subtotal: Number(item.subtotal),
      })
    }
  }

  return {
    lines,
    datedSales,
    categoryLines,
    totalOmzet,
    totalTransaksi: orderList.length,
    totalItem,
    cashTotal,
    qrisTotal,
  }
}

// Total omzet saja untuk perbandingan periode (lebih ringan).
export async function getOmzetForRange(
  startIso: string,
  endIso: string,
): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("total")
    .eq("status", "completed")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
  return (data ?? []).reduce((s, o) => s + Number(o.total), 0)
}
