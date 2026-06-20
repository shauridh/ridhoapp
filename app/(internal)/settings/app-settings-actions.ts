"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function upsertKeys(rows: { key: string; value: string }[]) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };
  const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/settings", "layout");
  revalidatePath("/order");
  return { ok: true as const };
}

export async function saveTokoSettings(formData: FormData) {
  return upsertKeys([
    { key: "store_name", value: String(formData.get("store_name") ?? "").trim() },
    { key: "ongkir", value: String(formData.get("ongkir") ?? "0").trim() },
    { key: "store_address", value: String(formData.get("store_address") ?? "").trim() },
    { key: "store_phone", value: String(formData.get("store_phone") ?? "").trim() },
    { key: "receipt_footer", value: String(formData.get("receipt_footer") ?? "").trim() },
  ]);
}

export async function saveOnlineSettings(formData: FormData) {
  return upsertKeys([
    { key: "qris_string", value: String(formData.get("qris_string") ?? "").trim() },
    { key: "qris_image", value: String(formData.get("qris_image") ?? "").trim() },
    {
      key: "online_enabled",
      value: formData.get("online_enabled") === "true" ? "true" : "false",
    },
  ]);
}

export async function saveWhatsappSettings(formData: FormData) {
  return upsertKeys([
    { key: "owner_wa", value: String(formData.get("owner_wa") ?? "").trim() },
    {
      key: "wa_report_enabled",
      value: formData.get("wa_report_enabled") === "true" ? "true" : "false",
    },
    { key: "wa_template", value: String(formData.get("wa_template") ?? "").trim() },
    { key: "wa_estimasi", value: String(Number(formData.get("wa_estimasi") ?? 30)) },
  ]);
}

export async function saveKasirSettings(formData: FormData) {
  // Checkboxes tidak mengirim nilai kalau tidak dicentang — tangani eksplisit
  const extraMethods = formData.getAll("extra_payment_methods").map(String).join(",");
  return upsertKeys([
    {
      key: "enable_discount",
      value: formData.get("enable_discount") === "true" ? "true" : "false",
    },
    {
      key: "enable_reprint",
      value: formData.get("enable_reprint") === "true" ? "true" : "false",
    },
    {
      key: "enable_table_number",
      value: formData.get("enable_table_number") === "true" ? "true" : "false",
    },
    { key: "extra_payment_methods", value: extraMethods },
  ]);
}
