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

export async function addCategory(name: string) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }
  const clean = name.trim()
  if (!clean) return { ok: false as const, error: "Nama kategori wajib diisi" }

  // Taruh di urutan paling akhir.
  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = (last?.sort_order ?? 0) + 10

  const { error } = await supabase
    .from("categories")
    .insert({ name: clean, sort_order: nextOrder })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings/menu")
  revalidatePath("/pos")
  return { ok: true as const }
}

export async function renameCategory(id: string, name: string) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }
  const clean = name.trim()
  if (!clean) return { ok: false as const, error: "Nama kategori wajib diisi" }

  // Ambil nama lama untuk sinkronisasi produk.
  const { data: old } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .maybeSingle()

  const { error } = await supabase
    .from("categories")
    .update({ name: clean })
    .eq("id", id)
  if (error) return { ok: false as const, error: error.message }

  // Sinkronkan products.category agar tetap konsisten.
  if (old?.name && old.name !== clean) {
    await supabase
      .from("products")
      .update({ category: clean })
      .eq("category", old.name)
  }

  revalidatePath("/settings/menu")
  revalidatePath("/pos")
  return { ok: true as const }
}

export async function deleteCategory(id: string) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  // Cek apakah masih dipakai produk.
  const { data: cat } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .maybeSingle()
  if (cat?.name) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category", cat.name)
    if ((count ?? 0) > 0) {
      return {
        ok: false as const,
        error: `Kategori dipakai ${count} produk. Pindahkan dulu produknya.`,
      }
    }
  }

  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings/menu")
  revalidatePath("/pos")
  return { ok: true as const }
}

// Simpan ulang urutan kategori berdasar array id terurut.
export async function reorderCategories(orderedIds: string[]) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("categories")
      .update({ sort_order: (i + 1) * 10 })
      .eq("id", orderedIds[i])
  }

  revalidatePath("/settings/menu")
  revalidatePath("/pos")
  return { ok: true as const }
}
