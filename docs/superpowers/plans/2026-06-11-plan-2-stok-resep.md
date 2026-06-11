# Plan 2: Stok & Resep - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun manajemen stok berbasis bahan baku + resep berversi, pencatatan pergerakan stok, indikator stok menipis, rata-rata pemakaian harian, dan saran belanja mingguan.

**Architecture:** Tabel baru (ingredients, recipes, recipe_lines, stock_movements) ditambahkan via migration SQL kedua. Logika murni (konversi resep aktif berdasarkan tanggal, proyeksi belanja, rata-rata pemakaian) dipisah di `lib/domain/inventory.ts` dan diuji penuh dengan Vitest tanpa DB. Data layer di `lib/data/inventory.ts`. UI di route group `(internal)/inventory`.

**Tech Stack:** Next.js 16, Supabase (Postgres + RLS), Vitest, Tailwind.

**Referensi spec:** `docs/superpowers/specs/2026-06-11-pos-fried-chicken-design.md` (bagian Model Data B + alur Stok & Saran Belanja)

**Catatan Next.js 16:** Baca `node_modules/next/dist/docs/` untuk server actions/revalidatePath bila perlu.

---

## File Structure (Plan 2)

- `supabase/migrations/0002_inventory_schema.sql` - tabel ingredients, recipes, recipe_lines, stock_movements + RLS
- `lib/domain/inventory.ts` - logika murni: pilih resep aktif per tanggal, hitung pengurangan stok, rata-rata pemakaian harian, proyeksi belanja
- `lib/domain/inventory.test.ts` - unit test
- `lib/data/inventory.ts` - query Supabase (ingredients, movements, recipes)
- `app/(internal)/inventory/page.tsx` - daftar stok + indikator menipis + rata-rata harian
- `app/(internal)/inventory/actions.ts` - server actions (tambah bahan, restock, adjustment)
- `app/(internal)/inventory/ingredient-form.tsx` - form tambah bahan (client)
- `app/(internal)/inventory/stock-actions-form.tsx` - form restock/adjustment (client)
- `app/(internal)/inventory/shopping/page.tsx` - saran belanja mingguan

---

## Task 1: Skema DB inventory

**Files:**
- Create: `supabase/migrations/0002_inventory_schema.sql`

- [ ] **Step 1: Buat file migration**

Buat `supabase/migrations/0002_inventory_schema.sql`:

```sql
-- Bahan baku & produk-jadi sederhana
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tracking_type text not null default 'ingredient'
    check (tracking_type in ('ingredient','finished')),
  stock_qty numeric(14,4) not null default 0,
  unit text not null default 'pcs',
  purchase_unit text not null default '',
  purchase_unit_qty numeric(14,4) not null default 1,
  low_stock_threshold numeric(14,4) not null default 0,
  created_at timestamptz not null default now()
);

-- Resep berversi: satu produk bisa punya banyak versi, dipilih per tanggal
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  effective_from date not null default current_date,
  created_by uuid references public.profiles(id),
  note text not null default '',
  created_at timestamptz not null default now()
);

-- Baris resep: bahan yang dipakai per 1 porsi produk
create table public.recipe_lines (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  qty_used numeric(14,4) not null check (qty_used >= 0)
);

-- Pergerakan stok (audit)
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  change_qty numeric(14,4) not null,
  reason text not null check (reason in ('sale','purchase','adjustment','waste')),
  ref_id uuid,
  note text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_recipes_product on public.recipes(product_id, effective_from desc);
create index idx_recipe_lines_recipe on public.recipe_lines(recipe_id);
create index idx_stock_movements_ingredient on public.stock_movements(ingredient_id, created_at desc);

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_lines enable row level security;
alter table public.stock_movements enable row level security;

create policy "internal full access ingredients"
  on public.ingredients for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access recipes"
  on public.recipes for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access recipe_lines"
  on public.recipe_lines for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access stock_movements"
  on public.stock_movements for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0002_inventory_schema.sql
git commit -m "feat: add inventory schema (ingredients, recipes, movements)"
```

- [ ] **Step 3: Terapkan ke Supabase**

Jalankan isi file di Supabase SQL Editor. Expected: Success. Verifikasi 4 tabel baru muncul dengan RLS aktif. (Langkah manual oleh pengguna; controller harus meminta konfirmasi pengguna sebelum melanjutkan ke task yang memerlukan tabel ini.)

---

## Task 2: Pilih resep aktif berdasarkan tanggal (TDD)

