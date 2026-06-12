"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// Field teks/angka: disimpan apa adanya.
const TEXT_KEYS = ["store_name", "ongkir", "qris_string", "owner_wa", "wa_template"]
// Field boolean (checkbox): tidak muncul di FormData saat tidak dicentang,
// jadi harus ditangani eksplisit agar bisa tersimpan "false".
const BOOL_KEYS = ["online_enabled", "wa_report_enabled"]

export async function saveAppSettings(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const rows: { key: string; value: string }[] = []

  for (const key of TEXT_KEYS) {
    const raw = formData.get(key)
    if (raw === null) continue
    rows.push({ key, value: String(raw).trim() })
  }

  for (const key of BOOL_KEYS) {
    rows.push({ key, value: formData.get(key) === "true" ? "true" : "false" })
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert(rows, { onConflict: "key" })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings")
  revalidatePath("/order")
  return { ok: true as const }
}
