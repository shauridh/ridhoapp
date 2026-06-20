import { createClient } from "@/lib/supabase/server";

/**
 * Kembalikan array product_id diurutkan dari paling laku,
 * berdasar penjualan 90 hari terakhir (order status completed).
 * Aggregasi dilakukan di server, bukan di client.
 */
export async function getBestSellerIds(): Promise<string[]> {
  const supabase = await createClient();

  const todayWib = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const since = new Date(`${todayWib}T00:00:00+07:00`);
  since.setDate(since.getDate() - 90);
  const sinceIso = since.toISOString();

  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, qty, orders!inner(status, created_at)")
    .eq("orders.status", "completed")
    .gte("orders.created_at", sinceIso);

  if (error || !data) return [];

  // Aggregasi di JS setelah filter terbatas 90 hari
  const totals: Record<string, number> = {};
  for (const row of data) {
    const pid = row.product_id as string;
    totals[pid] = (totals[pid] ?? 0) + (row.qty as number);
  }

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}
