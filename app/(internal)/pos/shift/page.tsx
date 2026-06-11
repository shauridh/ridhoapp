import {
  getCurrentOpenShift,
  getShiftCashSummary,
  listRecentShifts,
} from "@/lib/data/shifts"
import { CloseForm } from "./close-form"
import { OpenForm } from "./open-form"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ShiftPage() {
  const openShift = await getCurrentOpenShift()
  const recentShifts = await listRecentShifts(10)
  const summary = openShift ? await getShiftCashSummary(openShift) : null

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Shift Kasir</h1>

      {!openShift && <OpenForm />}
      {openShift && (
        <div className="space-y-3">
          <Card>
            <p className="text-sm text-ink-soft">Shift sedang buka</p>
            <p className="font-medium text-ink">
              Dibuka: {new Date(openShift.opened_at).toLocaleString("id-ID")}
            </p>
            <p className="text-ink">
              Saldo awal: Rp {openShift.opening_balance.toLocaleString("id-ID")}
            </p>
            {summary && (
              <div className="mt-2 text-sm text-ink-soft">
                <p>Tunai: Rp {summary.cashSales.toLocaleString("id-ID")}</p>
                <p>QRIS: Rp {summary.qrisTotal.toLocaleString("id-ID")}</p>
                <p>Cash out: Rp {summary.cashOut.toLocaleString("id-ID")}</p>
              </div>
            )}
          </Card>
          <CloseForm
            shift={{ id: openShift.id, expected_cash: summary?.expectedCash ?? 0 }}
          />
        </div>
      )}

      <div>
        <h2 className="mb-2 font-medium text-ink">Riwayat Shift</h2>
        <div className="space-y-2">
          {recentShifts.map((s) => (
            <Card key={s.id} className="text-sm">
              <div className="flex justify-between">
                <span className="text-ink">{new Date(s.opened_at).toLocaleDateString("id-ID")}</span>
                <Badge tone={s.status === "open" ? "success" : "neutral"}>
                  {s.status === "open" ? "Terbuka" : "Tutup"}
                </Badge>
              </div>
              {s.status === "closed" && s.cash_difference !== null && (
                <div
                  className={`text-xs ${s.cash_difference >= 0 ? "text-success" : "text-danger"}`}
                >
                  Selisih: Rp {Math.abs(s.cash_difference).toLocaleString("id-ID")}
                  {s.cash_difference >= 0 ? " (lebih)" : " (kurang)"}
                </div>
              )}
            </Card>
          ))}
          {recentShifts.length === 0 && (
            <p className="text-sm text-ink-soft">Belum ada riwayat shift.</p>
          )}
        </div>
      </div>
    </div>
  )
}