**Files:**
- Create: `lib/domain/inventory.ts`, `lib/domain/inventory.test.ts`

- [ ] **Step 1: Tulis failing test**

Buat `lib/domain/inventory.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { selectActiveRecipe, type RecipeVersion } from "./inventory"

const recipes: RecipeVersion[] = [
  { id: "r1", effectiveFrom: "2026-01-01", lines: [] },
  { id: "r2", effectiveFrom: "2026-03-01", lines: [] },
  { id: "r3", effectiveFrom: "2026-06-01", lines: [] },
]

describe("selectActiveRecipe", () => {
  it("memilih versi dengan effectiveFrom terbaru yang <= tanggal jual", () => {
    expect(selectActiveRecipe(recipes, "2026-04-15")?.id).toBe("r2")
  })

  it("memilih versi terbaru bila tanggal jual setelah semua versi", () => {
    expect(selectActiveRecipe(recipes, "2026-12-01")?.id).toBe("r3")
  })

  it("mengembalikan null bila tanggal jual sebelum semua versi", () => {
    expect(selectActiveRecipe(recipes, "2025-12-31")).toBeNull()
  })

  it("memilih versi tepat pada tanggal effectiveFrom", () => {
    expect(selectActiveRecipe(recipes, "2026-03-01")?.id).toBe("r2")
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npm test -- inventory`
Expected: FAIL (modul/fungsi tidak ada).

- [ ] **Step 3: Implementasi di lib/domain/inventory.ts**

```typescript
export interface RecipeLine {
  ingredientId: string
  qtyUsed: number
}

export interface RecipeVersion {
  id: string
  effectiveFrom: string // ISO date YYYY-MM-DD
  lines: RecipeLine[]
}

export function selectActiveRecipe(
  recipes: RecipeVersion[],
  saleDate: string,
): RecipeVersion | null {
  const eligible = recipes
    .filter((r) => r.effectiveFrom <= saleDate)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))
  return eligible[0] ?? null
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npm test -- inventory`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/inventory.ts lib/domain/inventory.test.ts
git commit -m "feat: add active recipe selection by date"
```

---

## Task 3: Hitung pengurangan stok dari penjualan (TDD)

**Files:**
- Modify: `lib/domain/inventory.ts`, `lib/domain/inventory.test.ts`

- [ ] **Step 1: Tambah failing test**

Tambahkan ke `lib/domain/inventory.test.ts`:

```typescript
import { calcStockDeductions } from "./inventory"

