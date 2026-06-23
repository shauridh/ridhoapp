import { createClient } from "@/lib/supabase/server";

export interface AkunRow {
  id: string;
  nama: string;
  tipe: "bank" | "ewallet" | "kas_fisik";
  saldo_awal: number;
  is_owner: boolean;
  aktif: boolean;
  created_at: string;
}

export interface AkunWithBalance extends AkunRow {
  saldo: number; // saldo_awal + total IN - total OUT
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

// Hitung saldo aktual per akun: saldo_awal + SUM(IN) - SUM(OUT) dari cashflow_entries
export async function listAkunWithBalance(): Promise<AkunWithBalance[]> {
  const supabase = await createClient();

  const [akunResult, flowResult] = await Promise.all([
    supabase.from("akun").select("*").order("created_at", { ascending: true }),
    supabase
      .from("cashflow_entries")
      .select("akun_id, direction, amount")
      .not("akun_id", "is", null),
  ]);

  if (akunResult.error) throw new Error(akunResult.error.message);

  const flows = flowResult.data ?? [];

  // Hitung net per akun
  const netPerAkun: Record<string, number> = {};
  for (const f of flows) {
    if (!f.akun_id) continue;
    const amt = Number(f.amount);
    netPerAkun[f.akun_id] = (netPerAkun[f.akun_id] ?? 0) + (f.direction === "in" ? amt : -amt);
  }

  return (akunResult.data ?? []).map((a) => ({
    ...a,
    saldo: Number(a.saldo_awal) + (netPerAkun[a.id] ?? 0),
  }));
}

// Saldo akun owner (is_owner = true)
export async function getOwnerAkunBalance(): Promise<{
  akun: AkunWithBalance | null;
  saldo: number;
}> {
  const akunList = await listAkunWithBalance();
  const ownerAkun = akunList.find((a) => a.is_owner && a.aktif) ?? null;
  return {
    akun: ownerAkun,
    saldo: ownerAkun?.saldo ?? 0,
  };
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
