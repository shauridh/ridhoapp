import { getCurrentOpenShift, getLastClosedShiftBalance } from "@/lib/data/shifts";
import { createClient } from "@/lib/supabase/server";
import { OpenShiftGate } from "./open-shift-gate";
import { PosClient } from "./pos-client";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const openShift = await getCurrentOpenShift();

  if (!openShift) {
    const lastBalance = await getLastClosedShiftBalance();
    return <OpenShiftGate lastBalance={lastBalance} />;
  }

  const supabase = await createClient();
  const { data: settingsRows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "store_name",
      "store_address",
      "store_phone",
      "qris_image",
      "receipt_footer",
      "enable_discount",
      "enable_reprint",
      "extra_payment_methods",
      "enable_table_number",
    ]);

  const settingsMap = new Map((settingsRows ?? []).map((r) => [r.key, r.value]));

  const extraPaymentMethods = (settingsMap.get("extra_payment_methods") ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter((s: string): s is "transfer" | "debit" => s === "transfer" || s === "debit");

  return (
    <PosClient
      shiftId={openShift.id}
      openingBalance={Number(openShift.opening_balance)}
      qrisImageUrl={settingsMap.get("qris_image") || undefined}
      storeName={settingsMap.get("store_name") || "Sabana POS"}
      storeAddress={settingsMap.get("store_address") || undefined}
      storePhone={settingsMap.get("store_phone") || undefined}
      receiptFooter={settingsMap.get("receipt_footer") || undefined}
      enableDiscount={settingsMap.get("enable_discount") === "true"}
      enableReprint={settingsMap.get("enable_reprint") !== "false"}
      enableTableNumber={settingsMap.get("enable_table_number") === "true"}
      extraPaymentMethods={extraPaymentMethods}
    />
  );
}
