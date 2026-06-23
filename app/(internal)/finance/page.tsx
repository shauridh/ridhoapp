import {
  listCashflowCategories,
  listCashflowEntries,
  getSalesMetrics,
  getBusinessCashflow,
} from "@/lib/data/cashflow";
import { listAkunWithBalance, listOpex, listPiutang } from "@/lib/data/akun";
import { resolveRange, resolveCustomRange, type RangePreset } from "@/lib/domain/date-range";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  TrendingUp,
  Wallet,
  Banknote,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { ManualEntryForm } from "./manual-entry-form";
import { KeuanganManager } from "./keuangan-manager";
import { FinancePinGate } from "./pin-gate";
import { CashflowTable } from "./cashflow-table";
import { FinanceFilter } from "./finance-filter";

const tipeLabel: Record<string, string> = {
  bank: "Bank",
  ewallet: "E-Wallet",
  kas_fisik: "Kas Fisik",
};

function resolveFinanceRange(
  preset: string | undefined,
  from: string | undefined,
  to: string | undefined
) {
  if (from && to) return resolveCustomRange(from, to);
  return resolveRange((preset ?? "this_month") as RangePreset);
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{
    // sales range
    sr?: string;
    sf?: string;
    st?: string;
    // cashflow range
    cr?: string;
    cf?: string;
    ct?: string;
    // arus kas range
    ar?: string;
    af?: string;
    at?: string;
  }>;
}) {
  const p = await searchParams;

  const salesRange = resolveFinanceRange(p.sr, p.sf, p.st);
  const cfRange = resolveFinanceRange(p.cr, p.cf, p.ct);
  const arusRange = resolveFinanceRange(p.ar, p.af, p.at);

  const salesStart = salesRange.start.slice(0, 10);
  const salesEnd = salesRange.end.slice(0, 10);
  const cfStart = cfRange.start.slice(0, 10);
  const cfEnd = cfRange.end.slice(0, 10);
  const arusStart = arusRange.start.slice(0, 10);
  const arusEnd = arusRange.end.slice(0, 10);

  const [categories, entries, sales, cashflow, akunList, opex, piutang] = await Promise.all([
    listCashflowCategories(),
    listCashflowEntries(arusStart, arusEnd),
    getSalesMetrics(salesStart, salesEnd),
    getBusinessCashflow(cfStart, cfEnd),
    listAkunWithBalance(),
    listOpex(),
    listPiutang(),
  ]);

  const saldoRil = akunList.filter((a) => a.aktif).reduce((s, a) => s + a.saldo, 0);

  return (
    <FinancePinGate>
      <div className="space-y-6">
        <PageHeader
          title="Keuangan & Laporan"
          actions={<ManualEntryForm categories={categories} akun={akunList} />}
        />

        {/* ── METRIK PENJUALAN ─────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Metrik Penjualan
            </h2>
            <FinanceFilter paramKey="sr" fromKey="sf" toKey="st" defaultPreset="this_month" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Omzet"
              tone="green"
              icon={TrendingUp}
              value={`Rp ${sales.omzet.toLocaleString("id-ID")}`}
            />
            <StatCard
              label="Total Order"
              tone="blue"
              icon={ShoppingCart}
              value={String(sales.totalOrder)}
            />
            <StatCard
              label="Rata-rata/Order"
              tone="amber"
              icon={DollarSign}
              value={`Rp ${sales.avgPerOrder.toLocaleString("id-ID")}`}
            />
            <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Breakdown Pembayaran
              </p>
              <div className="space-y-1">
                {sales.cashTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Tunai</span>
                    <span className="font-semibold text-success">
                      Rp {sales.cashTotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {sales.cashOut > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Cash Out (kasir)</span>
                    <span className="font-semibold text-danger">
                      - Rp {sales.cashOut.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {sales.cashOut > 0 && (
                  <div className="flex justify-between border-t border-hairline pt-1 text-sm">
                    <span className="font-medium text-ink">Kas Bersih</span>
                    <span
                      className={`font-bold ${sales.kasBersih >= 0 ? "text-success" : "text-danger"}`}
                    >
                      Rp {sales.kasBersih.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {sales.qrisTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">QRIS</span>
                    <span className="font-semibold text-info">
                      Rp {sales.qrisTotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {sales.onlineTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Online Food</span>
                    <span className="font-semibold text-accent">
                      Rp {sales.onlineTotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {sales.omzet === 0 && <p className="text-xs text-ink-faint">Belum ada penjualan</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ── METRIK KEUANGAN BISNIS ──────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Keuangan Bisnis
            </h2>
            <FinanceFilter paramKey="cr" fromKey="cf" toKey="ct" defaultPreset="this_month" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <StatCard
              label="Pemasukan Lain"
              tone="green"
              icon={ArrowDownLeft}
              value={`Rp ${cashflow.pemasukanLain.toLocaleString("id-ID")}`}
            />
            <StatCard
              label="Pengeluaran Ops"
              tone="red"
              icon={TrendingUp}
              value={`Rp ${cashflow.totalOpex.toLocaleString("id-ID")}`}
            />
            <StatCard
              label="Belanja Modal"
              tone="red"
              icon={Wallet}
              value={`Rp ${cashflow.totalCapex.toLocaleString("id-ID")}`}
            />
            <StatCard
              label="Tarik Owner"
              tone="amber"
              icon={ArrowUpRight}
              value={`Rp ${cashflow.totalWithdrawal.toLocaleString("id-ID")}`}
            />
            <StatCard
              label="Saldo Ril"
              tone="green"
              icon={Banknote}
              value={`Rp ${saldoRil.toLocaleString("id-ID")}`}
            />
          </div>
          {/* Detail entries cashflow */}
          {cashflow.entries.length > 0 && (
            <div className="rounded-xl border border-hairline bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-left text-xs text-ink-soft">
                    <th className="px-4 py-2">Tanggal</th>
                    <th className="px-4 py-2">Keterangan</th>
                    <th className="px-4 py-2">Jenis</th>
                    <th className="px-4 py-2 text-right">Masuk</th>
                    <th className="px-4 py-2 text-right">Keluar</th>
                  </tr>
                </thead>
                <tbody>
                  {cashflow.entries.map((e, i) => (
                    <tr key={i} className="border-t border-hairline hover:bg-surface/50">
                      <td className="px-4 py-2 text-xs">
                        {new Date(e.entry_date).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-2">{e.note || "-"}</td>
                      <td className="px-4 py-2 text-xs uppercase text-ink-soft">{e.kind}</td>
                      <td className="px-4 py-2 text-right font-semibold text-success">
                        {e.direction === "in" ? `Rp ${e.amount.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-danger">
                        {e.direction === "out" ? `Rp ${e.amount.toLocaleString("id-ID")}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── SALDO PER AKUN ─────────────────────────────────── */}
        {akunList.filter((a) => a.aktif).length > 0 && (
          <div className="space-y-2">
            <h2 className="px-1 text-sm font-medium text-ink-soft">Saldo Akun</h2>
            <div className="flex flex-wrap gap-3">
              {akunList
                .filter((a) => a.aktif)
                .map((a) => (
                  <div
                    key={a.id}
                    className={`flex flex-1 basis-44 items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
                      a.is_owner ? "border-success bg-tint-green" : "border-hairline bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        a.is_owner ? "bg-success/10 text-success" : "bg-surface text-ink-soft"
                      }`}
                    >
                      <Banknote size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-xs font-semibold text-ink">{a.nama}</p>
                        {a.is_owner && (
                          <span className="shrink-0 rounded-full bg-success px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft">{tipeLabel[a.tipe] ?? a.tipe}</p>
                      <p
                        className={`text-sm font-bold ${a.saldo >= 0 ? "text-success" : "text-danger"}`}
                      >
                        Rp {a.saldo.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <KeuanganManager akun={akunList} opex={opex} piutang={piutang} />

        {/* ── ARUS KAS ──────────────────────────────────────── */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium text-ink">Arus Kas</h2>
            <div className="flex flex-wrap items-center gap-3">
              <FinanceFilter paramKey="ar" fromKey="af" toKey="at" defaultPreset="this_month" />
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-success" />
                  <span className="font-semibold text-success">
                    Rp{" "}
                    {entries
                      .reduce((s, e) => (e.direction === "in" ? s + Number(e.amount) : s), 0)
                      .toLocaleString("id-ID")}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-danger" />
                  <span className="font-semibold text-danger">
                    Rp{" "}
                    {entries
                      .reduce((s, e) => (e.direction === "out" ? s + Number(e.amount) : s), 0)
                      .toLocaleString("id-ID")}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  {(() => {
                    const net = entries.reduce(
                      (s, e) => s + (e.direction === "in" ? Number(e.amount) : -Number(e.amount)),
                      0
                    );
                    return (
                      <span className={`font-bold ${net >= 0 ? "text-success" : "text-danger"}`}>
                        Net: {net >= 0 ? "+" : ""}Rp {Math.abs(net).toLocaleString("id-ID")}
                      </span>
                    );
                  })()}
                </span>
              </div>
            </div>
          </div>
          <CashflowTable entries={entries} akun={akunList} />
        </div>
      </div>
    </FinancePinGate>
  );
}
