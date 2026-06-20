import { createClient } from "@/lib/supabase/server";
import { HistoryClient } from "./history-client";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["enable_reprint", "extra_payment_methods"]);

  const map = new Map((rows ?? []).map((r) => [r.key, r.value]));
  const enableReprint = map.get("enable_reprint") !== "false";
  const extraPaymentMethods = (map.get("extra_payment_methods") ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter((s: string): s is "transfer" | "debit" => s === "transfer" || s === "debit");

  return <HistoryClient enableReprint={enableReprint} extraPaymentMethods={extraPaymentMethods} />;
}
