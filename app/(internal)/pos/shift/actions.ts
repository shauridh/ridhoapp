"use server";

import { revalidatePath } from "next/cache";
import { topSellers, type SaleLine } from "@/lib/domain/report";
import { getBusinessCashflow } from "@/lib/data/cashflow";
import { formatShiftReport, renderShiftTemplate } from "@/lib/domain/shift-report";
import { sendWa } from "@/lib/wa/getsender";
import { createClient } from "@/lib/supabase/server";

export async function openShift(openingBalance: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const { data: existing } = await supabase
    .from("shifts")
    .select("id")
    .eq("status", "open")
    .maybeSingle();
  if (existing) return { ok: false as const, error: "Shift sudah terbuka" };

  const { data, error } = await supabase
    .from("shifts")
    .insert({ opened_by: user.id, opening_balance: openingBalance })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/pos/shift");
  revalidatePath("/pos");
  return { ok: true as const, shiftId: data.id };
}

export async function closeShift(payload: {
  shiftId: string;
  countedCash: number;
  ownerWithdrawal: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  // Validasi minimum kas dalam laci setelah penarikan owner
  const MIN_DRAWER = 350_000;
  const closingBalance = payload.countedCash - payload.ownerWithdrawal;
  if (closingBalance < MIN_DRAWER) {
    return {
      ok: false as const,
      error: `Kas dalam laci setelah penarikan harus minimal Rp ${MIN_DRAWER.toLocaleString("id-ID")}. Sisa saat ini: Rp ${closingBalance.toLocaleString("id-ID")}.`,
    };
  }

  // RPC transaksional: hitung kas + tutup shift + catat pemasukan, atomik.
  const { data: summary, error } = await supabase.rpc("close_shift", {
    p_shift_id: payload.shiftId,
    p_counted_cash: payload.countedCash,
    p_owner_withdrawal: payload.ownerWithdrawal,
  });
  if (error) return { ok: false as const, error: error.message };

  // Kirim rekap shift ke WA owner (best-effort, tidak menggagalkan tutup shift).
  const s = (summary ?? {}) as {
    cashSales?: number;
    qrisTotal?: number;
    transferTotal?: number;
    gojekTotal?: number;
    grabTotal?: number;
    shopeeTotal?: number;
    otherTotal?: number;
    cashOut?: number;
    openingBalance?: number;
    closingBalance?: number;
    ownerWithdrawal?: number;
    cashDiff?: number;
  };
  await sendShiftReport(supabase, payload.shiftId, {
    cashSales: Number(s.cashSales ?? 0),
    qrisTotal: Number(s.qrisTotal ?? 0),
    transferTotal: Number(s.transferTotal ?? 0),
    gojekTotal: Number(s.gojekTotal ?? 0),
    grabTotal: Number(s.grabTotal ?? 0),
    shopeeTotal: Number(s.shopeeTotal ?? 0),
    otherTotal: Number(s.otherTotal ?? 0),
    cashOut: Number(s.cashOut ?? 0),
    openingBalance: Number(s.openingBalance ?? 0),
    closingBalance: Number(s.closingBalance ?? 0),
    ownerWithdrawal: Number(s.ownerWithdrawal ?? 0),
    cashDiff: Number(s.cashDiff ?? 0),
  });

  revalidatePath("/pos/shift");
  revalidatePath("/pos");
  return { ok: true as const };
}

// Helper terpisah agar closeShift tetap ringkas. Semua kegagalan ditelan.
async function sendShiftReport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shiftId: string,
  totals: {
    cashSales: number;
    qrisTotal: number;
    transferTotal: number;
    gojekTotal: number;
    grabTotal: number;
    shopeeTotal: number;
    otherTotal: number;
    cashOut: number;
    openingBalance: number;
    closingBalance: number;
    ownerWithdrawal: number;
    cashDiff: number;
  }
) {
  try {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["owner_wa", "wa_report_enabled", "store_name", "wa_template"]);
    const map = new Map<string, string>((settings ?? []).map((s) => [s.key, s.value]));
    if (map.get("wa_report_enabled") !== "true") return;
    const ownerWa = map.get("owner_wa");
    if (!ownerWa) return;

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, order_items(product_name, qty, subtotal)")
      .eq("shift_id", shiftId)
      .eq("status", "completed");
    const orderList = orders ?? [];

    const lines: SaleLine[] = [];
    let omzet = 0;
    let item = 0;
    for (const o of orderList) {
      omzet += Number(o.total);
      const items =
        (o.order_items as unknown as {
          product_name: string;
          qty: number;
          subtotal: number;
        }[]) ?? [];
      for (const it of items) {
        item += it.qty;
        lines.push({
          name: it.product_name,
          qty: it.qty,
          subtotal: Number(it.subtotal),
          hour: 0,
        });
      }
    }

    const todayWib = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const [cashflow, akunResult] = await Promise.all([
      getBusinessCashflow(todayWib, todayWib),
      supabase.from("akun").select("saldo_awal, aktif, id"),
    ]);

    // Saldo ril = saldo_awal + net cashflow per akun (simplified: total saldo awal aktif + net cashflow hari ini)
    // Untuk akurasi penuh gunakan listAkunWithBalance tapi itu butuh server client
    // Di sini kita ambil dari cashflow_entries saldo total semua akun aktif
    const { data: allFlows } = await supabase
      .from("cashflow_entries")
      .select("akun_id, direction, amount")
      .not("akun_id", "is", null);
    const netPerAkun: Record<string, number> = {};
    for (const f of allFlows ?? []) {
      if (!f.akun_id) continue;
      netPerAkun[f.akun_id] =
        (netPerAkun[f.akun_id] ?? 0) +
        (f.direction === "in" ? Number(f.amount) : -Number(f.amount));
    }
    const saldoRil = (akunResult.data ?? [])
      .filter((a) => a.aktif)
      .reduce((s, a) => s + Number(a.saldo_awal) + (netPerAkun[a.id] ?? 0), 0);

    const reportData = {
      storeName: map.get("store_name") ?? "Sabana Fried Chicken",
      closedAt: new Date().toISOString(),
      omzet,
      transaksi: orderList.length,
      item,
      tunai: totals.cashSales,
      qris: totals.qrisTotal,
      transfer: totals.transferTotal,
      gojek: totals.gojekTotal,
      grab: totals.grabTotal,
      shopee: totals.shopeeTotal,
      lainnya: totals.otherTotal,
      kasAwal: totals.openingBalance,
      kasAkhir: totals.closingBalance + totals.ownerWithdrawal,
      cashOut: totals.cashOut,
      ownerWithdrawal: totals.ownerWithdrawal,
      selisih: totals.cashDiff,
      sisaLaci: totals.closingBalance,
      cfPemasukan: cashflow.pemasukanLain,
      cfOpex: cashflow.totalOpex,
      cfCapex: cashflow.totalCapex,
      cfWithdrawal: cashflow.totalWithdrawal,
      saldoRil,
      cfEntries: cashflow.entries,
      topSellers: topSellers(lines, 5).map((s) => ({
        name: s.name,
        qty: s.qty,
      })),
    };

    // Pakai template kustom jika diisi, jika tidak pakai format default.
    const template = map.get("wa_template")?.trim();
    const msg = template
      ? renderShiftTemplate(template, reportData)
      : formatShiftReport(reportData);

    await sendWa(ownerWa, msg);
  } catch {
    // best-effort: abaikan kegagalan WA
  }
}

export async function cashOut(shiftId: string, amount: number, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };
  if (amount <= 0) return { ok: false as const, error: "Jumlah harus > 0" };

  const { error } = await supabase.from("cash_drawer_movements").insert({
    shift_id: shiftId,
    direction: "out",
    amount,
    reason,
    created_by: user.id,
  });
  if (error) return { ok: false as const, error: error.message };

  // Catat ke ledger keuangan (best-effort — tidak menggagalkan cash-out jika error)
  const { error: cfError } = await supabase.from("cashflow_entries").insert({
    entry_date: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    direction: "out",
    amount,
    kind: "opex",
    source: "drawer",
    ref_id: shiftId,
    note: reason || null,
    created_by: user.id,
  });
  if (cfError) {
    console.error("[cashOut] gagal insert cashflow_entries:", cfError.message);
  }

  revalidatePath("/pos/shift");
  revalidatePath("/finance");
  return { ok: true as const };
}
