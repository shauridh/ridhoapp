"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function addVariant(productId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const priceDelta = Number(formData.get("priceDelta") ?? 0)
  const type = String(formData.get("type") ?? "addon") as "option" | "addon"
  const isRequired = formData.get("isRequired") === "on"

  if (name.length === 0) {
    return { ok: false as const, error: "Nama varian wajib diisi" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    name,
    price_delta: priceDelta,
    type,
    is_required: isRequired,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath(`/settings/menu/${productId}`)
  return { ok: true as const }
}

export async function toggleVariantActive(
  variantId: string,
  productId: string,
  isActive: boolean,
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("product_variants")
    .update({ is_active: isActive })
    .eq("id", variantId)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath(`/settings/menu/${productId}`)
  return { ok: true as const }
}
