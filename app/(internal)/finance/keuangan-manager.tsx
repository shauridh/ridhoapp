"use client";

import { useState, useTransition } from "react";
import { rupiah } from "@/lib/format";
import {
  Plus,
  Check,
  Wallet,
  Repeat,
  HandCoins,
  Pencil,
  Trash2,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  addAkun,
  editAkun,
  deleteAkun,
  toggleOwnerAkun,
  transferAntarAkun,
  addOpex,
  toggleOpexActive,
  addPiutang,
  markPiutangLunas,
} from "./keuangan-actions";
import type { AkunWithBalance, OpexRow, PiutangRow } from "@/lib/data/akun";

type Tab = "akun" | "opex" | "piutang";

interface Props {
  akun: AkunWithBalance[];
  opex: OpexRow[];
  piutang: PiutangRow[];
}

export function KeuanganManager({ akun, opex, piutang }: Props) {
  const [tab, setTab] = useState<Tab>("akun");
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  );
  const [transferError, setTransferError] = useState<string | null>(null);
  const toast = useToast();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.show(ok, "success");
      else toast.show(result.error ?? "Gagal", "error");
    });

  const tabs: { key: Tab; label: string; icon: typeof Wallet }[] = [
    { key: "akun", label: "Akun", icon: Wallet },
    { key: "opex", label: "Opex", icon: Repeat },
    { key: "piutang", label: "Hutang/Piutang", icon: HandCoins },
  ];

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  tab === t.key
                    ? "bg-brand text-white"
                    : "bg-white text-ink border border-hairline hover:bg-surface"
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
        {/* Tombol Transfer antar akun */}
        {akun.filter((a) => a.aktif).length >= 2 && (
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-surface"
          >
            <ArrowLeftRight size={15} />
            Transfer
          </button>
        )}
      </div>

      {tab === "akun" && (
        <div className="space-y-3">
          {/* Form tambah akun baru */}
          <form
            action={(fd) => run(() => addAkun(fd), "Akun ditambahkan")}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="flex-1 min-w-[8rem]">
              <Input label="Nama akun" name="nama" required />
            </div>
            <div className="w-40">
              <Select label="Tipe" name="tipe">
                <option value="kas_fisik">Kas Fisik</option>
                <option value="bank">Bank</option>
                <option value="ewallet">E-Wallet</option>
              </Select>
            </div>
            <div className="w-40">
              <Input label="Saldo awal" name="saldoAwal" type="number" defaultValue={0} money />
            </div>
            <Button type="submit" icon={Plus} loading={pending}>
              Tambah
            </Button>
          </form>

          {/* Daftar akun */}
          <ul className="divide-y divide-hairline rounded-lg border border-hairline">
            {akun.map((a) => (
              <li key={a.id}>
                {editingId === a.id ? (
                  // Form edit inline
                  <form
                    action={(fd) => {
                      setEditingId(null);
                      run(() => editAkun(a.id, fd), "Akun diperbarui");
                    }}
                    className="flex flex-wrap items-end gap-2 px-3 py-2"
                  >
                    <div className="flex-1 min-w-[8rem]">
                      <Input label="Nama akun" name="nama" required defaultValue={a.nama} />
                    </div>
                    <div className="w-36">
                      <Select label="Tipe" name="tipe" defaultValue={a.tipe}>
                        <option value="kas_fisik">Kas Fisik</option>
                        <option value="bank">Bank</option>
                        <option value="ewallet">E-Wallet</option>
                      </Select>
                    </div>
                    <div className="w-36">
                      <Input
                        label="Saldo awal"
                        name="saldoAwal"
                        type="number"
                        defaultValue={a.saldo_awal}
                        money
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button type="submit" icon={Check} loading={pending}>
                        Simpan
                      </Button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1.5 text-xs text-ink-soft hover:bg-surface"
                      >
                        <X size={13} /> Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  // Tampilan normal
                  <div className="flex items-center justify-between px-3 py-2 text-sm text-ink">
                    <span className="flex items-center gap-2">
                      {a.nama}
                      <Badge tone="neutral">{a.tipe}</Badge>
                      {a.is_owner && <Badge tone="success">Owner</Badge>}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{rupiah(a.saldo)}</span>
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            () => toggleOwnerAkun(a.id, !a.is_owner),
                            a.is_owner ? "Ditandai bukan akun owner" : "Ditandai sebagai akun owner"
                          )
                        }
                        className={`text-xs font-medium transition ${a.is_owner ? "text-success hover:text-danger" : "text-ink-soft hover:text-success"}`}
                        title={
                          a.is_owner ? "Hapus tanda owner" : "Tandai sebagai akun kas ril owner"
                        }
                      >
                        {a.is_owner ? "✓ Owner" : "Jadikan Owner"}
                      </button>
                      <button
                        onClick={() => setEditingId(a.id)}
                        className="text-ink-soft transition hover:text-brand"
                        aria-label={`Edit akun ${a.nama}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus akun "${a.nama}"?`)) {
                            run(() => deleteAkun(a.id), "Akun dihapus");
                          }
                        }}
                        className="text-ink-soft transition hover:text-danger"
                        aria-label={`Hapus akun ${a.nama}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                )}
              </li>
            ))}
            {akun.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-soft">Belum ada akun.</li>
            )}
          </ul>
        </div>
      )}

      {tab === "opex" && (
        <div className="space-y-3">
          <form
            action={(fd) => run(() => addOpex(fd), "Opex ditambahkan")}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="flex-1 min-w-[8rem]">
              <Input label="Nama pengeluaran" name="nama" required />
            </div>
            <div className="w-36">
              <Input label="Nominal" name="nominal" type="number" defaultValue={0} money />
            </div>
            <div className="w-36">
              <Select label="Frekuensi" name="frekuensi">
                <option value="bulanan">Bulanan</option>
                <option value="mingguan">Mingguan</option>
                <option value="harian">Harian</option>
              </Select>
            </div>
            <div className="w-28">
              <Input label="Tgl jatuh tempo" name="jatuhTempo" type="number" placeholder="1-31" />
            </div>
            <Button type="submit" icon={Plus} loading={pending}>
              Tambah
            </Button>
          </form>
          <ul className="divide-y divide-hairline rounded-lg border border-hairline">
            {opex.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between px-3 py-2 text-sm text-ink"
              >
                <span className="flex items-center gap-2">
                  {o.nama}
                  <Badge tone="neutral">{o.frekuensi}</Badge>
                  {!o.aktif && <Badge tone="danger">nonaktif</Badge>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold">{rupiah(o.nominal)}</span>
                  <button
                    onClick={() => run(() => toggleOpexActive(o.id, !o.aktif), "Diperbarui")}
                    className="text-xs text-brand underline"
                  >
                    {o.aktif ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </span>
              </li>
            ))}
            {opex.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-soft">Belum ada opex.</li>
            )}
          </ul>
        </div>
      )}

      {tab === "piutang" && (
        <div className="space-y-3">
          <form
            action={(fd) => run(() => addPiutang(fd), "Dicatat")}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="flex-1 min-w-[8rem]">
              <Input label="Pihak" name="pihak" required />
            </div>
            <div className="w-32">
              <Select label="Tipe" name="tipe">
                <option value="piutang">Piutang (orang utang ke kita)</option>
                <option value="hutang">Hutang (kita berutang)</option>
              </Select>
            </div>
            <div className="w-32">
              <Input label="Nominal" name="nominal" type="number" defaultValue={0} money />
            </div>
            <div className="w-24">
              <Input label="Tenor (bln)" name="tenor" type="number" placeholder="0" />
            </div>
            <div className="w-24">
              <Input label="Bunga %" name="bunga" type="number" placeholder="0" />
            </div>
            <div className="w-36">
              <Input label="Jatuh tempo" name="jatuhTempo" type="date" />
            </div>
            <Button type="submit" icon={Plus} loading={pending}>
              Catat
            </Button>
          </form>
          <ul className="divide-y divide-hairline rounded-lg border border-hairline">
            {piutang.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-3 py-2 text-sm text-ink"
              >
                <span className="flex items-center gap-2">
                  {p.pihak}
                  <Badge tone={p.tipe === "piutang" ? "success" : "danger"}>{p.tipe}</Badge>
                  {p.status === "lunas" && <Badge tone="neutral">lunas</Badge>}
                  {p.cicilan && (
                    <span className="text-xs text-ink-soft">
                      {rupiah(p.cicilan)}/bln x{p.tenor}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold">{rupiah(p.nominal)}</span>
                  {p.status === "belum" && (
                    <button
                      onClick={() => run(() => markPiutangLunas(p.id), "Ditandai lunas")}
                      className="flex items-center gap-1 text-xs text-success underline"
                    >
                      <Check size={14} /> Lunas
                    </button>
                  )}
                </span>
              </li>
            ))}
            {piutang.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-soft">Belum ada catatan.</li>
            )}
          </ul>
        </div>
      )}

      {/* Modal Transfer Antar Akun */}
      <Modal
        open={showTransfer}
        onClose={() => {
          setShowTransfer(false);
          setTransferError(null);
        }}
        title="Transfer Antar Akun"
        size="md"
      >
        <div className="space-y-3">
          <Select
            label="Dari Akun"
            value={transferFrom}
            onChange={(e) => setTransferFrom(e.target.value)}
            required
          >
            <option value="">-- Pilih akun asal --</option>
            {akun
              .filter((a) => a.aktif)
              .map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === transferTo}>
                  {a.nama} — {rupiah(a.saldo)}
                </option>
              ))}
          </Select>

          <Select
            label="Ke Akun"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            required
          >
            <option value="">-- Pilih akun tujuan --</option>
            {akun
              .filter((a) => a.aktif)
              .map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === transferFrom}>
                  {a.nama} — {rupiah(a.saldo)}
                </option>
              ))}
          </Select>

          <Input
            label="Jumlah (Rp)"
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="0"
            money
            required
          />

          <Input
            label="Tanggal"
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
          />

          <Input
            label="Catatan (opsional)"
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            placeholder="mis. top up e-wallet, pindah ke rekening"
          />

          {transferError && (
            <p className="rounded-lg bg-tint-red px-3 py-2 text-sm text-danger">{transferError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              loading={pending}
              className="flex-1"
              onClick={() => {
                if (!transferFrom || !transferTo || !transferAmount) {
                  setTransferError("Lengkapi semua field wajib");
                  return;
                }
                setTransferError(null);
                startTransition(async () => {
                  const result = await transferAntarAkun({
                    fromAkunId: transferFrom,
                    toAkunId: transferTo,
                    amount: Number(transferAmount),
                    note: transferNote,
                    entryDate: transferDate,
                  });
                  if (result.ok) {
                    setShowTransfer(false);
                    setTransferFrom("");
                    setTransferTo("");
                    setTransferAmount("");
                    setTransferNote("");
                    setTransferError(null);
                    toast.show("Transfer berhasil", "success");
                  } else {
                    setTransferError(result.error ?? "Gagal");
                  }
                });
              }}
            >
              Transfer
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowTransfer(false);
                setTransferError(null);
              }}
            >
              Batal
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
