import {
  listCashflowCategories,
  listCashflowEntries,
  getCashflowSummary,
} from "@/lib/data/cashflow";
import { listAkunWithBalance, listOpex, listPiutang, getOwnerAkunBalance } from "@/lib/data/akun";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { TrendingUp, Receipt, BarChart3, Wallet, Banknote } from "lucide-react";
import { ManualEntryForm, EntryActions } from "./manual-entry-form";
import { KeuanganManager } from "./keuangan-manager";
import { FinancePinGate } from "./pin-gate";

const kindBadge: Record<
  string,
  { tone: "neutral" | "accent" | "success" | "danger"; label: string }
> = {
  income: { tone: "success", label: "INCOME" },
  capital: { tone: "accent", label: "CAPITAL" },
  opex: { tone: "danger", label: "OPEX" },
  capex: { tone: "danger", label: "CAPEX" },
  withdrawal: { tone: "neutral", label: "WITHDRAWAL" },
};

const tipeLabel: Record<string, string> = {
  bank: "Bank",
  ewallet: "E-Wallet",
  kas_fisik: "Kas Fisik",
};

export default async function FinancePage() {
  const todayWib = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const [year, month] = todayWib.split("-").map(Number);
  const START_OF_MONTH = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const END_OF_MONTH = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [categories, entries, summary, akunList, opex, piutang, ownerBalance] = await Promise.all([
    listCashflowCategories(),
    listCashflowEntries(START_OF_MONTH, END_OF_MONTH),
    getCashflowSummary(START_OF_MONTH, END_OF_MONTH),
    listAkunWithBalance(),
    listOpex(),
    listPiutang(),
    getOwnerAkunBalance(),
  ]);

  const kasRilOwner = ownerBalance.saldo;
  const ownerAkun = ownerBalance.akun;

  return (
    <FinancePinGate>
      <div className="space-y-4">
        <PageHeader
          title="Keuangan & Laporan"
          actions={<ManualEntryForm categories={categories} akun={akunList} />}
        />

        {/* Metrik utama bulan ini */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Pemasukan"
            tone="green"
            icon={TrendingUp}
            value={`Rp ${summary.totalIncome.toLocaleString("id-ID")}`}
          />
          <StatCard
            label="Pengeluaran (OpEx)"
            tone="red"
            icon={Receipt}
            value={`Rp ${summary.totalOpex.toLocaleString("id-ID")}`}
          />
          <StatCard
            label="Laba Kotor"
            tone="amber"
            icon={BarChart3}
            value={`Rp ${summary.grossProfit.toLocaleString("id-ID")}`}
          />
          <StatCard
            label="Belanja Modal"
            tone="blue"
            icon={Wallet}
            value={`Rp ${summary.totalCapex.toLocaleString("id-ID")}`}
          />
          <StatCard
            label={ownerAkun ? `Kas Ril (${ownerAkun.nama})` : "Kas Ril Owner"}
            tone="green"
            icon={Banknote}
            value={`Rp ${kasRilOwner.toLocaleString("id-ID")}`}
          />
        </div>

        {/* Saldo per Akun */}
        {akunList.length > 0 && (
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

        {/* Arus Kas */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium text-ink">Arus Kas Bulan Ini</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                <span className="text-ink-soft">Masuk</span>
                <span className="font-semibold text-success">
                  Rp{" "}
                  {entries
                    .reduce((s, e) => (e.direction === "in" ? s + e.amount : s), 0)
                    .toLocaleString("id-ID")}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-danger" />
                <span className="text-ink-soft">Keluar</span>
                <span className="font-semibold text-danger">
                  Rp{" "}
                  {entries
                    .reduce((s, e) => (e.direction === "out" ? s + e.amount : s), 0)
                    .toLocaleString("id-ID")}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-ink-soft">Net</span>
                {(() => {
                  const net = entries.reduce(
                    (s, e) => (e.direction === "in" ? s + e.amount : s - e.amount),
                    0
                  );
                  return (
                    <span className={`font-bold ${net >= 0 ? "text-success" : "text-danger"}`}>
                      {net >= 0 ? "+" : "-"}Rp {Math.abs(net).toLocaleString("id-ID")}
                    </span>
                  );
                })()}
              </span>
            </div>
          </div>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-left text-ink-soft">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3 text-right">Masuk</th>
                  <th className="px-4 py-3 text-right">Keluar</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const badge = kindBadge[e.kind] ?? {
                    tone: "neutral" as const,
                    label: e.kind.toUpperCase(),
                  };
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50"
                    >
                      <td className="px-4 py-3">
                        {new Date(e.entry_date).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">{e.note || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-success">
                        {e.direction === "in" ? `Rp ${e.amount.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-danger">
                        {e.direction === "out" ? `Rp ${e.amount.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <EntryActions entry={e} akun={akunList} />
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                      Belum ada transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </FinancePinGate>
  );
}
