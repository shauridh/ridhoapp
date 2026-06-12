"use client"

import { useState, useTransition } from "react"
import { Plus, Check, Wallet, Repeat, HandCoins } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import {
  addAkun,
  addOpex,
  toggleOpexActive,
  addPiutang,
  markPiutangLunas,
} from "./keuangan-actions"
import type { AkunRow, OpexRow, PiutangRow } from "@/lib/data/akun"

type Tab = "akun" | "opex" | "piutang"

interface Props {
  akun: AkunRow[]
  opex: OpexRow[]
  piutang: PiutangRow[]
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export function KeuanganManager({ akun, opex, piutang }: Props) {
  const [tab, setTab] = useState<Tab>("akun")
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    startTransition(async () => {
      const result = await fn()
      if (result.ok) toast.show(ok, "success")
      else toast.show(result.error ?? "Gagal", "error")
    })

  const tabs: { key: Tab; label: string; icon: typeof Wallet }[] = [
    { key: "akun", label: "Akun", icon: Wallet },
    { key: "opex", label: "Opex", icon: Repeat },
    { key: "piutang", label: "Hutang/Piutang", icon: HandCoins },
  ]

  return (
    <Card className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((t) => {
          const Icon = t.icon
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
          )
        })}
      </div>

      {tab === "akun" && (
        <div className="space-y-3">
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
          <ul className="divide-y divide-hairline rounded-lg border border-hairline">
            {akun.map((a) => (
              <li key={a.id} className="flex justify-between px-3 py-2 text-sm text-ink">
                <span className="flex items-center gap-2">
                  {a.nama}
                  <Badge tone="neutral">{a.tipe}</Badge>
                </span>
                <span className="font-semibold">{rupiah(a.saldo_awal)}</span>
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
              <li key={o.id} className="flex items-center justify-between px-3 py-2 text-sm text-ink">
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
              <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm text-ink">
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
    </Card>
  )
}
