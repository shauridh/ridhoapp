import { createClient } from "@/lib/supabase/server";
import { SettingsSection } from "../settings-section";
import { TokoForm } from "./toko-form";

export const dynamic = "force-dynamic";

export default async function TokoPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["store_name", "ongkir", "store_address", "store_phone", "receipt_footer"]);
  const map = new Map<string, string>((rows ?? []).map((r) => [r.key, r.value]));

  return (
    <SettingsSection title="Toko">
      <TokoForm
        storeName={map.get("store_name") ?? "Sabana Fried Chicken"}
        ongkir={map.get("ongkir") ?? "0"}
        storeAddress={map.get("store_address") ?? ""}
        storePhone={map.get("store_phone") ?? ""}
        receiptFooter={map.get("receipt_footer") ?? ""}
      />
    </SettingsSection>
  );
}
