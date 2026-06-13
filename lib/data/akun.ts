import { createClient } from "@/lib/supabase/server";

export interface AkunRow {
  id: string;
  nama: string;
  tipe: "bank" | "ewallet" | "kas_fisik";
  saldo_awal: number;
  aktif: boolean;
  created_at: string;
}

export interface OpexRow {
  id: string;
  nama: string;
  nominal: number;
  frekuensi: "harian" | "mingguan" | "bulanan";
  jatuh_tempo: number | null;
  aktif: boolean;
  created_at: string;
}

export interface PiutangRow {
  id: string;
  pihak: string;
  nominal: number;
  tipe: "hutang" | "piutang";
  keterangan: string;
  status: "belum" | "lunas";
  jatuh_tempo: string | null;
  tenor: number | null;
  cicilan: number | null;
  bunga: number | null;
  created_at: string;
}

export async function listAkun(): Promise<AkunRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("akun")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listOpex(): Promise<OpexRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opex")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listPiutang(): Promise<PiutangRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("piutang")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLaborCostMetrics(
  startDate: string,
  endDate: string
): Promise<{
  laborCost: number;
  totalRevenue: number;
  laborCostRatio: number;
}> {
  const supabase = await createClient();

  // Get labor costs from opex table (recurring) in the period
  const { data: opexData, error: opexError } = await supabase
    .from("opex")
    .select("nominal, frekuensi")
    .eq("aktif", true)
    .ilike("nama", "%gaji%");

  if (opexError) throw new Error(opexError.message);

  // Calculate labor cost based on date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  let laborCost = 0;
  for (const opex of opexData ?? []) {
    const nominal = Number(opex.nominal);
    if (opex.frekuensi === "harian") {
      laborCost += nominal * daysDiff;
    } else if (opex.frekuensi === "mingguan") {
      laborCost += (nominal / 7) * daysDiff;
    } else if (opex.frekuensi === "bulanan") {
      laborCost += (nominal / 30) * daysDiff;
    }
  }

  // Get total revenue from cashflow
  const { data: incomeData, error: incomeError } = await supabase
    .from("cashflow_entries")
    .select("amount")
    .eq("kind", "income")
    .gte("entry_date", startDate)
    .lte("entry_date", endDate);

  if (incomeError) throw new Error(incomeError.message);

  const totalRevenue = (incomeData ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    laborCost,
    totalRevenue,
    laborCostRatio: totalRevenue > 0 ? (laborCost / totalRevenue) * 100 : 0,
  };
}
