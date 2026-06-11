"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { calcInstallment } from "@/lib/domain/piutang"

// Defense-in-depth: pastikan pemanggil terautentikasi (RLS juga menegakkan ini).
async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function addAkun(formData: FormData) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const nama = String(formData.get("nama") ?? "").trim()
  const tipe = String(formData.get("tipe") ?? "kas_fisik") as
    | "bank"
    | "ewallet"
    | "kas_fisik"
  const saldoAwal = Number(formData.get("saldoAwal") ?? 0)
  if (!nama) return { ok: false as const, error: "Nama akun wajib diisi" }

  const { error } = await supabase
    .from("akun")
    .insert({ nama, tipe, saldo_awal: saldoAwal })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/finance")
  return { ok: true as const }
}

export async function addOpex(formData: FormData) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const nama = String(formData.get("nama") ?? "").trim()
  const nominal = Number(formData.get("nominal") ?? 0)
  const frekuensi = String(formData.get("frekuensi") ?? "bulanan") as
    | "harian"
    | "mingguan"
    | "bulanan"
  const jatuhTempoRaw = String(formData.get("jatuhTempo") ?? "").trim()
  const jatuhTempo = jatuhTempoRaw ? Number(jatuhTempoRaw) : null
  if (!nama || nominal <= 0) {
    return { ok: false as const, error: "Nama dan nominal wajib diisi" }
  }

  const { error } = await supabase.from("opex").insert({
    nama,
    nominal,
    frekuensi,
    jatuh_tempo: jatuhTempo,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/finance")
  return { ok: true as const }
}

export async function toggleOpexActive(id: string, aktif: boolean) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const { error } = await supabase.from("opex").update({ aktif }).eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath("/finance")
  return { ok: true as const }
}

export async function addPiutang(formData: FormData) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const pihak = String(formData.get("pihak") ?? "").trim()
  const nominal = Number(formData.get("nominal") ?? 0)
  const tipe = String(formData.get("tipe") ?? "piutang") as
    | "hutang"
    | "piutang"
  const keterangan = String(formData.get("keterangan") ?? "").trim()
  const jatuhTempoRaw = String(formData.get("jatuhTempo") ?? "").trim()
  const tenorRaw = String(formData.get("tenor") ?? "").trim()
  const bungaRaw = String(formData.get("bunga") ?? "").trim()

  if (!pihak || nominal <= 0) {
    return { ok: false as const, error: "Pihak dan nominal wajib diisi" }
  }

  const tenor = tenorRaw ? Number(tenorRaw) : null
  const bunga = bungaRaw ? Number(bungaRaw) : null
  const cicilan =
    tenor && tenor > 0 ? calcInstallment(nominal, bunga ?? 0, tenor) : null

  const { error } = await supabase.from("piutang").insert({
    pihak,
    nominal,
    tipe,
    keterangan,
    jatuh_tempo: jatuhTempoRaw || null,
    tenor,
    bunga,
    cicilan,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/finance")
  return { ok: true as const }
}

export async function markPiutangLunas(id: string) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const { error } = await supabase
    .from("piutang")
    .update({ status: "lunas" })
    .eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath("/finance")
  return { ok: true as const }
}
