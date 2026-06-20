"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Receipt, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cashOut, closeShift } from "./shift/actions";
import { MIN_DRAWER_BALANCE } from "@/lib/pos/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Props {
  shiftId: string;
  openingBalance: number;
  onClose: () => void;
}

interface Movement {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

import { rupiah } from "@/lib/format";

export function ShiftPanel({ shiftId, openingBalance, onClose }: Props) {
  const [cashSales, setCashSales] = useState(0);
  const [qrisTotal, setQrisTotal] = useState(0);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [coAmount, setCoAmount] = useState("");
  const [coReason, setCoReason] = useState("");
  const [counted, setCounted] = useState("");
  const [withdrawal, setWithdrawal] = useState("0");
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const [transferTotal, setTransferTotal] = useState(0);
  const [otherTotal, setOtherTotal] = useState(0);

  const load = () => {
    const supabase = createClient();
    supabase
      .from("orders")
      .select("total, payment_method")
      .eq("shift_id", shiftId)
      .eq("status", "completed")
      .then(({ data }) => {
        let cash = 0,
          qris = 0,
          transfer = 0,
          other = 0;
        for (const o of data ?? []) {
          const m = (o.payment_method ?? "").toLowerCase();
          if (m.includes("tunai") || m === "cash") cash += Number(o.total);
          else if (m.includes("qris")) qris += Number(o.total);
          else if (m.includes("transfer")) transfer += Number(o.total);
          else other += Number(o.total);
        }
        setCashSales(cash);
        setQrisTotal(qris);
        setTransferTotal(transfer);
        setOtherTotal(other);
      });
    supabase
      .from("cash_drawer_movements")
      .select("id, amount, reason, created_at")
      .eq("shift_id", shiftId)
      .eq("direction", "out")
      .order("created_at", { ascending: false })
      .then(({ data }) =>
        setMovements(
          (data ?? []).map((m) => ({
            id: m.id,
            amount: Number(m.amount),
            reason: m.reason,
            created_at: m.created_at,
          }))
        )
      );
  };

  useEffect(load, [shiftId]);

  const cashOutTotal = movements.reduce((s, m) => s + m.amount, 0);
  const expected = openingBalance + cashSales - cashOutTotal;
  const diff = counted ? Number(counted) - expected : null;
  const closingBalance = Number(counted || 0) - Number(withdrawal || 0);
  const belowMinimum = counted !== "" && closingBalance < MIN_DRAWER_BALANCE;

  // Computed value: saran penarikan
  const suggestedWithdrawal =
    counted === ""
      ? 0
      : Number(counted) > MIN_DRAWER_BALANCE
        ? Number(counted) - MIN_DRAWER_BALANCE
        : 0;

  const handleCashOut = () => {
    if (!coAmount || Number(coAmount) <= 0) {
      toast.show("Nominal harus lebih dari 0", "error");
      return;
    }
    startTransition(async () => {
      const result = await cashOut(shiftId, Number(coAmount), coReason);
      if (result.ok) {
        toast.show("Cash out dicatat", "success");
        setCoAmount("");
        setCoReason("");
        load();
      } else {
        toast.show(result.error, "error");
      }
    });
  };

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await closeShift({
        shiftId,
        countedCash: Number(counted),
        ownerWithdrawal: Number(withdrawal),
      });
      if (result.ok) {
        toast.show("Shift ditutup", "success");
        onClose();
      } else {
        toast.show(result.error, "error");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div
        className="flex w-full max-w-md flex-col overflow-y-auto bg-surface shadow-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-hairline bg-white px-4 py-3">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <Receipt size={18} className="text-brand" /> Kelola Shift
          </h2>
          <button onClick={onClose} aria-label="Tutup panel">
            <X size={20} className="text-ink-soft" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Ringkasan kas — expected vs actual sebagai fokus utama */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-ink">Ringkasan Kas</h3>
            <dl className="space-y-1 text-sm">
              <Row label="Saldo Awal" value={rupiah(openingBalance)} />
              <Row label="Tunai Masuk" value={rupiah(cashSales)} />
              <Row label="QRIS" value={rupiah(qrisTotal)} />
              {transferTotal > 0 && <Row label="Transfer" value={rupiah(transferTotal)} />}
              {otherTotal > 0 && <Row label="Metode Lain" value={rupiah(otherTotal)} />}
              <Row label="Kas Keluar" value={`− ${rupiah(cashOutTotal)}`} negative />
            </dl>
            {/* Kas Seharusnya — block besar agar mudah dipindai */}
            <div className="mt-3 rounded-xl bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Kas Seharusnya
                </span>
                <span className="text-lg font-bold text-brand">{rupiah(expected)}</span>
              </div>
            </div>
            {/* Selisih ditampilkan segera setelah counted diisi */}
            {diff !== null && (
              <div
                className={`mt-2 flex items-center justify-between rounded-xl px-4 py-3 ${
                  diff === 0 ? "bg-tint-green" : diff > 0 ? "bg-tint-green" : "bg-tint-red"
                }`}
              >
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    diff < 0 ? "text-danger" : "text-success"
                  }`}
                >
                  {diff >= 0 ? "Lebih" : "Kurang"}
                </span>
                <span className={`text-lg font-bold ${diff < 0 ? "text-danger" : "text-success"}`}>
                  {diff < 0 ? "−" : "+"}
                  {rupiah(Math.abs(diff))}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-ink">Pengeluaran Drawer</h3>
            {movements.length === 0 ? (
              <p className="text-sm text-ink-soft">Belum ada pengeluaran.</p>
            ) : (
              <ul className="mb-3 space-y-1">
                {movements.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="text-ink">{m.reason || "Tanpa alasan"}</div>
                      <div className="text-xs text-ink-soft">
                        {new Date(m.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span className="font-semibold text-danger">- {rupiah(m.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-2">
              <Input
                type="number"
                value={coAmount}
                onChange={(e) => setCoAmount(e.target.value)}
                placeholder="Nominal"
                inputMode="numeric"
              />
              <Input
                value={coReason}
                onChange={(e) => setCoReason(e.target.value)}
                placeholder="Alasan (mis. beli gas/es batu)"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleCashOut}
                loading={pending}
                className="w-full"
              >
                Catat Cash Out
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <form onSubmit={handleClose} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <LogOut size={16} /> Tutup Shift
              </h3>
              <Input
                type="number"
                label="Uang Dihitung (fisik)"
                value={counted}
                onChange={(e) => {
                  const val = e.target.value;
                  setCounted(val);
                  // Auto-isi penarikan = counted - 350k (jika counted > 350k)
                  if (val && Number(val) > MIN_DRAWER_BALANCE) {
                    setWithdrawal(String(Number(val) - MIN_DRAWER_BALANCE));
                  } else {
                    setWithdrawal("0");
                  }
                }}
                inputMode="numeric"
                required
              />
              {/* Selisih ditampilkan di Ringkasan Kas di atas saat counted diisi */}
              {/* Saran nominal penarikan: semua kelebihan di atas minimum */}
              {suggestedWithdrawal > 0 && (
                <div className="rounded-lg bg-tint-amber px-3 py-2 text-xs text-ink">
                  <span className="font-medium">Saran penarikan: </span>
                  <button
                    type="button"
                    className="font-bold text-brand underline-offset-2 hover:underline"
                    onClick={() => setWithdrawal(String(suggestedWithdrawal))}
                  >
                    Rp {suggestedWithdrawal.toLocaleString("id-ID")}
                  </button>
                  <span className="text-ink-soft">
                    {" "}
                    (sisakan Rp {MIN_DRAWER_BALANCE.toLocaleString("id-ID")} di laci)
                  </span>
                </div>
              )}

              <Input
                type="number"
                label="Uang Diambil Owner"
                value={withdrawal}
                onChange={(e) => setWithdrawal(e.target.value)}
                inputMode="numeric"
              />

              {/* Info saldo tersisa setelah penarikan */}
              {counted !== "" && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    belowMinimum ? "bg-tint-red text-danger" : "bg-tint-green text-success"
                  }`}
                >
                  <span className="font-medium">
                    Kas tersisa: Rp {closingBalance.toLocaleString("id-ID")}
                  </span>
                  {belowMinimum && (
                    <div className="mt-0.5 text-xs">
                      Minimum yang harus tersisa Rp {MIN_DRAWER_BALANCE.toLocaleString("id-ID")}.
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={pending}
                disabled={belowMinimum}
                className="w-full"
              >
                Tutup Shift
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  negative,
}: {
  label: string;
  value: string;
  bold?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd
        className={
          bold ? "font-bold text-brand" : negative ? "font-medium text-danger" : "text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}
