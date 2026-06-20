import { createClient } from "@/lib/supabase/server";
import { listOnlineOrderHistory, getOnlineOrdersByPlatform } from "@/lib/data/online-orders";
import { OnlineHistoryClient } from "./online-history-client";

export const dynamic = "force-dynamic";

export default async function OnlineHistoryPage() {
  // Default: 30 hari terakhir
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();
  const nowIso = new Date().toISOString();

  const [orders, platformStats] = await Promise.all([
    listOnlineOrderHistory(sinceIso, nowIso),
    getOnlineOrdersByPlatform(sinceIso, nowIso),
  ]);

  return <OnlineHistoryClient orders={orders} platformStats={platformStats} />;
}
