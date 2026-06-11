# Plan 1: Menu & Produk - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun UI pengelolaan menu (CRUD produk, varian/topping, paket combo) di atas skema DB yang sudah dibuat di Plan 0, sehingga owner bisa menambah/mengubah/menonaktifkan menu lewat halaman settings.

**Architecture:** Server Components untuk daftar data (fetch via Supabase server client), Server Actions untuk mutasi (create/update/toggle). Logika domain (validasi, transformasi) dipisah di `lib/domain/menu.ts` agar bisa di-unit-test tanpa DB. Halaman di route group `(internal)/settings/menu`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (server client + RLS), Vitest untuk unit test logika domain, Tailwind CSS.

**Referensi spec:** `docs/superpowers/specs/2026-06-11-pos-fried-chicken-design.md` (bagian Model Data A)

**Catatan Next.js 16:** Sebelum menulis kode, baca `node_modules/next/dist/docs/` untuk konvensi server actions, revalidatePath, dan form. Adaptasi bila berbeda.

---

## File Structure (Plan 1)

- `lib/domain/menu.ts` - tipe & fungsi murni: validasi produk, kalkulasi harga combo, transformasi varian
- `lib/domain/menu.test.ts` - unit test logika domain
- `lib/data/products.ts` - query Supabase (fetch products, variants, combo)
- `app/(internal)/settings/menu/page.tsx` - daftar produk
- `app/(internal)/settings/menu/actions.ts` - server actions (create/update/toggle produk, varian, combo)
- `app/(internal)/settings/menu/product-form.tsx` - form tambah/edit produk (client component)
- `app/(internal)/settings/menu/[id]/page.tsx` - detail produk: kelola varian & isi combo
- `components/ui/` - komponen kecil bila perlu (button, input) — hanya jika belum ada

---

## Task 1: Tipe domain & validasi produk (TDD)

**Files:**
- Create: `lib/domain/menu.ts`, `lib/domain/menu.test.ts`

- [ ] **Step 1: Tulis failing test untuk validasi produk**

Buat `lib/domain/menu.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { validateProductInput, type ProductInput } from "./menu"

describe("validateProductInput", () => {
  it("menerima produk single yang valid", () => {
    const input: ProductInput = {
      name: "Ayam Goreng",
      type: "single",
      basePrice: 12000,
      category: "Ayam",
    }
    expect(validateProductInput(input)).toEqual({ ok: true })
  })

  it("menolak nama kosong", () => {
    const input: ProductInput = {
      name: "  ",
      type: "single",
      basePrice: 12000,
      category: "Ayam",
    }
    const result = validateProductInput(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/nama/i)
  })

  it("menolak harga negatif", () => {
    const input: ProductInput = {
      name: "Ayam",
      type: "single",
      basePrice: -1,
      category: "Ayam",
    }
    const result = validateProductInput(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/harga/i)
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npm test -- menu`
Expected: FAIL ("validateProductInput is not a function" atau modul tidak ada).

- [ ] **Step 3: Implementasi minimal di lib/domain/menu.ts**

```typescript
export type ProductType = "single" | "combo"

export interface ProductInput {
  name: string
  type: ProductType
  basePrice: number
  category: string
}

export type ValidationResult = { ok: true } | { ok: false; error: string }

export function validateProductInput(input: ProductInput): ValidationResult {
  if (input.name.trim().length === 0) {
    return { ok: false, error: "Nama produk wajib diisi" }
  }
  if (input.basePrice < 0) {
    return { ok: false, error: "Harga tidak boleh negatif" }
  }
  return { ok: true }
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npm test -- menu`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/menu.ts lib/domain/menu.test.ts
git commit -m "feat: add product validation domain logic"
```

---

## Task 2: Kalkulasi harga item + varian (TDD)

**Files:**
- Modify: `lib/domain/menu.ts`, `lib/domain/menu.test.ts`

- [ ] **Step 1: Tambah failing test untuk kalkulasi harga**

Tambahkan ke `lib/domain/menu.test.ts`:

```typescript
import { calcLinePrice } from "./menu"

