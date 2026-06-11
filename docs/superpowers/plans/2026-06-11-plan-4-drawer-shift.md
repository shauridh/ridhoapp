# Plan 4: Drawer/Shift Management - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun manajemen kas fisik kasir: open/close shift, cash in/out manual, hitung expected vs counted cash, selisih kas, dan integrasi dengan cashflow.

**Architecture:** Tabel `shifts` dan `cash_drawer_movements` ditambahkan via migration. Shift dikelola via server actions (open, close, cash in/out). Closing shift otomatis membuat entri cashflow untuk income. UI shift management di `/pos/shift` atau terintegrasi dengan halaman `/pos`.

**Tech Stack:** Next.js 16, Supabase, Vitest, Tailwind.

**Referensi spec:** `docs/superpowers/specs/2026-06-11-pos-fried-chicken-design.md` (Model Data D, Alur Shift/Drawer)

---

## File Structure (Plan 4)

- `supabase/migrations/0004_shift_schema.sql` - tabel shifts, cash_drawer_movements + RLS
- `lib/domain/shift.ts` - kalkulasi expected cash, validasi closing
- `lib/domain/shift.test.ts` - unit test
- `lib/data/shifts.ts` - query shifts
- `app/(internal)/pos/shift/actions.ts` - server actions (open, close, cash in/out)
- `app/(internal)/pos/shift/page.tsx` - halaman shift management
- `app/(internal)/pos/shift/open-form.tsx` - form open shift (client)
- `app/(internal)/pos/shift/close-form.tsx` - form close shift (client)

---

## Task 1: Skema DB shifts

**Files:**
- Create: `supabase/migrations/0004_shift_schema.sql`

- [ ] **Step 1: Buat file migration**

Buat `supabase/migrations/0004_shift_schema.sql`:

```sql
-- Sesi buka-tutup kasir
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references public.profiles(id),
  opened_at timestamptz not null default now(),
  closed_by uuid references public.profiles(id),
  closed_at timestamptz,
  opening_balance numeric(14,2) not null default 0,
  expected_cash numeric(14,2) not null default 0,
  counted_cash numeric(14,2),
  cash_difference numeric(14,2),
  owner_withdrawal numeric(14,2),
  closing_balance numeric(14,2),
  qris_total numeric(14,2) not null default 0,
  status text not null default 'open' check (status in ('open','closed'))
);

-- Cash in/out manual selama shift
create table public.cash_drawer_movements (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  amount numeric(14,2) not null check (amount > 0),
  reason text not null default '',
  category_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_shifts_status on public.shifts(status, opened_at desc);
create index idx_cash_drawer_movements_shift on public.cash_drawer_movements(shift_id);

alter table public.shifts enable row level security;
alter table public.cash_drawer_movements enable row level security;

create policy "internal full access shifts"
  on public.shifts for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access cash_drawer_movements"
  on public.cash_drawer_movements for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());
```

- [ ] **Step 2: Commit & terapkan**

```bash
git add supabase/migrations/0004_shift_schema.sql
git commit -m "feat: add shift/drawer schema"
```

Jalankan SQL di Supabase. Verifikasi 2 tabel + RLS.

---

## Task 2: Domain shift logic (TDD)

**Files:**
- Create: `lib/domain/shift.ts`, `lib/domain/shift.test.ts`

- [ ] **Step 1: Tulis failing test**

```typescript
import { describe, it, expect } from "vitest"
import { calcExpectedCash, calcCashDifference } from "./shift"

describe("calcExpectedCash", () => {
  it("menghitung expected = opening + penjualan tunai - cash out", () => {
    expect(calcExpectedCash(50000, 120000, 15000)).toBe(155000)
  })
})

describe("calcCashDifference", () => {
  it("menghitung selisih counted - expected", () => {
    expect(calcCashDifference(155000, 156000)).toBe(1000)
  })

  it("mengembalikan negatif bila kurang", () => {
    expect(calcCashDifference(155000, 154000)).toBe(-1000)
  })
})
```

- [ ] **Step 2: Run test, confirm FAIL**
- [ ] **Step 3: Implement lib/domain/shift.ts**

```typescript
export function calcExpectedCash(
  opening: number,
  cashSales: number,
  cashOut: number,
): number {
  return opening + cashSales - cashOut
}

export function calcCashDifference(
  expected: number,
  counted: number,
): number {
  return counted - expected
}
```

- [ ] **Step 4: Run test, confirm PASS**
- [ ] **Step 5: Commit**

```bash
git add lib/domain/shift.ts lib/domain/shift.test.ts
git commit -m "feat: add shift domain logic"
```

---

## Task 3: Data layer shifts

**Files:**
- Create: `lib/data/shifts.ts`

- [ ] **Step 1: Buat lib/data/shifts.ts**

