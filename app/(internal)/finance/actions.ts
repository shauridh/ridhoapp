"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface ManualEntryPayload {
  direction: "in" | "out";
  amount: number;
  kind: "opex" | "capex" | "capital" | "withdrawal";
  categoryId: string | null;
  note: string;
  entryDate: string;
  akunId?: string | null;
}

export async function createManualEntry(payload: ManualEntryPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  if (payload.amount <= 0) {
    return { ok: false as const, error: "Jumlah harus > 0" };
  }

  const { error } = await supabase.from("cashflow_entries").insert({
    entry_date: payload.entryDate,
    direction: payload.direction,
    amount: payload.amount,
    kind: payload.kind,
    category_id: payload.categoryId,
    source: "manual",
    note: payload.note,
    created_by: user.id,
    akun_id: payload.akunId ?? null,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}

export async function updateManualEntry(id: string, payload: ManualEntryPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };
  if (payload.amount <= 0) return { ok: false as const, error: "Jumlah harus > 0" };

  const { error } = await supabase
    .from("cashflow_entries")
    .update({
      entry_date: payload.entryDate,
      direction: payload.direction,
      amount: payload.amount,
      kind: payload.kind,
      note: payload.note,
      akun_id: payload.akunId ?? null,
    })
    .eq("id", id)
    .eq("source", "manual");

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}

export async function deleteManualEntry(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const { error } = await supabase
    .from("cashflow_entries")
    .delete()
    .eq("id", id)
    .eq("source", "manual");

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/finance");
  return { ok: true as const };
}
