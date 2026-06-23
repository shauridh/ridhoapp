import { createClient } from "@/lib/supabase/server";

export interface CashflowEntryRow {
  id: string;
  entry_date: string;
  direction: "in" | "out";
  amount: number;
  category_id: string | null;
  kind: "income" | "opex" | "capex" | "capital" | "withdrawal" | "transfer" | "pemasukan";
  source: "sale" | "drawer" | "manual" | "transfer";
  ref_id: string | null;
  created_by: string | null;
  note: string;
  created_at: string;
  akun_id?: string | null;
}

export interface CashflowCategoryRow {
  id: string;
  name: string;
  kind: "income" | "opex" | "capex" | "capital" | "withdrawal";
  is_system: boolean;
  created_at: string;
}

export interface SalesMetrics {
  omzet: number;
  totalOrder: number;
  avgPerOrder: number;
  cashTotal: number;
  qrisTotal: number;
  onlineTotal: number;
  cashOut: number; // total cashout dari laci selama periode
  kasBersih: number; // cashTotal - cashOut (kas tunai bersih masuk)
}

/** Metrik penjualan dari tabel orders + cash_drawer_movements */
export async function getSalesMetrics(startDate: string, endDate: string): Promise<SalesMetrics> {
  const supabase = await createClient();

  const [ordersResult, cashoutResult] = await Promise.all([
    supabase
      .from("orders")
      .select("total, payment_method")
      .eq("status", "completed")
      .gte("created_at", `${startDate}T00:00:00+07:00`)
      .lte("created_at", `${endDate}T23:59:59+07:00`),
    supabase
      .from("cash_drawer_movements")
      .select("amount, created_at")
      .eq("direction", "out")
      .gte("created_at", `${startDate}T00:00:00+07:00`)
      .lte("created_at", `${endDate}T23:59:59+07:00`),
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);

  let omzet = 0,
    cashTotal = 0,
    qrisTotal = 0,
    onlineTotal = 0;
  const orders = ordersResult.data ?? [];

  for (const o of orders) {
    const amt = Number(o.total);
    const m = (o.payment_method ?? "").toLowerCase();
    omzet += amt;
    if (m === "cash" || m.includes("tunai")) cashTotal += amt;
    else if (m.includes("qris")) qrisTotal += amt;
    else onlineTotal += amt;
  }

  const cashOut = (cashoutResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  return {
    omzet,
    totalOrder: orders.length,
    avgPerOrder: orders.length > 0 ? Math.round(omzet / orders.length) : 0,
    cashTotal,
    qrisTotal,
    onlineTotal,
    cashOut,
    kasBersih: cashTotal - cashOut,
  };
}

export interface BusinessCashflow {
  pemasukanLain: number; // manual pemasukan, capital — BUKAN omzet
  totalOpex: number;
  totalCapex: number;
  totalWithdrawal: number;
  netCashflow: number; // pemasukanLain - opex - capex - withdrawal
  // Detail entries untuk laporan WA
  entries: Array<{
    direction: "in" | "out";
    kind: string;
    amount: number;
    note: string;
    entry_date: string;
  }>;
}

export async function listCashflowCategories(): Promise<CashflowCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cashflow_categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listCashflowEntries(
  startDate?: string,
  endDate?: string,
  kind?: string
): Promise<CashflowEntryRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("cashflow_entries")
    .select("*")
    .order("entry_date", { ascending: false });

  if (startDate) query = query.gte("entry_date", startDate);
  if (endDate) query = query.lte("entry_date", endDate);
  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Arus kas bisnis — EXCLUDE omzet penjualan (kind=income) */
export async function getBusinessCashflow(
  startDate: string,
  endDate: string
): Promise<BusinessCashflow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cashflow_entries")
    .select("direction, amount, kind, note, entry_date")
    .gte("entry_date", startDate)
    .lte("entry_date", endDate)
    .not("kind", "eq", "income")
    .order("entry_date", { ascending: true });

  if (error) throw new Error(error.message);

  let pemasukanLain = 0,
    totalOpex = 0,
    totalCapex = 0,
    totalWithdrawal = 0;
  const entries = data ?? [];

  for (const e of entries) {
    const amt = Number(e.amount);
    if (e.direction === "in") {
      pemasukanLain += amt;
    } else {
      if (e.kind === "opex") totalOpex += amt;
      else if (e.kind === "capex") totalCapex += amt;
      else if (e.kind === "withdrawal") totalWithdrawal += amt;
    }
  }

  return {
    pemasukanLain,
    totalOpex,
    totalCapex,
    totalWithdrawal,
    netCashflow: pemasukanLain - totalOpex - totalCapex - totalWithdrawal,
    entries: entries.map((e) => ({
      direction: e.direction as "in" | "out",
      kind: e.kind,
      amount: Number(e.amount),
      note: e.note ?? "",
      entry_date: e.entry_date,
    })),
  };
}

/** @deprecated Gunakan getSalesMetrics + getBusinessCashflow */
export async function getCashflowSummary(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("cashflow_entries")
    .select("direction, amount, kind")
    .gte("entry_date", startDate)
    .lte("entry_date", endDate);
  if (error) throw new Error(error.message);

  let totalIncome = 0,
    totalOpex = 0,
    totalCapex = 0,
    totalWithdrawal = 0;
  for (const e of entries ?? []) {
    if (e.direction === "in") totalIncome += Number(e.amount);
    else {
      if (e.kind === "opex") totalOpex += Number(e.amount);
      if (e.kind === "capex") totalCapex += Number(e.amount);
      if (e.kind === "withdrawal") totalWithdrawal += Number(e.amount);
    }
  }
  const grossProfit = totalIncome - totalOpex;
  const netProfit = grossProfit - totalCapex - totalWithdrawal;
  return {
    totalIncome,
    totalOpex,
    totalCapex,
    totalWithdrawal,
    grossProfit,
    netProfit,
    netProfitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
  };
}

export interface CashflowCategoryRow {
  id: string;
  name: string;
  kind: "income" | "opex" | "capex" | "capital" | "withdrawal";
  is_system: boolean;
  created_at: string;
}
