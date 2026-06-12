"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

async function upsertKeys(rows: { key: string; value: string }[]) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }
  const { error } = await supabase
    .from("app_settings")
    .upsert(rows, { onConflict: "key" })
  if (error) return { ok: false as const, error: error.message }
  revalidatePath("/settings", "layout")
  revalidatePath("/order")
  return { ok: true as const }
}

export async function saveTokoSettings(formData: FormData) {
  return upsertKeys([
    { key: "store_name", value: String(formData.get("store_name") ?? "").trim() },
    { key: "ongkir", value: String(formData.get("ongkir") ?? "0").trim() },
  ])
}

export async function saveOnlineSettings(formData: FormData) {
  return upsertKeys([
    { key: "qris_string", value: String(formData.get("qris_string") ?? "").trim() },
    { key: "qris_image", value: String(formData.get("qris_image") ?? "").trim() },
    {
      key: "online_enabled",
      value: formData.get("online_enabled") === "true" ? "true" : "false",
    },
  ])
}

export async function saveWhatsappSettings(formData: FormData) {
  return upsertKeys([
    { key: "owner_wa", value: String(formData.get("owner_wa") ?? "").trim() },
    {
      key: "wa_report_enabled",
      value: formData.get("wa_report_enabled") === "true" ? "true" : "false",
    },
    { key: "wa_template", value: String(formData.get("wa_template") ?? "").trim() },
  ])
}
