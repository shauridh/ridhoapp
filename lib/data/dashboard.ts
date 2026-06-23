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
  /** Breakdown omzet per metode pembayaran (semua metode) */
  paymentBreakdown: Record<string, number>;
  /** Breakdown omzet: offline total vs per platform online */
  transactionBreakdown: {
    offline: number;
    gojek: number;
    grab: number;
    shopee: number;
  };
  /** Breakdown order count per channel */
  orderCount: {
    offline: number;
    gojek: number;
    grab: number;
    shopee: number;
  };
  /** Breakdown pembayaran offline saja (cash, qris, transfer, dll) */
  offlinePaymentBreakdown: Record<string, number>;
}

/** Deteksi apakah payment method adalah platform online food */
export function isOnlinePlatform(method: string): "gojek" | "grab" | "shopee" | null {
  const m = method.toLowerCase();
  if (m.includes("gojek") || m.includes("gofood") || m.includes("go-food")) return "gojek";
  if (m.includes("grab")) return "grab";
  if (m.includes("shopee")) return "shopee";
  return null;
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
  const paymentBreakdown: Record<string, number> = {};
  const offlinePaymentBreakdown: Record<string, number> = {};
  const transactionBreakdown = { offline: 0, gojek: 0, grab: 0, shopee: 0 };
  const orderCount = { offline: 0, gojek: 0, grab: 0, shopee: 0 };
  const datedSales: DatedSale[] = [];

  for (const o of orderList) {
    const amount = Number(o.total);
    totalOmzet += amount;
    const method = (o.payment_method as string) || "lainnya";
    paymentBreakdown[method] = (paymentBreakdown[method] ?? 0) + amount;

    const platform = isOnlinePlatform(method);
    if (platform) {
      transactionBreakdown[platform] += amount;
      orderCount[platform] += 1;
    } else {
      transactionBreakdown.offline += amount;
      orderCount.offline += 1;
      offlinePaymentBreakdown[method] = (offlinePaymentBreakdown[method] ?? 0) + amount;
      const ml = method.toLowerCase();
      if (ml === "cash" || ml.includes("tunai")) cashTotal += amount;
      if (ml.includes("qris")) qrisTotal += amount;
    }

    datedSales.push({
      date: toWibDateString(new Date(o.created_at)),
      total: amount,
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
    paymentBreakdown,
    transactionBreakdown,
    orderCount,
    offlinePaymentBreakdown,
  };
}
