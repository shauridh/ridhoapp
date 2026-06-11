"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { validateProductInput, type ProductInput } from "@/lib/domain/menu"

function parseProductForm(formData: FormData): ProductInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    type: (String(formData.get("type") ?? "single") as ProductInput["type"]),
    basePrice: Number(formData.get("basePrice") ?? 0),
    category: String(formData.get("category") ?? "").trim(),
  }
}

export async function createProduct(formData: FormData) {
  const input = parseProductForm(formData)
  const validation = validateProductInput(input)
  if (!validation.ok) {
    return { ok: false as const, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("products").insert({
    name: input.name,
    type: input.type,
    base_price: input.basePrice,
    category: input.category,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings/menu")
  return { ok: true as const }
}

export async function updateProduct(id: string, formData: FormData) {
  const input = parseProductForm(formData)
  const validation = validateProductInput(input)
  if (!validation.ok) {
    return { ok: false as const, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      type: input.type,
      base_price: input.basePrice,
      category: input.category,
    })
    .eq("id", id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings/menu")
  revalidatePath(`/settings/menu/${id}`)
  return { ok: true as const }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings/menu")
  return { ok: true as const }
}
