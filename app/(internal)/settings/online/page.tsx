import { createClient } from "@/lib/supabase/server"
import { SettingsSection } from "../settings-section"
import { OnlineForm } from "./online-form"

export const dynamic = "force-dynamic"

export default async function OnlinePage() {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["qris_string", "qris_image", "online_enabled"])
  const map = new Map<string, string>(
    (rows ?? []).map((r) => [r.key, r.value]),
  )

  return (
    <SettingsSection title="Pesanan Online & QRIS">
      <OnlineForm
        qrisString={map.get("qris_string") ?? ""}
        qrisImage={map.get("qris_image") ?? ""}
        onlineEnabled={map.get("online_enabled") ?? "true"}
      />
    </SettingsSection>
  )
}
