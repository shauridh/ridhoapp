import { createClient } from "@/lib/supabase/server";
import { SettingsSection } from "../settings-section";
import { WhatsappForm } from "./whatsapp-form";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["owner_wa", "wa_report_enabled", "wa_template", "wa_estimasi"]);
  const map = new Map<string, string>((rows ?? []).map((r) => [r.key, r.value]));

  return (
    <SettingsSection title="WhatsApp & Rekap">
      <WhatsappForm
        ownerWa={map.get("owner_wa") ?? ""}
        waReportEnabled={map.get("wa_report_enabled") ?? "false"}
        waTemplate={map.get("wa_template") ?? ""}
        waEstimasi={map.get("wa_estimasi") ?? "30"}
      />
    </SettingsSection>
  );
}
