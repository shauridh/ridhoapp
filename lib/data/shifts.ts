import { createClient } from "@/lib/supabase/server";
import { calcExpectedCash } from "@/lib/domain/shift";

export interface ShiftRow {
  id: string;
  opened_by: string;
  opened_at: string;
  closed_by: string | null;
  closed_at: string | null;
  opening_balance: number;
  expected_cash: number;
  counted_cash: number | null;
  cash_difference: number | null;
  owner_withdrawal: number | null;
  closing_balance: number | null;
  qris_total: number;
  status: "open" | "closed";
}

export async function getCurrentOpenShift(): Promise<ShiftRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("status", "open")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listRecentShifts(limit = 20): Promise<ShiftRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .order("opened_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCashAccuracyMetrics(
  startDate: string,
  endDate: string
): Promise<{
  totalShifts: number;
  accurateShifts: number;
  accuracyRate: number;
  avgCashDifference: number;
}> {
  const supabase = await createClient();
  const { data: shifts, error } = await supabase
    .from("shifts")
    .select("cash_difference")
    .eq("status", "closed")
    .gte("closed_at", startDate)
    .lte("closed_at", endDate);

  if (error) throw new Error(error.message);

  const totalShifts = shifts?.length ?? 0;
  if (totalShifts === 0) {
    return {
      totalShifts: 0,
      accurateShifts: 0,
      accuracyRate: 0,
      avgCashDifference: 0,
    };
  }

  const accurateShifts = shifts.filter(
    (s) => Math.abs(Number(s.cash_difference ?? 0)) === 0
  ).length;

  const totalDifference = shifts.reduce(
    (sum, s) => sum + Math.abs(Number(s.cash_difference ?? 0)),
    0
  );

  return {
    totalShifts,
    accurateShifts,
    accuracyRate: (accurateShifts / totalShifts) * 100,
    avgCashDifference: totalDifference / totalShifts,
  };
}

// Saldo laci yang ditinggal shift closed terakhir (jadi modal awal shift berikutnya).
export async function getLastClosedShiftBalance(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shifts")
    .select("closing_balance")
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Number(data?.closing_balance ?? 0);
}

// Total semua dana yang sudah ditarik owner dari shifts (kas ril owner).
export async function getTotalOwnerWithdrawals(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("shifts").select("owner_withdrawal").eq("status", "closed");

  if (!data) return 0;
  return data.reduce((sum, row) => sum + Number(row.owner_withdrawal ?? 0), 0);
}

export interface DrawerMovement {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

// Daftar pengeluaran (cash out) dari laci untuk shift berjalan.
export async function listDrawerMovements(shiftId: string): Promise<DrawerMovement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_drawer_movements")
    .select("id, amount, reason, created_at")
    .eq("shift_id", shiftId)
    .eq("direction", "out")
    .order("created_at", { ascending: false });
  return (data ?? []).map((m) => ({
    id: m.id,
    amount: Number(m.amount),
    reason: m.reason,
    created_at: m.created_at,
  }));
}

export async function getShiftCashSummary(shift: ShiftRow) {
  const supabase = await createClient();

  const { data: cashOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shift.id)
    .eq("payment_method", "cash")
    .eq("status", "completed");
  const cashSales = (cashOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  const { data: qrisOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shift.id)
    .eq("payment_method", "qris")
    .eq("status", "completed");
  const qrisTotal = (qrisOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  const { data: cashOutRows } = await supabase
    .from("cash_drawer_movements")
    .select("amount")
    .eq("shift_id", shift.id)
    .eq("direction", "out");
  const cashOut = (cashOutRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  return {
    cashSales,
    qrisTotal,
    cashOut,
    expectedCash: calcExpectedCash(Number(shift.opening_balance), cashSales, cashOut),
  };
}
