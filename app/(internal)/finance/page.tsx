import { listCashflowCategories, listCashflowEntries, getCashflowSummary } from "@/lib/data/cashflow"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ManualEntryForm } from "./manual-entry-form"

const TODAY = new Date()
const START_OF_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1).toISOString().slice(0, 10)
const END_OF_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).toISOString().slice(0, 10)

const kindBadge: Record<string, { tone: "neutral" | "accent" | "success" | "danger"; label: string }> = {
  income: { tone: "success", label: "INCOME" },
  capital: { tone: "accent", label: "CAPITAL" },
  opex: { tone: "danger", label: "OPEX" },
  capex: { tone: "danger", label: "CAPEX" },
  withdrawal: { tone: "neutral", label: "WITHDRAWAL" },
}

export default async function FinancePage() {
  const categories = await listCashflowCategories()
  const entries = await listCashflowEntries(START_OF_MONTH, END_OF_MONTH)
  const summary = await getCashflowSummary(START_OF_MONTH, END_OF_MONTH)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Keuangan & Laporan</h1>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <div className="text-sm text-ink-soft">Pemasukan</div>
          <div className="text-2xl font-bold text-success">
            Rp {summary.totalIncome.toLocaleString("id-ID")}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-ink-soft">Pengeluaran (OpEx)</div>
          <div className="text-2xl font-bold text-danger">
            Rp {summary.totalOpex.toLocaleString("id-ID")}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-ink-soft">Laba Kotor</div>
          <div className="text-2xl font-bold text-ink">
            Rp {summary.grossProfit.toLocaleString("id-ID")}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-ink-soft">Belanja Modal</div>
          <div className="text-2xl font-bold text-ink">
            Rp {summary.totalCapex.toLocaleString("id-ID")}
          </div>
        </Card>
      </div>

      <ManualEntryForm categories={categories} />

      <div>
        <h2 className="mb-2 font-medium text-ink">Arus Kas Bulan Ini</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left text-ink-soft">
                <th className="px-3 py-2">Tanggal</th>
                <th>Keterangan</th>
                <th>Jenis</th>
                <th className="text-right">Masuk</th>
                <th className="px-3 text-right">Keluar</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const badge = kindBadge[e.kind] ?? { tone: "neutral" as const, label: e.kind.toUpperCase() }
                return (
                  <tr key={e.id} className="border-b border-hairline text-ink">
                    <td className="px-3 py-2">
                      {new Date(e.entry_date).toLocaleDateString("id-ID")}
                    </td>
                    <td>{e.note || "-"}</td>
                    <td>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </td>
                    <td className="text-right text-success">
                      {e.direction === "in"
                        ? `Rp ${e.amount.toLocaleString("id-ID")}`
                        : "-"}
                    </td>
                    <td className="px-3 text-right text-danger">
                      {e.direction === "out"
                        ? `Rp ${e.amount.toLocaleString("id-ID")}`
                        : "-"}
                    </td>
                  </tr>
                )
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-ink-soft">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
