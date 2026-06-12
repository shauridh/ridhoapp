"use server"

import { revalidatePath } from "next/cache"
import { calcCashDifference, calcExpectedCash } from "@/lib/domain/shift"
import { topSellers, type SaleLine } from "@/lib/domain/report"
import { formatShiftReport, renderShiftTemplate } from "@/lib/domain/shift-report"
import { sendWa } from "@/lib/wa/getsender"
import { createClient } from "@/lib/supabase/server"

export async function openShift(openingBalance: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const { data: existing } = await supabase
    .from("shifts")
    .select("id")
    .eq("status", "open")
    .maybeSingle()
  if (existing) return { ok: false as const, error: "Shift sudah terbuka" }

  const { data, error } = await supabase
    .from("shifts")
    .insert({ opened_by: user.id, opening_balance: openingBalance })
    .select("id")
    .single()
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/pos/shift")
  revalidatePath("/pos")
  return { ok: true as const, shiftId: data.id }
}

export async function closeShift(payload: {
  shiftId: string
  countedCash: number
  ownerWithdrawal: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const { data: shift } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", payload.shiftId)
    .single()
  if (!shift) return { ok: false as const, error: "Shift tidak ditemukan" }
  if (shift.status === "closed") {
    return { ok: false as const, error: "Shift sudah ditutup" }
  }

  const { data: cashOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", payload.shiftId)
    .eq("payment_method", "cash")
    .eq("status", "completed")
  const cashSales = (cashOrders ?? []).reduce((s, o) => s + Number(o.total), 0)

  const { data: qrisOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", payload.shiftId)
    .eq("payment_method", "qris")
    .eq("status", "completed")
  const qrisTotal = (qrisOrders ?? []).reduce((s, o) => s + Number(o.total), 0)

  const { data: movements } = await supabase
    .from("cash_drawer_movements")
    .select("amount")
    .eq("shift_id", payload.shiftId)
    .eq("direction", "out")
  const cashOut = (movements ?? []).reduce((s, m) => s + Number(m.amount), 0)

  const expectedCash = calcExpectedCash(
    Number(shift.opening_balance),
    cashSales,
    cashOut,
  )
  const cashDiff = calcCashDifference(expectedCash, payload.countedCash)
  const closingBalance = payload.countedCash - payload.ownerWithdrawal

  const { error: updErr } = await supabase
    .from("shifts")
    .update({
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      expected_cash: expectedCash,
      counted_cash: payload.countedCash,
      cash_difference: cashDiff,
      owner_withdrawal: payload.ownerWithdrawal,
      closing_balance: closingBalance,
      qris_total: qrisTotal,
      status: "closed",
    })
    .eq("id", payload.shiftId)
  if (updErr) return { ok: false as const, error: updErr.message }

  const totalIncome = cashSales + qrisTotal
  if (totalIncome > 0) {
    await supabase.from("cashflow_entries").insert({
      entry_date: new Date().toISOString().slice(0, 10),
      direction: "in",
      amount: totalIncome,
      kind: "income",
      source: "sale",
      ref_id: payload.shiftId,
      note: `Penjualan shift ${payload.shiftId}`,
      created_by: user.id,
    })
  }

  // Kirim rekap shift ke WA owner (best-effort, tidak menggagalkan tutup shift).
  await sendShiftReport(supabase, payload.shiftId, {
    cashSales,
    qrisTotal,
    openingBalance: Number(shift.opening_balance),
    closingBalance,
    cashDiff,
  })

  revalidatePath("/pos/shift")
  revalidatePath("/pos")
  return { ok: true as const }
}

// Helper terpisah agar closeShift tetap ringkas. Semua kegagalan ditelan.
async function sendShiftReport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shiftId: string,
  totals: {
    cashSales: number
    qrisTotal: number
    openingBalance: number
    closingBalance: number
    cashDiff: number
  },
) {
  try {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["owner_wa", "wa_report_enabled", "store_name", "wa_template"])
    const map = new Map<string, string>(
      (settings ?? []).map((s) => [s.key, s.value]),
    )
    if (map.get("wa_report_enabled") !== "true") return
    const ownerWa = map.get("owner_wa")
    if (!ownerWa) return

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, order_items(product_name, qty, subtotal)")
      .eq("shift_id", shiftId)
      .eq("status", "completed")
    const orderList = orders ?? []

    const lines: SaleLine[] = []
    let omzet = 0
    let item = 0
    for (const o of orderList) {
      omzet += Number(o.total)
      const items =
        (o.order_items as unknown as {
          product_name: string
          qty: number
          subtotal: number
        }[]) ?? []
      for (const it of items) {
        item += it.qty
        lines.push({
          name: it.product_name,
          qty: it.qty,
          subtotal: Number(it.subtotal),
          hour: 0,
        })
      }
    }

    const reportData = {
      storeName: map.get("store_name") ?? "Sabana Fried Chicken",
      closedAt: new Date().toISOString(),
      omzet,
      transaksi: orderList.length,
      item,
      tunai: totals.cashSales,
      qris: totals.qrisTotal,
      kasAwal: totals.openingBalance,
      kasAkhir: totals.closingBalance,
      selisih: totals.cashDiff,
      topSellers: topSellers(lines, 5).map((s) => ({
        name: s.name,
        qty: s.qty,
      })),
    }

    // Pakai template kustom jika diisi, jika tidak pakai format default.
    const template = map.get("wa_template")?.trim()
    const msg = template
      ? renderShiftTemplate(template, reportData)
      : formatShiftReport(reportData)

    await sendWa(ownerWa, msg)
  } catch {
    // best-effort: abaikan kegagalan WA
  }
}

export async function cashOut(shiftId: string, amount: number, reason: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }
  if (amount <= 0) return { ok: false as const, error: "Jumlah harus > 0" }

  const { error } = await supabase.from("cash_drawer_movements").insert({
    shift_id: shiftId,
    direction: "out",
    amount,
    reason,
    created_by: user.id,
  })
  if (error) return { ok: false as const, error: error.message }

  await supabase.from("cashflow_entries").insert({
    entry_date: new Date().toISOString().slice(0, 10),
    direction: "out",
    amount,
    kind: "opex",
    source: "drawer",
    ref_id: shiftId,
    note: reason,
    created_by: user.id,
  })

  revalidatePath("/pos/shift")
  return { ok: true as const }
}
