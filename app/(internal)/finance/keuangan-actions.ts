"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcInstallment } from "@/lib/domain/piutang";

// Defense-in-depth: pastikan pemanggil terautentikasi (RLS juga menegakkan ini).
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addAkun(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const nama = String(formData.get("nama") ?? "").trim();
  const tipe = String(formData.get("tipe") ?? "kas_fisik") as "bank" | "ewallet" | "kas_fisik";
  const saldoAwal = Number(formData.get("saldoAwal") ?? 0);
  if (!nama) return { ok: false as const, error: "Nama akun wajib diisi" };

  const { error } = await supabase.from("akun").insert({ nama, tipe, saldo_awal: saldoAwal });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}

export async function addOpex(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const nama = String(formData.get("nama") ?? "").trim();
  const nominal = Number(formData.get("nominal") ?? 0);
  const frekuensi = String(formData.get("frekuensi") ?? "bulanan") as
    | "harian"
    | "mingguan"
    | "bulanan";
  const jatuhTempoRaw = String(formData.get("jatuhTempo") ?? "").trim();
  const jatuhTempo = jatuhTempoRaw ? Number(jatuhTempoRaw) : null;
  if (!nama || nominal <= 0) {
    return { ok: false as const, error: "Nama dan nominal wajib diisi" };
  }

  const { error } = await supabase.from("opex").insert({
    nama,
    nominal,
    frekuensi,
    jatuh_tempo: jatuhTempo,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}

export async function toggleOpexActive(id: string, aktif: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const { error } = await supabase.from("opex").update({ aktif }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/finance");
  return { ok: true as const };
}

export async function addPiutang(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const pihak = String(formData.get("pihak") ?? "").trim();
  const nominal = Number(formData.get("nominal") ?? 0);
  const tipe = String(formData.get("tipe") ?? "piutang") as "hutang" | "piutang";
  const keterangan = String(formData.get("keterangan") ?? "").trim();
  const jatuhTempoRaw = String(formData.get("jatuhTempo") ?? "").trim();
  const tenorRaw = String(formData.get("tenor") ?? "").trim();
  const bungaRaw = String(formData.get("bunga") ?? "").trim();

  if (!pihak || nominal <= 0) {
    return { ok: false as const, error: "Pihak dan nominal wajib diisi" };
  }

  const tenor = tenorRaw ? Number(tenorRaw) : null;
  const bunga = bungaRaw ? Number(bungaRaw) : null;
  const cicilan = tenor && tenor > 0 ? calcInstallment(nominal, bunga ?? 0, tenor) : null;

  const { error } = await supabase.from("piutang").insert({
    pihak,
    nominal,
    tipe,
    keterangan,
    jatuh_tempo: jatuhTempoRaw || null,
    tenor,
    bunga,
    cicilan,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}

export async function markPiutangLunas(id: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const { error } = await supabase.from("piutang").update({ status: "lunas" }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/finance");
  return { ok: true as const };
}

export async function editAkun(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const nama = String(formData.get("nama") ?? "").trim();
  const tipe = String(formData.get("tipe") ?? "kas_fisik") as "bank" | "ewallet" | "kas_fisik";
  const saldoAwal = Number(formData.get("saldoAwal") ?? 0);
  if (!nama) return { ok: false as const, error: "Nama akun wajib diisi" };

  const { error } = await supabase
    .from("akun")
    .update({ nama, tipe, saldo_awal: saldoAwal })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}

export async function toggleOwnerAkun(id: string, isOwner: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  // Jika set sebagai owner, reset akun owner lain dulu
  if (isOwner) {
    await supabase.from("akun").update({ is_owner: false }).eq("is_owner", true);
  }

  const { error } = await supabase.from("akun").update({ is_owner: isOwner }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}

export async function deleteAkun(id: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const { error } = await supabase.from("akun").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}

export async function transferAntarAkun(payload: {
  fromAkunId: string;
  toAkunId: string;
  amount: number;
  note: string;
  entryDate: string;
}) {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };
  if (payload.amount <= 0) return { ok: false as const, error: "Nominal harus > 0" };
  if (payload.fromAkunId === payload.toAkunId)
    return { ok: false as const, error: "Akun asal dan tujuan tidak boleh sama" };

  // Cek saldo akun asal cukup
  const { data: flows } = await supabase
    .from("cashflow_entries")
    .select("akun_id, direction, amount")
    .eq("akun_id", payload.fromAkunId);
  const { data: akunData } = await supabase
    .from("akun")
    .select("saldo_awal")
    .eq("id", payload.fromAkunId)
    .single();

  const net = (flows ?? []).reduce(
    (s, f) => s + (f.direction === "in" ? Number(f.amount) : -Number(f.amount)),
    Number(akunData?.saldo_awal ?? 0)
  );
  if (net < payload.amount) {
    return {
      ok: false as const,
      error: `Saldo tidak cukup. Saldo tersedia: Rp ${net.toLocaleString("id-ID")}`,
    };
  }

  // Buat ref_id unik untuk pasangan transfer ini
  const refId = crypto.randomUUID();
  const note = payload.note.trim() || "Transfer antar akun";

  const entries = [
    {
      entry_date: payload.entryDate,
      direction: "out" as const,
      amount: payload.amount,
      kind: "transfer",
      source: "transfer",
      ref_id: refId,
      note,
      created_by: user.id,
      akun_id: payload.fromAkunId,
    },
    {
      entry_date: payload.entryDate,
      direction: "in" as const,
      amount: payload.amount,
      kind: "transfer",
      source: "transfer",
      ref_id: refId,
      note,
      created_by: user.id,
      akun_id: payload.toAkunId,
    },
  ];

  const { error } = await supabase.from("cashflow_entries").insert(entries);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}
