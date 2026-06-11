"use server"

import { createClient } from "@/lib/supabase/server"

const BUCKET = "produk-images"

// Upload gambar produk ke Supabase Storage, kembalikan public URL.
export async function uploadProductImage(formData: FormData) {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "File tidak valid" }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false as const, error: "Ukuran maksimal 5MB" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const ext = file.name.split(".").pop() || "jpg"
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { ok: false as const, error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { ok: true as const, url: data.publicUrl }
}