describe("calcStockDeductions", () => {
  it("mengalikan qty_used resep dengan jumlah porsi terjual", () => {
    const recipe: RecipeVersion = {
      id: "r1",
      effectiveFrom: "2026-01-01",
      lines: [
        { ingredientId: "ayam", qtyUsed: 1 },
        { ingredientId: "terigu", qtyUsed: 0.037 },
        { ingredientId: "minyak", qtyUsed: 0.022 },
      ],
    }
    const result = calcStockDeductions(recipe, 3)
    expect(result).toEqual([
      { ingredientId: "ayam", changeQty: -3 },
      { ingredientId: "terigu", changeQty: -0.111 },
      { ingredientId: "minyak", changeQty: -0.066 },
    ])
  })

  it("mengembalikan array kosong untuk resep tanpa baris", () => {
    const recipe: RecipeVersion = {
      id: "r1",
      effectiveFrom: "2026-01-01",
      lines: [],
    }
    expect(calcStockDeductions(recipe, 5)).toEqual([])
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npm test -- inventory`
Expected: FAIL ("calcStockDeductions is not a function").

- [ ] **Step 3: Implementasi calcStockDeductions**

Tambahkan ke `lib/domain/inventory.ts`:

```typescript
export interface StockDeduction {
  ingredientId: string
  changeQty: number
}

export function calcStockDeductions(
  recipe: RecipeVersion,
  qtySold: number,
): StockDeduction[] {
  return recipe.lines.map((line) => ({
    ingredientId: line.ingredientId,
    changeQty: -roundQty(line.qtyUsed * qtySold),
  }))
}

function roundQty(n: number): number {
  return Math.round(n * 10000) / 10000
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npm test -- inventory`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/inventory.ts lib/domain/inventory.test.ts
git commit -m "feat: add stock deduction calculation"
```

---

## Task 4: Rata-rata pemakaian harian & proyeksi belanja (TDD)

**Files:**
- Modify: `lib/domain/inventory.ts`, `lib/domain/inventory.test.ts`

- [ ] **Step 1: Tambah failing test**

Tambahkan ke `lib/domain/inventory.test.ts`:

```typescript
import { avgDailyUsage, projectShopping } from "./inventory"

describe("avgDailyUsage", () => {
  it("menghitung rata-rata pemakaian per hari dari total konsumsi", () => {
    // total terpakai 70 potong selama 7 hari = 10/hari
    expect(avgDailyUsage(70, 7)).toBe(10)
  })

  it("mengembalikan 0 bila rentang hari 0 untuk hindari bagi nol", () => {
    expect(avgDailyUsage(70, 0)).toBe(0)
  })
})

describe("projectShopping", () => {
  it("menghitung jumlah unit beli untuk menutup kebutuhan N hari dikurangi stok", () => {
    // butuh 10/hari x 7 hari = 70; stok sekarang 12; kurang 58
    // 1 unit beli = 9 (1 kantung = 9 potong) -> ceil(58/9) = 7 kantung
    const result = projectShopping({
      avgPerDay: 10,
      daysToCover: 7,
      currentStock: 12,
      purchaseUnitQty: 9,
    })
    expect(result.neededQty).toBe(58)
    expect(result.purchaseUnits).toBe(7)
  })

  it("mengembalikan 0 unit bila stok sudah cukup", () => {
    const result = projectShopping({
      avgPerDay: 5,
      daysToCover: 7,
      currentStock: 100,
      purchaseUnitQty: 9,
    })
    expect(result.neededQty).toBe(0)
    expect(result.purchaseUnits).toBe(0)
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npm test -- inventory`
Expected: FAIL.

- [ ] **Step 3: Implementasi avgDailyUsage & projectShopping**

Tambahkan ke `lib/domain/inventory.ts`:

```typescript
export function avgDailyUsage(totalUsed: number, days: number): number {
  if (days <= 0) return 0
  return totalUsed / days
}

export interface ShoppingProjectionInput {
  avgPerDay: number
  daysToCover: number
  currentStock: number
  purchaseUnitQty: number
}

export interface ShoppingProjection {
  neededQty: number
  purchaseUnits: number
}

export function projectShopping(
  input: ShoppingProjectionInput,
): ShoppingProjection {
  const required = input.avgPerDay * input.daysToCover
  const deficit = Math.max(0, required - input.currentStock)
  const purchaseUnits =
    input.purchaseUnitQty > 0 ? Math.ceil(deficit / input.purchaseUnitQty) : 0
  return { neededQty: roundQty(deficit), purchaseUnits }
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npm test -- inventory`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/inventory.ts lib/domain/inventory.test.ts
git commit -m "feat: add usage average and shopping projection"
```

---

## Task 5: Data layer inventory

**Files:**
- Create: `lib/data/inventory.ts`

- [ ] **Step 1: Buat lib/data/inventory.ts**

```typescript
import { createClient } from "@/lib/supabase/server"

export interface IngredientRow {
  id: string
  name: string
  tracking_type: "ingredient" | "finished"
  stock_qty: number
  unit: string
  purchase_unit: string
  purchase_unit_qty: number
  low_stock_threshold: number
  created_at: string
}

export async function listIngredients(): Promise<IngredientRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export interface UsageRow {
  ingredient_id: string
  total_used: number
}

// Total pemakaian (reason='sale') sejak tanggal tertentu, per bahan.
export async function usageSince(sinceIso: string): Promise<UsageRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stock_movements")
    .select("ingredient_id, change_qty")
    .eq("reason", "sale")
    .gte("created_at", sinceIso)
  if (error) throw new Error(error.message)

  const totals = new Map<string, number>()
  for (const row of data ?? []) {
    const used = Math.abs(Number(row.change_qty))
    totals.set(row.ingredient_id, (totals.get(row.ingredient_id) ?? 0) + used)
  }
  return Array.from(totals.entries()).map(([ingredient_id, total_used]) => ({
    ingredient_id,
    total_used,
  }))
}
```

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 3: Commit**

```bash
git add lib/data/inventory.ts
git commit -m "feat: add inventory data layer"
```

---

## Task 6: Server actions inventory (tambah bahan, restock, adjustment)

**Files:**
- Create: `app/(internal)/inventory/actions.ts`

- [ ] **Step 1: Buat server actions**

Buat `app/(internal)/inventory/actions.ts`:

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function addIngredient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const unit = String(formData.get("unit") ?? "").trim()
  const purchaseUnit = String(formData.get("purchaseUnit") ?? "").trim()
  const purchaseUnitQty = Number(formData.get("purchaseUnitQty") ?? 1)
  const lowStock = Number(formData.get("lowStockThreshold") ?? 0)
  const trackingType = String(
    formData.get("trackingType") ?? "ingredient",
  ) as "ingredient" | "finished"

  if (name.length === 0) {
    return { ok: false as const, error: "Nama bahan wajib diisi" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("ingredients").insert({
    name,
    unit,
    purchase_unit: purchaseUnit,
    purchase_unit_qty: purchaseUnitQty,
    low_stock_threshold: lowStock,
    tracking_type: trackingType,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/inventory")
  return { ok: true as const }
}

// Catat pembelian/penyesuaian: buat stock_movements DAN update stock_qty bahan.
async function applyMovement(
  ingredientId: string,
  changeQty: number,
  reason: "purchase" | "adjustment" | "waste",
  note: string,
) {
  const supabase = await createClient()

  const { data: ing, error: readErr } = await supabase
    .from("ingredients")
    .select("stock_qty")
    .eq("id", ingredientId)
    .single()
  if (readErr) return { ok: false as const, error: readErr.message }

  const { error: moveErr } = await supabase.from("stock_movements").insert({
    ingredient_id: ingredientId,
    change_qty: changeQty,
    reason,
    note,
  })
  if (moveErr) return { ok: false as const, error: moveErr.message }

  const newQty = Number(ing.stock_qty) + changeQty
  const { error: updErr } = await supabase
    .from("ingredients")
    .update({ stock_qty: newQty })
    .eq("id", ingredientId)
  if (updErr) return { ok: false as const, error: updErr.message }

  revalidatePath("/inventory")
  return { ok: true as const }
}

export async function restock(formData: FormData) {
  const ingredientId = String(formData.get("ingredientId") ?? "")
  const qty = Number(formData.get("qty") ?? 0)
  const note = String(formData.get("note") ?? "").trim()
  if (!ingredientId || qty <= 0) {
    return { ok: false as const, error: "Pilih bahan dan jumlah > 0" }
  }
  return applyMovement(ingredientId, Math.abs(qty), "purchase", note)
}

export async function adjustStock(formData: FormData) {
  const ingredientId = String(formData.get("ingredientId") ?? "")
  const delta = Number(formData.get("delta") ?? 0)
  const reason = String(formData.get("reason") ?? "adjustment") as
    | "adjustment"
    | "waste"
  const note = String(formData.get("note") ?? "").trim()
  if (!ingredientId || delta === 0) {
    return { ok: false as const, error: "Pilih bahan dan selisih bukan 0" }
  }
  return applyMovement(ingredientId, delta, reason, note)
}
```

CATATAN penting: di Plan ini pengurangan stok hanya lewat purchase/adjustment/waste. Pengurangan otomatis saat penjualan (reason='sale') diimplementasikan di Plan 3 (Kasir), yang akan memakai `calcStockDeductions` dan menulis stock_movements + update stock_qty dalam alur checkout.

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 3: Commit**

```bash
git add "app/(internal)/inventory/actions.ts"
git commit -m "feat: add inventory server actions"
```

---

## Task 7: Halaman stok + form tambah bahan & restock/adjustment

**Files:**
- Create: `app/(internal)/inventory/ingredient-form.tsx`, `app/(internal)/inventory/stock-actions-form.tsx`, `app/(internal)/inventory/page.tsx`

- [ ] **Step 1: Buat ingredient-form.tsx (client)**

```tsx
"use client"

import { useState, useTransition } from "react"
import { addIngredient } from "./actions"

export function IngredientForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => {
        setError(null)
        startTransition(async () => {
          const result = await addIngredient(formData)
          if (!result.ok) setError(result.error)
        })
      }}
      className="grid grid-cols-2 gap-2 rounded-lg border p-3 md:grid-cols-3"
    >
      <input name="name" required placeholder="Nama bahan" className="rounded border px-2 py-1" />
      <input name="unit" placeholder="Satuan pakai (potong/kg/liter)" className="rounded border px-2 py-1" />
      <select name="trackingType" className="rounded border px-2 py-1">
        <option value="ingredient">Bahan baku</option>
        <option value="finished">Produk jadi</option>
      </select>
      <input name="purchaseUnit" placeholder="Satuan beli (kantung/pouch)" className="rounded border px-2 py-1" />
      <input name="purchaseUnitQty" type="number" step="0.0001" defaultValue={1} placeholder="Isi per satuan beli" className="rounded border px-2 py-1" />
      <input name="lowStockThreshold" type="number" step="0.0001" defaultValue={0} placeholder="Batas menipis" className="rounded border px-2 py-1" />
      <button type="submit" disabled={pending} className="col-span-2 rounded bg-black px-3 py-1.5 text-white disabled:opacity-50 md:col-span-3">
        {pending ? "Menyimpan..." : "Tambah bahan"}
      </button>
      {error && <p className="col-span-2 text-sm text-red-600 md:col-span-3">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 2: Buat stock-actions-form.tsx (client) untuk restock & adjustment**

```tsx
"use client"

import { useState, useTransition } from "react"
import { restock, adjustStock } from "./actions"

interface Option {
  id: string
  name: string
  unit: string
}

export function StockActionsForm({ ingredients }: { ingredients: Option[] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await restock(formData)
            if (!result.ok) setError(result.error)
          })
        }}
        className="space-y-2 rounded-lg border p-3"
      >
        <h3 className="font-medium">Restock (pembelian)</h3>
        <select name="ingredientId" required className="w-full rounded border px-2 py-1">
          <option value="">Pilih bahan...</option>
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
          ))}
        </select>
        <input name="qty" type="number" step="0.0001" min="0" placeholder="Jumlah ditambah (dalam satuan pakai)" className="w-full rounded border px-2 py-1" />
        <input name="note" placeholder="Catatan (opsional)" className="w-full rounded border px-2 py-1" />
        <button type="submit" disabled={pending} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">Tambah stok</button>
      </form>

      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await adjustStock(formData)
            if (!result.ok) setError(result.error)
          })
        }}
        className="space-y-2 rounded-lg border p-3"
      >
        <h3 className="font-medium">Penyesuaian / Rusak</h3>
        <select name="ingredientId" required className="w-full rounded border px-2 py-1">
          <option value="">Pilih bahan...</option>
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
          ))}
        </select>
        <input name="delta" type="number" step="0.0001" placeholder="Selisih (- untuk kurang)" className="w-full rounded border px-2 py-1" />
        <select name="reason" className="w-full rounded border px-2 py-1">
          <option value="adjustment">Penyesuaian</option>
          <option value="waste">Rusak/Buang</option>
        </select>
        <input name="note" placeholder="Catatan (opsional)" className="w-full rounded border px-2 py-1" />
        <button type="submit" disabled={pending} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">Sesuaikan</button>
      </form>

      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Buat page.tsx daftar stok dengan rata-rata harian & indikator menipis**

