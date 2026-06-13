import { createClient } from "@/lib/supabase/server";

export interface CashflowEntryRow {
  id: string;
  entry_date: string;
  direction: "in" | "out";
  amount: number;
  category_id: string | null;
  kind: "income" | "opex" | "capex" | "capital" | "withdrawal";
  source: "sale" | "drawer" | "manual";
  ref_id: string | null;
  created_by: string | null;
  note: string;
  created_at: string;
}

export interface CashflowCategoryRow {
  id: string;
  name: string;
  kind: "income" | "opex" | "capex" | "capital" | "withdrawal";
  is_system: boolean;
  created_at: string;
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

export async function getCashflowSummary(
  startDate: string,
  endDate: string
): Promise<{
  totalIncome: number;
  totalOpex: number;
  totalCapex: number;
  grossProfit: number;
  netProfit: number;
  netProfitMargin: number;
}> {
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("cashflow_entries")
    .select("direction, amount, kind")
    .gte("entry_date", startDate)
    .lte("entry_date", endDate);

  if (error) throw new Error(error.message);

  let totalIncome = 0;
  let totalOpex = 0;
  let totalCapex = 0;
  let totalWithdrawal = 0;

  for (const e of entries ?? []) {
    if (e.direction === "in") {
      totalIncome += Number(e.amount);
    } else {
      if (e.kind === "opex") totalOpex += Number(e.amount);
      if (e.kind === "capex") totalCapex += Number(e.amount);
      if (e.kind === "withdrawal") totalWithdrawal += Number(e.amount);
    }
  }

  const grossProfit = totalIncome - totalOpex;
  const netProfit = grossProfit - totalCapex - totalWithdrawal;
  const netProfitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalOpex,
    totalCapex,
    grossProfit,
    netProfit,
    netProfitMargin,
  };
}
