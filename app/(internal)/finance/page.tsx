import {
  listCashflowCategories,
  listCashflowEntries,
  getCashflowSummary,
} from "@/lib/data/cashflow";
import { listAkun, listOpex, listPiutang } from "@/lib/data/akun";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { TrendingUp, Receipt, BarChart3, Wallet } from "lucide-react";
import { ManualEntryForm } from "./manual-entry-form";
import { KeuanganManager } from "./keuangan-manager";

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

export default async function FinancePage() {
  const TODAY = new Date();
  const START_OF_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const END_OF_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const categories = await listCashflowCategories();
  const entries = await listCashflowEntries(START_OF_MONTH, END_OF_MONTH);
  const summary = await getCashflowSummary(START_OF_MONTH, END_OF_MONTH);
  const akun = await listAkun();
  const opex = await listOpex();
  const piutang = await listPiutang();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Keuangan & Laporan"
        actions={<ManualEntryForm categories={categories} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <KeuanganManager akun={akun} opex={opex} piutang={piutang} />

      <div>
        <h2 className="mb-2 font-medium text-ink">Arus Kas Bulan Ini</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left text-ink-soft">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3 text-right">Masuk</th>
                <th className="px-4 py-3 text-right">Keluar</th>
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
  );
}
