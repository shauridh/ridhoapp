import { createClient } from "@/lib/supabase/server";

export interface OrderRow {
  id: string;
  total: number;
  payment_method: "cash" | "qris";
  source: string;
  status: string;
  void_reason: string | null;
  created_at: string;
}

export async function listRecentOrders(limit = 50): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrderVoidMetrics(
  startDate: string,
  endDate: string
): Promise<{
  totalOrders: number;
  voidOrders: number;
  voidRate: number;
  completedOrders: number;
}> {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("status")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (error) throw new Error(error.message);

  const totalOrders = orders?.length ?? 0;
  if (totalOrders === 0) {
    return {
      totalOrders: 0,
      voidOrders: 0,
      voidRate: 0,
      completedOrders: 0,
    };
  }

  const voidOrders = orders.filter((o) => o.status === "voided").length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;

  return {
    totalOrders,
    voidOrders,
    voidRate: (voidOrders / totalOrders) * 100,
    completedOrders,
  };
}