```typescript
import { createClient } from "@/lib/supabase/server"

export interface ShiftRow {
  id: string
  opened_by: string
  opened_at: string
  closed_by: string | null
  closed_at: string | null
  opening_balance: number
  expected_cash: number
  counted_cash: number | null
  cash_difference: number | null
  owner_withdrawal: number | null
  closing_balance: number | null
  qris_total: number
  status: "open" | "closed"
}

export async function getCurrentOpenShift(): Promise<ShiftRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("status", "open")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function listRecentShifts(limit = 20): Promise<ShiftRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .order("opened_at", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}
```

- [ ] **Step 2: Build & commit**

```bash
npm run build
git add lib/data/shifts.ts
git commit -m "feat: add shifts data layer"
```

---

## Task 4: Server actions shift

**Files:**
- Create: `app/(internal)/pos/shift/actions.ts`

- [ ] **Step 1: Buat server actions open, close, cash in/out**

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { calcExpectedCash, calcCashDifference } from "@/lib/domain/shift"

export async function openShift(openingBalance: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  // Cek apakah sudah ada shift open
  const { data: existing } = await supabase
    .from("shifts")
    .select("id")
    .eq("status", "open")
    .maybeSingle()
  if (existing) return { ok: false as const, error: "Shift sudah terbuka" }

  // Buat shift baru
  const { data, error } = await supabase
    .from("shifts")
    .insert({
      opened_by: user.id,
      opening_balance: openingBalance,
    })
    .select("id")
    .single()
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/pos/shift")
  return { ok: true as const, shiftId: data.id }
}

