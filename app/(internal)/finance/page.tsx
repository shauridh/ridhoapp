import { listCashflowCategories, listCashflowEntries, getCashflowSummary } from "@/lib/data/cashflow"
import { ManualEntryForm } from "./manual-entry-form"

const TODAY = new Date()
const START_OF_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1).toISOString().slice(0, 10)
const END_OF_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).toISOString().slice(0, 10)

export default async function FinancePage() {
  const categories = await listCashflowCategories()
  const entries = await listCashflowEntries(START_OF_MONTH, END_OF_MONTH)
  const summary = await getCashflowSummary(START_OF_MONTH, END_OF_MONTH)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan & Laporan</h1>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-600">Pemasukan</div>
          <div className="text-xl font-bold text-green-600">
            Rp {summary.totalIncome.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-600">Pengeluaran (OpEx)</div>
          <div className="text-xl font-bold text-red-600">
            Rp {summary.totalOpex.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-600">Laba Kotor</div>
          <div className="text-xl font-bold">
            Rp {summary.grossProfit.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-600">Belanja Modal</div>
          <div className="text-xl font-bold">
            Rp {summary.totalCapex.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      <ManualEntryForm categories={categories} />

      <div>
        <h2 className="mb-2 font-medium">Arus Kas Bulan Ini</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2">Tanggal</th>
                <th>Keterangan</th>
                <th>Jenis</th>
                <th className="text-right">Masuk</th>
                <th className="text-right">Keluar</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="px-3 py-2">
                    {new Date(e.entry_date).toLocaleDateString("id-ID")}
                  </td>
                  <td>{e.note || "-"}</td>
                  <td>{e.kind.toUpperCase()}</td>
                  <td className="text-right text-green-600">
                    {e.direction === "in"
                      ? `Rp ${e.amount.toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                  <td className="text-right text-red-600">
                    {e.direction === "out"
                      ? `Rp ${e.amount.toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
