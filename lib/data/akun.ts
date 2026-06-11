import { createClient } from "@/lib/supabase/server"

export interface AkunRow {
  id: string
  nama: string
  tipe: "bank" | "ewallet" | "kas_fisik"
  saldo_awal: number
  aktif: boolean
  created_at: string
}

export interface OpexRow {
  id: string
  nama: string
  nominal: number
  frekuensi: "harian" | "mingguan" | "bulanan"
  jatuh_tempo: number | null
  aktif: boolean
  created_at: string
}

export interface PiutangRow {
  id: string
  pihak: string
  nominal: number
  tipe: "hutang" | "piutang"
  keterangan: string
  status: "belum" | "lunas"
  jatuh_tempo: string | null
  tenor: number | null
  cicilan: number | null
  bunga: number | null
  created_at: string
}

export async function listAkun(): Promise<AkunRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("akun")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listOpex(): Promise<OpexRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("opex")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listPiutang(): Promise<PiutangRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("piutang")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}
