import { createClient } from "@/lib/supabase/server";
import { SettingsSection } from "../settings-section";
import { KasirForm } from "./kasir-form";

export const dynamic = "force-dynamic";

export default async function KasirSettingsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "enable_discount",
      "enable_reprint",
      "extra_payment_methods",
      "enable_table_number",
    ]);

  const map = new Map<string, string>((rows ?? []).map((r) => [r.key, r.value]));

  const extraPaymentMethods = (map.get("extra_payment_methods") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <SettingsSection title="Fitur Kasir">
      <KasirForm
        enableDiscount={map.get("enable_discount") === "true"}
        enableReprint={map.get("enable_reprint") !== "false"}
        extraPaymentMethods={extraPaymentMethods}
        enableTableNumber={map.get("enable_table_number") === "true"}
      />
    </SettingsSection>
  );
}