```tsx
import Link from "next/link"
import { listIngredients, usageSince } from "@/lib/data/inventory"
import { avgDailyUsage } from "@/lib/domain/inventory"
import { IngredientForm } from "./ingredient-form"
import { StockActionsForm } from "./stock-actions-form"

const WINDOW_DAYS = 7

export default async function InventoryPage() {
  const ingredients = await listIngredients()
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString()
  const usage = await usageSince(since)
  const usageMap = new Map(usage.map((u) => [u.ingredient_id, u.total_used]))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Stok Bahan</h1>
        <Link href="/inventory/shopping" className="text-sm text-blue-600 underline">
          Saran Belanja &rarr;
        </Link>
      </div>

      <IngredientForm />
      <StockActionsForm ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))} />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Bahan</th>
            <th className="text-right">Stok</th>
            <th>Satuan</th>
            <th className="text-right">Rata-rata/hari (7h)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((i) => {
            const totalUsed = usageMap.get(i.id) ?? 0
            const perDay = avgDailyUsage(totalUsed, WINDOW_DAYS)
            const low = i.stock_qty <= i.low_stock_threshold
            return (
              <tr key={i.id} className="border-b">
                <td className="py-2">{i.name}</td>
                <td className="text-right">{i.stock_qty.toLocaleString("id-ID")}</td>
                <td>{i.unit}</td>
                <td className="text-right">{perDay.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</td>
                <td>{low ? <span className="text-red-600">Menipis</span> : "Aman"}</td>
              </tr>
            )
          })}
          {ingredients.length === 0 && (
            <tr><td colSpan={5} className="py-4 text-center text-gray-500">Belum ada bahan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Verifikasi build**

Run: `npm run build`
Expected: sukses, route `/inventory` muncul.

- [ ] **Step 5: Commit**

```bash
git add "app/(internal)/inventory/ingredient-form.tsx" "app/(internal)/inventory/stock-actions-form.tsx" "app/(internal)/inventory/page.tsx"
git commit -m "feat: add inventory page with stock management"
```

---

## Task 8: Halaman saran belanja mingguan

**Files:**
- Create: `app/(internal)/inventory/shopping/page.tsx`

- [ ] **Step 1: Buat halaman saran belanja**

```tsx
import Link from "next/link"
import { listIngredients, usageSince } from "@/lib/data/inventory"
import { avgDailyUsage, projectShopping } from "@/lib/domain/inventory"

