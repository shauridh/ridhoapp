"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { createManualEntry, updateManualEntry, deleteManualEntry } from "./actions";
import type { AkunWithBalance } from "@/lib/data/akun";
import type { CashflowEntryRow } from "@/lib/data/cashflow";

interface Category {
  id: string;
  name: string;
  kind: string;
}

interface Props {
  categories: Category[];
  akun: AkunWithBalance[];
}

type EntryFormState = {
  direction: "in" | "out";
  amount: string;
  kind: "pemasukan" | "opex" | "capex" | "withdrawal";
  note: string;
  entryDate: string;
  akunId: string;
};

function defaultForm(): EntryFormState {
  return {
    direction: "out",
    amount: "",
    kind: "opex",
    note: "",
    entryDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    akunId: "",
  };
}

export function ManualEntryForm({ categories: _categories, akun }: Props) {
  const [open, setOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashflowEntryRow | null>(null);
  const [form, setForm] = useState<EntryFormState>(defaultForm());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setEditingEntry(null);
    setError(null);
    setForm(defaultForm());
  };

  const openCreate = () => {
    setForm(defaultForm());
    setEditingEntry(null);
    setOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openEdit = (entry: CashflowEntryRow) => {
    setEditingEntry(entry);
    setForm({
      direction: entry.direction,
      amount: String(entry.amount),
      kind: entry.kind as EntryFormState["kind"],
      note: entry.note,
      entryDate: entry.entry_date,
      akunId: (entry as CashflowEntryRow & { akun_id?: string }).akun_id ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.akunId) {
      setError("Pilih akun terlebih dahulu");
      return;
    }
    setError(null);
    const payload = {
      direction: form.direction,
      amount: Number(form.amount),
      kind: form.direction === "in" ? ("pemasukan" as const) : form.kind,
      categoryId: null,
      note: form.note,
      entryDate: form.entryDate,
      akunId: form.akunId || null,
    };
    startTransition(async () => {
      const result = editingEntry
        ? await updateManualEntry(editingEntry.id, payload)
        : await createManualEntry(payload);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={openCreate}>
        Input Manual
      </Button>

      <Modal
        open={open}
        onClose={close}
        title={editingEntry ? "Edit Arus Kas" : "Input Arus Kas Manual"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.direction === "in" ? "success" : "ghost"}
              onClick={() => setForm((f) => ({ ...f, direction: "in" }))}
              className="flex-1"
            >
              Masuk
            </Button>
            <Button
              type="button"
              variant={form.direction === "out" ? "danger" : "ghost"}
              onClick={() => setForm((f) => ({ ...f, direction: "out" }))}
              className="flex-1"
            >
              Keluar
            </Button>
          </div>

          {form.direction === "in" && (
            <Select
              label="Jenis pemasukan"
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({ ...f, kind: e.target.value as EntryFormState["kind"] }))
              }
            >
              <option value="pemasukan">Pemasukan Lain</option>
              <option value="withdrawal">Pengembalian Dana</option>
            </Select>
          )}

          {form.direction === "out" && (
            <Select
              label="Jenis pengeluaran"
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({ ...f, kind: e.target.value as EntryFormState["kind"] }))
              }
            >
              <option value="opex">Operasional (OpEx)</option>
              <option value="capex">Belanja Modal (CapEx)</option>
              <option value="withdrawal">Tarik Dana Owner</option>
            </Select>
          )}

          {/* Pilih Akun — wajib */}
          <Select
            label="Akun *"
            value={form.akunId}
            onChange={(e) => setForm((f) => ({ ...f, akunId: e.target.value }))}
            required
          >
            <option value="">-- Pilih Akun --</option>
            {akun
              .filter((a) => a.aktif)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.tipe}) — Rp {a.saldo.toLocaleString("id-ID")}
                </option>
              ))}
          </Select>

          <Input
            type="date"
            label="Tanggal"
            value={form.entryDate}
            onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
          />
          <Input
            type="number"
            label="Jumlah (Rp)"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0"
            money
            required
          />
          <Input
            label="Catatan"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="mis. beli gas, bayar listrik"
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" loading={pending} className="flex-1">
              {editingEntry ? "Perbarui" : "Simpan"}
            </Button>
            <Button type="button" variant="ghost" onClick={close}>
              Batal
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </Modal>
    </>
  );
}

// ── Inline Edit/Delete button pair untuk baris arus kas ──────────────────────
interface EntryActionsProps {
  entry: CashflowEntryRow;
  akun: AkunWithBalance[];
}

export function EntryActions({ entry, akun }: EntryActionsProps) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EntryFormState>({
    direction: entry.direction,
    amount: String(entry.amount),
    kind: entry.kind as EntryFormState["kind"],
    note: entry.note,
    entryDate: entry.entry_date,
    akunId: (entry as CashflowEntryRow & { akun_id?: string }).akun_id ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  // Hanya entri manual yang bisa diedit/dihapus
  if (entry.source !== "manual") return null;

  const handleDelete = () => {
    if (!confirm("Hapus entri ini?")) return;
    startTransition(async () => {
      await deleteManualEntry(entry.id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateManualEntry(entry.id, {
        direction: form.direction,
        amount: Number(form.amount),
        kind: form.direction === "in" ? "pemasukan" : form.kind,
        categoryId: null,
        note: form.note,
        entryDate: form.entryDate,
        akunId: form.akunId || null,
      });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  };

  return (
    <>
      <div className="flex gap-1">
        <button
          onClick={() => setOpen(true)}
          className="text-ink-soft transition hover:text-brand"
          aria-label="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-ink-soft transition hover:text-danger"
          aria-label="Hapus"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Arus Kas" size="md">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.direction === "in" ? "success" : "ghost"}
              onClick={() => setForm((f) => ({ ...f, direction: "in" }))}
              className="flex-1"
            >
              Masuk
            </Button>
            <Button
              type="button"
              variant={form.direction === "out" ? "danger" : "ghost"}
              onClick={() => setForm((f) => ({ ...f, direction: "out" }))}
              className="flex-1"
            >
              Keluar
            </Button>
          </div>
          {form.direction === "out" && (
            <Select
              label="Jenis pengeluaran"
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({ ...f, kind: e.target.value as EntryFormState["kind"] }))
              }
            >
              <option value="opex">Operasional (OpEx)</option>
              <option value="capex">Belanja Modal (CapEx)</option>
              <option value="withdrawal">Tarik Dana Owner</option>
            </Select>
          )}
          <Select
            label="Akun"
            value={form.akunId}
            onChange={(e) => setForm((f) => ({ ...f, akunId: e.target.value }))}
          >
            <option value="">-- Tidak ada akun --</option>
            {akun
              .filter((a) => a.aktif)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} — Rp {a.saldo.toLocaleString("id-ID")}
                </option>
              ))}
          </Select>
          <Input
            type="date"
            label="Tanggal"
            value={form.entryDate}
            onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
          />
          <Input
            type="number"
            label="Jumlah (Rp)"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            money
            required
          />
          <Input
            label="Catatan"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" loading={pending} className="flex-1">
              Perbarui
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </Modal>
    </>
  );
}