describe("calcLinePrice", () => {
  it("menghitung harga dasar tanpa varian", () => {
    expect(calcLinePrice(12000, [])).toBe(12000)
  })

  it("menambahkan price_delta dari varian terpilih", () => {
    expect(calcLinePrice(12000, [2000, 5000])).toBe(19000)
  })

  it("mengabaikan delta negatif tidak wajar dengan tetap menjumlahkan", () => {
    expect(calcLinePrice(12000, [-2000])).toBe(10000)
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npm test -- menu`
Expected: FAIL ("calcLinePrice is not a function").

- [ ] **Step 3: Implementasi calcLinePrice di lib/domain/menu.ts**

```typescript
export function calcLinePrice(basePrice: number, variantDeltas: number[]): number {
  return variantDeltas.reduce((sum, delta) => sum + delta, basePrice)
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npm test -- menu`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/menu.ts lib/domain/menu.test.ts
git commit -m "feat: add line price calculation"
```

---

## Task 3: Data layer produk

**Files:**
- Create: `lib/data/products.ts`

- [ ] **Step 1: Buat lib/data/products.ts**

```typescript
import { createClient } from "@/lib/supabase/server"

export interface ProductRow {
  id: string
  name: string
  type: "single" | "combo"
  base_price: number
  category: string
  is_active: boolean
  created_at: string
}

export async function listProducts(): Promise<ProductRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProduct(id: string): Promise<ProductRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export interface VariantRow {
  id: string
  product_id: string
  name: string
  is_required: boolean
  price_delta: number
  type: "option" | "addon"
  is_active: boolean
}

export async function listVariants(productId: string): Promise<VariantRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
```

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses tanpa error TypeScript.

- [ ] **Step 3: Commit**

```bash
git add lib/data/products.ts
git commit -m "feat: add product data layer queries"
```

---

## Task 4: Server actions produk

**Files:**
- Create: `app/(internal)/settings/menu/actions.ts`

- [ ] **Step 1: Buat server actions**

Buat `app/(internal)/settings/menu/actions.ts`:

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { validateProductInput, type ProductInput } from "@/lib/domain/menu"

function parseProductForm(formData: FormData): ProductInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    type: (String(formData.get("type") ?? "single") as ProductInput["type"]),
    basePrice: Number(formData.get("basePrice") ?? 0),
    category: String(formData.get("category") ?? "").trim(),
  }
}

export async function createProduct(formData: FormData) {
  const input = parseProductForm(formData)
  const validation = validateProductInput(input)
  if (!validation.ok) {
    return { ok: false as const, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("products").insert({
    name: input.name,
    type: input.type,
    base_price: input.basePrice,
    category: input.category,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings/menu")
  return { ok: true as const }
}

export async function updateProduct(id: string, formData: FormData) {
  const input = parseProductForm(formData)
  const validation = validateProductInput(input)
  if (!validation.ok) {
    return { ok: false as const, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      type: input.type,
      base_price: input.basePrice,
      category: input.category,
    })
    .eq("id", id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings/menu")
  revalidatePath(`/settings/menu/${id}`)
  return { ok: true as const }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/settings/menu")
  return { ok: true as const }
}
```

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 3: Commit**

```bash
git add "app/(internal)/settings/menu/actions.ts"
git commit -m "feat: add product server actions"
```

---

## Task 5: Halaman daftar menu + form tambah produk

**Files:**
- Create: `app/(internal)/settings/menu/page.tsx`, `app/(internal)/settings/menu/product-form.tsx`

- [ ] **Step 1: Buat client component form di product-form.tsx**

```tsx
"use client"

import { useState, useTransition } from "react"
import { createProduct } from "./actions"

export function ProductForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => {
        setError(null)
        startTransition(async () => {
          const result = await createProduct(formData)
          if (!result.ok) setError(result.error)
        })
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Nama</label>
        <input name="name" required className="rounded border px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Kategori</label>
        <input name="category" className="rounded border px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Tipe</label>
        <select name="type" className="rounded border px-2 py-1">
          <option value="single">Satuan</option>
          <option value="combo">Paket</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Harga</label>
        <input
          name="basePrice"
          type="number"
          min="0"
          defaultValue={0}
          className="w-28 rounded border px-2 py-1"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Tambah"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 2: Buat halaman daftar di page.tsx**

```tsx
import Link from "next/link"
import { listProducts } from "@/lib/data/products"
import { ProductForm } from "./product-form"

export default async function MenuPage() {
  const products = await listProducts()

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Kelola Menu</h1>
      <ProductForm />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Nama</th>
            <th>Kategori</th>
            <th>Tipe</th>
            <th className="text-right">Harga</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.name}</td>
              <td>{p.category}</td>
              <td>{p.type === "combo" ? "Paket" : "Satuan"}</td>
              <td className="text-right">
                Rp {p.base_price.toLocaleString("id-ID")}
              </td>
              <td>{p.is_active ? "Aktif" : "Nonaktif"}</td>
              <td className="text-right">
                <Link
                  href={`/settings/menu/${p.id}`}
                  className="text-blue-600 underline"
                >
                  Kelola
                </Link>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                Belum ada produk.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: sukses, route `/settings/menu` muncul.

- [ ] **Step 4: Commit**

```bash
git add "app/(internal)/settings/menu/page.tsx" "app/(internal)/settings/menu/product-form.tsx"
git commit -m "feat: add menu list page and product form"
```

---

## Task 6: Halaman detail produk - kelola varian & combo

**Files:**
- Create: `app/(internal)/settings/menu/[id]/page.tsx`, `app/(internal)/settings/menu/[id]/variant-actions.ts`, `app/(internal)/settings/menu/[id]/variant-form.tsx`

- [ ] **Step 1: Buat server actions varian di variant-actions.ts**

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function addVariant(productId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const priceDelta = Number(formData.get("priceDelta") ?? 0)
  const type = String(formData.get("type") ?? "addon") as "option" | "addon"
  const isRequired = formData.get("isRequired") === "on"

  if (name.length === 0) {
    return { ok: false as const, error: "Nama varian wajib diisi" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    name,
    price_delta: priceDelta,
    type,
    is_required: isRequired,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath(`/settings/menu/${productId}`)
  return { ok: true as const }
}

export async function toggleVariantActive(
  variantId: string,
  productId: string,
  isActive: boolean,
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("product_variants")
    .update({ is_active: isActive })
    .eq("id", variantId)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath(`/settings/menu/${productId}`)
  return { ok: true as const }
}
```

- [ ] **Step 2: Buat client form varian di variant-form.tsx**

```tsx
"use client"

import { useState, useTransition } from "react"
import { addVariant } from "./variant-actions"

export function VariantForm({ productId }: { productId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => {
        setError(null)
        startTransition(async () => {
          const result = await addVariant(productId, formData)
          if (!result.ok) setError(result.error)
        })
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Nama varian</label>
        <input name="name" required className="rounded border px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Tambahan harga</label>
        <input
          name="priceDelta"
          type="number"
          defaultValue={0}
          className="w-28 rounded border px-2 py-1"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Tipe</label>
        <select name="type" className="rounded border px-2 py-1">
          <option value="addon">Tambahan (addon)</option>
          <option value="option">Pilihan (option)</option>
        </select>
      </div>
      <label className="flex items-center gap-1 text-sm">
        <input name="isRequired" type="checkbox" /> Wajib
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Tambah varian"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 3: Buat halaman detail produk di [id]/page.tsx**

```tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { getProduct, listVariants } from "@/lib/data/products"
import { VariantForm } from "./variant-form"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const variants = await listVariants(id)

  return (
    <div className="space-y-4">
      <Link href="/settings/menu" className="text-sm text-blue-600 underline">
        &larr; Kembali ke menu
      </Link>
      <h1 className="text-lg font-semibold">{product.name}</h1>
      <p className="text-sm text-gray-600">
        {product.category} &middot;{" "}
        {product.type === "combo" ? "Paket" : "Satuan"} &middot; Rp{" "}
        {product.base_price.toLocaleString("id-ID")}
      </p>

      <section className="space-y-2">
        <h2 className="font-medium">Varian & Topping</h2>
        <VariantForm productId={id} />
        <ul className="divide-y rounded-lg border">
          {variants.map((v) => (
            <li key={v.id} className="flex justify-between px-3 py-2 text-sm">
              <span>
                {v.name}{" "}
                <span className="text-gray-500">
                  ({v.type}
                  {v.is_required ? ", wajib" : ""})
                </span>
              </span>
              <span>
                Rp {v.price_delta.toLocaleString("id-ID")}{" "}
                {!v.is_active && (
                  <span className="text-red-500">(nonaktif)</span>
                )}
              </span>
            </li>
          ))}
          {variants.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">
              Belum ada varian.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Verifikasi build**

Run: `npm run build`
Expected: sukses, route `/settings/menu/[id]` muncul.

- [ ] **Step 5: Commit**

```bash
git add "app/(internal)/settings/menu/[id]"
git commit -m "feat: add product detail page with variant management"
```

---

## Task 7: Navigasi ke settings & verifikasi manual

**Files:**
- Modify: `app/(internal)/layout.tsx`

- [ ] **Step 1: Tambah link navigasi di header layout**

Di `app/(internal)/layout.tsx`, tambahkan link ke `/pos` dan `/settings/menu` di dalam header (sebelum form logout). Contoh nav:

```tsx
<nav className="flex gap-4 text-sm">
  <a href="/pos" className="hover:underline">Kasir</a>
  <a href="/settings/menu" className="hover:underline">Menu</a>
</nav>
```

Sisipkan `<nav>` di antara `<span>` judul dan `<form action={logout}>`. Pastikan struktur header tetap valid (gunakan flex/gap yang ada).

- [ ] **Step 2: Verifikasi build & test**

Run: `npm run build`
Expected: sukses.
Run: `npm test`
Expected: semua test lulus.

- [ ] **Step 3: Verifikasi manual**

Jalankan `npm run dev`, login, buka `/settings/menu`. Tambah produk (mis. "Ayam Goreng", kategori "Ayam", harga 12000). Pastikan muncul di tabel. Klik "Kelola", tambah varian (mis. "Level Pedas", tipe option). Pastikan varian muncul. Verifikasi data tersimpan di Supabase Table Editor.

- [ ] **Step 4: Commit**

```bash
git add "app/(internal)/layout.tsx"
git commit -m "feat: add settings navigation"
```

---

## Catatan Penyelesaian

Setelah Plan 1 selesai: owner bisa kelola menu (produk satuan, paket, varian/topping) lewat UI. Data tersimpan di Supabase dengan RLS. Lanjut ke Plan 2 (Stok & Resep) yang akan mengaitkan produk ke bahan baku.

CATATAN: pengelolaan isi paket combo (`combo_items`) bisa ditambahkan di Plan 1 lanjutan atau saat Plan 3 (kasir) bila diperlukan. Untuk YAGNI, fokus varian dulu; combo_items diisi saat kasir benar-benar butuh memecah paket.
