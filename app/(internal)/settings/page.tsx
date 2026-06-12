import { createClient } from "@/lib/supabase/server"
import { AppSettingsManager } from "./app-settings-manager"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["store_name", "ongkir", "qris_string", "online_enabled"])

  const settings = new Map<string, string>(
    (rows ?? []).map((r) => [r.key, r.value]),
  )

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-bold text-ink">Pengaturan Toko</h1>
      <AppSettingsManager
        storeName={settings.get("store_name") ?? "Sabana Fried Chicken"}
        ongkir={settings.get("ongkir") ?? "0"}
        qrisString={settings.get("qris_string") ?? ""}
        onlineEnabled={settings.get("online_enabled") ?? "true"}
      />
    </div>
  )
}
