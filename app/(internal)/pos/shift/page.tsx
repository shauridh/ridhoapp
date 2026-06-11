import {
  getCurrentOpenShift,
  getShiftCashSummary,
  listRecentShifts,
} from "@/lib/data/shifts"
import { CloseForm } from "./close-form"
import { OpenForm } from "./open-form"

export default async function ShiftPage() {
  const openShift = await getCurrentOpenShift()
  const recentShifts = await listRecentShifts(10)
  const summary = openShift ? await getShiftCashSummary(openShift) : null

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Shift Kasir</h1>

      {!openShift && <OpenForm />}
      {openShift && (
        <div className="space-y-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-600">Shift sedang buka</p>
            <p className="font-medium">
              Dibuka: {new Date(openShift.opened_at).toLocaleString("id-ID")}
            </p>
            <p>
              Saldo awal: Rp {openShift.opening_balance.toLocaleString("id-ID")}
            </p>
            {summary && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Tunai: Rp {summary.cashSales.toLocaleString("id-ID")}</p>
                <p>QRIS: Rp {summary.qrisTotal.toLocaleString("id-ID")}</p>
                <p>Cash out: Rp {summary.cashOut.toLocaleString("id-ID")}</p>
              </div>
            )}
          </div>
          <CloseForm
            shift={{ id: openShift.id, expected_cash: summary?.expectedCash ?? 0 }}
          />
        </div>
      )}

      <div>
        <h2 className="mb-2 font-medium">Riwayat Shift</h2>
        <div className="space-y-2">
          {recentShifts.map((s) => (
            <div key={s.id} className="rounded-lg border p-2 text-sm">
              <div className="flex justify-between">
                <span>{new Date(s.opened_at).toLocaleDateString("id-ID")}</span>
                <span
                  className={
                    s.status === "open" ? "text-green-600" : "text-gray-500"
                  }
                >
                  {s.status === "open" ? "Terbuka" : "Tutup"}
                </span>
              </div>
              {s.status === "closed" && s.cash_difference !== null && (
                <div className="text-xs text-gray-600">
                  Selisih: Rp {Math.abs(s.cash_difference).toLocaleString("id-ID")}
                  {s.cash_difference >= 0 ? " (lebih)" : " (kurang)"}
                </div>
              )}
            </div>
          ))}
          {recentShifts.length === 0 && (
            <p className="text-sm text-gray-500">Belum ada riwayat shift.</p>
          )}
        </div>
      </div>
    </div>
  )
}
