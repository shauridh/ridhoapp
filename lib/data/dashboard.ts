import { createClient } from "@/lib/supabase/server";
import type { SaleLine, DatedSale, CategoryLine } from "@/lib/domain/report";
import { toWibDateString, toWibHour } from "@/lib/utils/wib";

export interface DashboardData {
  lines: SaleLine[];
  datedSales: DatedSale[];
  categoryLines: CategoryLine[];
  totalOmzet: number;
  totalTransaksi: number;
  totalItem: number;
  cashTotal: number;
  qrisTotal: number;
}

// Ambil data penjualan untuk rentang tanggal, hanya order completed.
// Menggunakan parallel queries untuk mengurangi latency:
// - Query 1: agregat order (total, payment_method) — tidak join items
// - Query 2: order_items + category — hanya kolom yang dibutuhkan
export async function getDashboardData(startIso: string, endIso: string): Promise<DashboardData> {
  const supabase = await createClient();

  // Jalankan dua query secara paralel
  const [ordersResult, itemsResult] = await Promise.all([
    // Query 1: agregat order untuk omzet, transaksi, payment breakdown
    supabase
      .from("orders")
      .select("id, total, payment_method, created_at")
      .eq("status", "completed")
      .gte("created_at", startIso)
      .lte("created_at", endIso),

    // Query 2: items untuk product lines dan category breakdown
    supabase
      .from("order_items")
      .select("product_name, qty, subtotal, orders!inner(created_at, status), products(category)")
      .eq("orders.status", "completed")
      .gte("orders.created_at", startIso)
      .lte("orders.created_at", endIso),
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);

  const orderList = ordersResult.data ?? [];
  const itemList = itemsResult.data ?? [];

  // Agregasi dari orders
  let totalOmzet = 0;
  let cashTotal = 0;
  let qrisTotal = 0;
  const datedSales: DatedSale[] = [];

  for (const o of orderList) {
    totalOmzet += Number(o.total);
    if (o.payment_method === "cash") cashTotal += Number(o.total);
    if (o.payment_method === "qris") qrisTotal += Number(o.total);
    datedSales.push({
      date: toWibDateString(new Date(o.created_at)),
      total: Number(o.total),
    });
  }

  // Agregasi dari items
  let totalItem = 0;
  const lines: SaleLine[] = [];
  const categoryLines: CategoryLine[] = [];

  for (const item of itemList) {
    const order = item.orders as unknown as { created_at: string } | null;
    const hour = order ? toWibHour(new Date(order.created_at)) : 0;
    const product = item.products as unknown as { category: string } | null;

    totalItem += item.qty;
    lines.push({
      name: item.product_name,
      qty: item.qty,
      subtotal: Number(item.subtotal),
      hour,
    });
    categoryLines.push({
      category: product?.category ?? "",
      subtotal: Number(item.subtotal),
    });
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
  };
}