export async function closeShift(payload: {
  shiftId: string
  countedCash: number
  ownerWithdrawal: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  // Ambil shift + hitung expected
  const { data: shift } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", payload.shiftId)
    .single()
  if (!shift) return { ok: false as const, error: "Shift tidak ditemukan" }
  if (shift.status === "closed") return { ok: false as const, error: "Shift sudah ditutup" }

  // Total penjualan tunai dari orders dengan shift_id ini
  const { data: orders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", payload.shiftId)
    .eq("payment_method", "cash")
    .eq("status", "completed")
  const cashSales = (orders ?? []).reduce((s, o) => s + Number(o.total), 0)

  // Total QRIS
  const { data: qrisOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", payload.shiftId)
    .eq("payment_method", "qris")
    .eq("status", "completed")
  const qrisTotal = (qrisOrders ?? []).reduce((s, o) => s + Number(o.total), 0)

  // Total cash out
  const { data: movements } = await supabase
    .from("cash_drawer_movements")
    .select("amount")
    .eq("shift_id", payload.shiftId)
    .eq("direction", "out")
  const cashOut = (movements ?? []).reduce((s, m) => s + Number(m.amount), 0)

  const expectedCash = calcExpectedCash(Number(shift.opening_balance), cashSales, cashOut)
  const cashDiff = calcCashDifference(expectedCash, payload.countedCash)
  const closingBalance = payload.countedCash - payload.ownerWithdrawal

  // Update shift
  const { error: updErr } = await supabase
    .from("shifts")
    .update({
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      expected_cash: expectedCash,
      counted_cash: payload.countedCash,
      cash_difference: cashDiff,
      owner_withdrawal: payload.ownerWithdrawal,
      closing_balance: closingBalance,
      qris_total: qrisTotal,
      status: "closed",
    })
    .eq("id", payload.shiftId)
  if (updErr) return { ok: false as const, error: updErr.message }

  // Buat cashflow entry (income dari penjualan)
  const totalIncome = cashSales + qrisTotal
  if (totalIncome > 0) {
    await supabase.from("cashflow_entries").insert({
      entry_date: new Date().toISOString().slice(0, 10),
      direction: "in",
      amount: totalIncome,
      kind: "income",
      source: "sale",
      ref_id: payload.shiftId,
      note: `Penjualan shift ${payload.shiftId}`,
      created_by: user.id,
    })
  }

  revalidatePath("/pos/shift")
  return { ok: true as const }
}

export async function cashOut(shiftId: string, amount: number, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  if (amount <= 0) return { ok: false as const, error: "Jumlah harus > 0" }

  const { error } = await supabase.from("cash_drawer_movements").insert({
    shift_id: shiftId,
    direction: "out",
    amount,
    reason,
    created_by: user.id,
  })
  if (error) return { ok: false as const, error: error.message }

  // Buat cashflow entry (opex)
  await supabase.from("cashflow_entries").insert({
    entry_date: new Date().toISOString().slice(0, 10),
    direction: "out",
    amount,
    kind: "opex",
    source: "drawer",
    ref_id: shiftId,
    note: reason,
    created_by: user.id,
  })

  revalidatePath("/pos/shift")
  return { ok: true as const }
}
```

CATATAN: closeShift mengasumsikan orders sudah punya shift_id. Kita perlu update checkout action di Plan 3 untuk set shift_id. Atau untuk MVP: hitung dari semua orders hari ini.

- [ ] **Step 2: Build & commit**

```bash
npm run build
git add "app/(internal)/pos/shift/actions.ts"
git commit -m "feat: add shift server actions"
```

---

## Task 5: UI shift management

**Files:**
- Create: `app/(internal)/pos/shift/page.tsx`, `app/(internal)/pos/shift/open-form.tsx`, `app/(internal)/pos/shift/close-form.tsx`

- [ ] **Step 1: Buat open-form.tsx**

```tsx
"use client"

import { useState, useTransition } from "react"
import { openShift } from "./actions"

export function OpenForm() {
  const [balance, setBalance] = useState("50000")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await openShift(Number(balance))
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Buka Shift</h3>
      <div>
        <label className="text-sm text-gray-600">Saldo Awal (modal kembalian)</label>
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-black py-2 text-white disabled:opacity-50"
      >
        {pending ? "Membuka..." : "Buka Shift"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 2: Buat close-form.tsx**

```tsx
"use client"

import { useState, useTransition } from "react"
import { closeShift } from "./actions"

interface Props {
  shift: { id: string; expected_cash: number }
}

export function CloseForm({ shift }: Props) {
  const [counted, setCounted] = useState("")
  const [withdrawal, setWithdrawal] = useState("0")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await closeShift({
        shiftId: shift.id,
        countedCash: Number(counted),
        ownerWithdrawal: Number(withdrawal),
      })
      if (!result.ok) setError(result.error)
    })
  }

  const diff = counted ? Number(counted) - shift.expected_cash : null

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Tutup Shift</h3>
      <div className="text-sm text-gray-600">
        Expected: Rp {shift.expected_cash.toLocaleString("id-ID")}
      </div>
      <div>
        <label className="text-sm text-gray-600">Uang Dihitung (fisik)</label>
        <input
          type="number"
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
      </div>
      {diff !== null && (
        <div className={`text-sm ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
          Selisih: Rp {Math.abs(diff).toLocaleString("id-ID")} {diff >= 0 ? "(lebih)" : "(kurang)"}
        </div>
      )}
      <div>
        <label className="text-sm text-gray-600">Uang Diambil Owner</label>
        <input
          type="number"
          value={withdrawal}
          onChange={(e) => setWithdrawal(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-black py-2 text-white disabled:opacity-50"
      >
        {pending ? "Menutup..." : "Tutup Shift"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 3: Buat page.tsx**

```tsx
import { getCurrentOpenShift, listRecentShifts } from "@/lib/data/shifts"
import { OpenForm } from "./open-form"
import { CloseForm } from "./close-form"

export default async function ShiftPage() {
  const openShift = await getCurrentOpenShift()
  const recentShifts = await listRecentShifts(10)

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
            <p>Saldo awal: Rp {openShift.opening_balance.toLocaleString("id-ID")}</p>
          </div>
          <CloseForm shift={{ id: openShift.id, expected_cash: 0 }} />
        </div>
      )}

      <div>
        <h2 className="mb-2 font-medium">Riwayat Shift</h2>
        <div className="space-y-2">
          {recentShifts.map((s) => (
            <div key={s.id} className="rounded-lg border p-2 text-sm">
              <div className="flex justify-between">
                <span>{new Date(s.opened_at).toLocaleDateString("id-ID")}</span>
                <span className={s.status === "open" ? "text-green-600" : "text-gray-500"}>
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
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Build & commit**

```bash
npm run build
git add "app/(internal)/pos/shift/"
git commit -m "feat: add shift management UI"
```

---

## Task 6: Navigasi & integrasi checkout dengan shift_id

- [ ] **Step 1: Tambah link Shift di nav**

Di layout internal, tambah link `/pos/shift`.

- [ ] **Step 2: Update checkout action untuk set shift_id**

Di `app/(internal)/pos/actions.ts`, sebelum insert order, fetch shift open:

```typescript
const { data: shift } = await supabase
  .from("shifts")
  .select("id")
  .eq("status", "open")
  .maybeSingle()

const { data: order, error: orderErr } = await supabase
  .from("orders")
  .insert({
    shift_id: shift?.id,
    total: payload.total,
    ...
  })
```

- [ ] **Step 3: Build, test, commit docs**

```bash
npm run build
npm test
git add app/(internal)/layout.tsx app/(internal)/pos/actions.ts docs/superpowers/plans/2026-06-11-plan-4-drawer-shift.md
git commit -m "feat: integrate shift with checkout and add navigation"
```

---

## Catatan Penyelesaian

Setelah Plan 4 selesai: kasir bisa buka shift dengan saldo awal, cash out manual, tutup shift dengan hitung selisih, dan closing shift otomatis membuat cashflow entry. Lanjut Plan 5 (Cashflow & Laporan) untuk dashboard grafik lengkap.