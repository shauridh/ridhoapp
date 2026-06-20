import { createClient } from "@/lib/supabase/server";

export type OnlinePlatform = "web" | "gofood" | "grabfood" | "shopeefood" | "manual";

export interface OnlineOrderRow {
  id: string;
  nama: string;
  phone: string;
  alamat: string | null;
  items: { name: string; qty: number; harga: number }[];
  catatan: string | null;
  subtotal: number;
  ongkir: number;
  total: number;
  status: "pending" | "confirmed" | "paid" | "done" | "cancelled";
  platform: OnlinePlatform;
  location_url: string | null;
  created_at: string;
}

// Daftar pesanan online aktif (belum selesai/batal) untuk panel kasir.
export async function listActiveOnlineOrders(): Promise<OnlineOrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("online_orders")
    .select("*")
    .in("status", ["pending", "confirmed", "paid"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Riwayat pesanan online untuk laporan, dengan filter platform opsional
export async function listOnlineOrderHistory(
  startIso?: string,
  endIso?: string,
  platform?: OnlinePlatform | "all"
): Promise<OnlineOrderRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("online_orders")
    .select("*")
    .in("status", ["done", "cancelled", "paid", "confirmed", "pending"])
    .order("created_at", { ascending: false })
    .limit(200);

  if (startIso) q = q.gte("created_at", startIso);
  if (endIso) q = q.lte("created_at", endIso);
  if (platform && platform !== "all") q = q.eq("platform", platform);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Agregasi omzet per platform untuk dashboard
export async function getOnlineOrdersByPlatform(
  startIso: string,
  endIso: string
): Promise<{ platform: OnlinePlatform; count: number; total: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("online_orders")
    .select("platform, total")
    .in("status", ["done", "paid"])
    .gte("created_at", startIso)
    .lte("created_at", endIso);
  if (error) return [];

  const map: Record<string, { count: number; total: number }> = {};
  for (const row of data ?? []) {
    const p = (row.platform ?? "web") as OnlinePlatform;
    if (!map[p]) map[p] = { count: 0, total: 0 };
    map[p].count++;
    map[p].total += Number(row.total);
  }
  return Object.entries(map).map(([platform, v]) => ({
    platform: platform as OnlinePlatform,
    ...v,
  }));
}
