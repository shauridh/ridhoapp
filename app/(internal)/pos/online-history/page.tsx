import { createClient } from "@/lib/supabase/server";
import { listOnlineOrderHistory, getOnlineOrdersByPlatform } from "@/lib/data/online-orders";
import { OnlineHistoryClient } from "./online-history-client";

export const dynamic = "force-dynamic";

export default async function OnlineHistoryPage() {
  // Default: 30 hari terakhir (WIB)
  const todayWib = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const sinceDate = new Date(`${todayWib}T00:00:00+07:00`);
  sinceDate.setDate(sinceDate.getDate() - 30);
  const sinceIso = sinceDate.toISOString();
  const nowIso = new Date().toISOString();

  const [orders, platformStats] = await Promise.all([
    listOnlineOrderHistory(sinceIso, nowIso),
    getOnlineOrdersByPlatform(sinceIso, nowIso),
  ]);

  return <OnlineHistoryClient orders={orders} platformStats={platformStats} />;
}