const WINDOW_DAYS = 7
const DAYS_TO_COVER = 7

export default async function ShoppingPage() {
  const ingredients = await listIngredients()
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString()
  const usage = await usageSince(since)
  const usageMap = new Map(usage.map((u) => [u.ingredient_id, u.total_used]))

  const rows = ingredients
    .filter((i) => i.tracking_type === "ingredient")
    .map((i) => {
      const perDay = avgDailyUsage(usageMap.get(i.id) ?? 0, WINDOW_DAYS)
      const projection = projectShopping({
        avgPerDay: perDay,
        daysToCover: DAYS_TO_COVER,
        currentStock: i.stock_qty,
        purchaseUnitQty: i.purchase_unit_qty,
      })
      return { ingredient: i, perDay, projection }
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Saran Belanja ({DAYS_TO_COVER} hari)</h1>
        <Link href="/inventory" className="text-sm text-blue-600 underline">
          &larr; Kembali ke stok
        </Link>
      </div>
      <p className="text-sm text-gray-600">
        Dihitung dari rata-rata pemakaian {WINDOW_DAYS} hari terakhir.
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Bahan</th>
            <th className="text-right">Rata/hari</th>
            <th className="text-right">Stok kini</th>
            <th className="text-right">Kurang</th>
            <th className="text-right">Beli</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ ingredient, perDay, projection }) => (
            <tr key={ingredient.id} className="border-b">
              <td className="py-2">{ingredient.name}</td>
              <td className="text-right">{perDay.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ingredient.unit}</td>
              <td className="text-right">{ingredient.stock_qty.toLocaleString("id-ID")} {ingredient.unit}</td>
              <td className="text-right">{projection.neededQty.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ingredient.unit}</td>
              <td className="text-right font-medium">
                {projection.purchaseUnits > 0
                  ? `${projection.purchaseUnits} ${ingredient.purchase_unit || "unit"}`
                  : "-"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="py-4 text-center text-gray-500">Belum ada bahan baku untuk diproyeksikan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses, route `/inventory/shopping` muncul.

- [ ] **Step 3: Commit**

```bash
git add "app/(internal)/inventory/shopping/page.tsx"
git commit -m "feat: add weekly shopping suggestion page"
```

---

## Task 9: Navigasi & verifikasi

**Files:**
- Modify: `app/(internal)/layout.tsx`

- [ ] **Step 1: Tambah link Stok di nav header**

Di `app/(internal)/layout.tsx`, tambahkan link ke `/inventory` di dalam `<nav>` (setelah link Menu):

```tsx
<a href="/inventory" className="hover:underline">Stok</a>
```

- [ ] **Step 2: Verifikasi build & test**

Run: `npm run build` — Expected: sukses, route `/inventory` dan `/inventory/shopping` muncul.
Run: `npm test` — Expected: semua test lulus (termasuk inventory: 8 test baru).

- [ ] **Step 3: Verifikasi manual**

Jalankan `npm run dev`, login, buka `/inventory`. Tambah bahan "Ayam" (satuan pakai "potong", satuan beli "kantung", isi per satuan beli 9, batas menipis 18). Restock 27 potong. Pastikan stok jadi 27. Buka `/inventory/shopping` — karena belum ada penjualan, rata/hari 0 dan saran beli "-". Verifikasi data di Supabase (ingredients + stock_movements).

- [ ] **Step 4: Commit**

```bash
git add "app/(internal)/layout.tsx"
git commit -m "feat: add inventory navigation link"
```

---

## Catatan Penyelesaian

Setelah Plan 2 selesai: owner bisa kelola bahan baku, restock, penyesuaian, lihat rata-rata pemakaian & saran belanja mingguan. Pengurangan stok otomatis saat penjualan akan diimplementasikan di Plan 3 (Kasir), memakai `selectActiveRecipe` + `calcStockDeductions`. Pengelolaan UI resep (recipe_lines) per produk juga ditambahkan di Plan 3 atau plan lanjutan saat kasir membutuhkannya.
