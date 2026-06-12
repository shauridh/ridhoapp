"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const VALID_KEYS = ["store_name", "ongkir", "qris_string", "online_enabled"]

export async function saveAppSettings(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const rows: { key: string; value: string }[] = []
  for (const key of VALID_KEYS) {
    const raw = formData.get(key)
    if (raw === null) continue
    const value = String(raw).trim()
    if (value || key === "ongkir") {
      rows.push({ key, value })
    }
  }

  if (rows.length === 0) {
    return { ok: false as const, error: "Tidak ada data untuk disimpan" }
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert(rows, { onConflict: "key" })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings")
  revalidatePath("/order")
  return { ok: true as const }
}
