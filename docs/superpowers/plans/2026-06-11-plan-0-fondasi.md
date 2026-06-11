# Plan 0: Fondasi POS Fried Chicken - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyiapkan fondasi proyek: Next.js PWA, koneksi Supabase, autentikasi login, skema database inti + RLS, dan struktur folder, sehingga aplikasi bisa login dan database siap untuk fitur berikutnya.

**Architecture:** Next.js (App Router) sebagai PWA, dengan Supabase sebagai backend (Postgres + Auth + RLS). Route dibagi jadi grup `(internal)` terproteksi dan `(public)` untuk Fase 3. Logika domain dipisah di `/lib/domain`. Autentikasi memakai Supabase Auth dengan middleware proteksi route.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Supabase (supabase-js + @supabase/ssr), Tailwind CSS, Vitest untuk unit test, Playwright opsional nanti.

**Referensi spec:** `docs/superpowers/specs/2026-06-11-pos-fried-chicken-design.md`

---

## File Structure (Plan 0)

File yang dibuat di plan ini:

- `package.json`, `tsconfig.json`, `next.config.ts`, `.env.local.example` - konfigurasi proyek
- `app/layout.tsx`, `app/page.tsx` - root layout & landing
- `app/(internal)/layout.tsx` - layout terproteksi (cek auth)
- `app/(internal)/pos/page.tsx` - placeholder halaman kasir
- `app/login/page.tsx` - halaman login
- `lib/supabase/client.ts` - Supabase browser client
- `lib/supabase/server.ts` - Supabase server client (SSR)
- `lib/supabase/middleware.ts` - helper refresh session
- `middleware.ts` - proteksi route internal
- `lib/domain/auth.ts` - helper auth domain
- `supabase/migrations/0001_core_schema.sql` - skema DB inti + RLS
- `public/manifest.json`, ikon PWA - konfigurasi PWA
- `vitest.config.ts`, `tests/setup.ts` - konfigurasi test

---

## Task 1: Inisialisasi proyek Next.js + TypeScript

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Scaffold Next.js**

Run (dari `D:\ridhoapp`):
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm --eslint --yes
```
Expected: proyek Next.js terbuat di direktori saat ini. Jika ada konflik dengan folder `docs/`, jawab agar tetap melanjutkan (create-next-app mengizinkan folder non-konflik).

- [ ] **Step 2: Verifikasi dev server jalan**

Run:
```bash
npm run dev
```
Expected: server jalan di `http://localhost:3000`, tampil halaman default Next.js. Hentikan dengan Ctrl+C setelah verifikasi.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js pwa project"
```

---

## Task 2: Pasang dependency Supabase & testing

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Supabase & Vitest**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```
Expected: dependency tertambah di `package.json`, tidak ada error.

- [ ] **Step 2: Tambah script test di package.json**

Modify `package.json`, tambahkan ke bagian `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase and vitest dependencies"
```

---

## Task 3: Konfigurasi Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `tests/sanity.test.ts`

- [ ] **Step 1: Buat vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
})
```

- [ ] **Step 2: Buat tests/setup.ts**

```typescript
import "@testing-library/jest-dom"
```

- [ ] **Step 3: Buat tes sanity tests/sanity.test.ts**

```typescript
import { describe, it, expect } from "vitest"

describe("sanity", () => {
  it("runs the test runner", () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run:
```bash
npm test
```
Expected: PASS, 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts tests/sanity.test.ts
git commit -m "test: configure vitest test runner"
```

---

## Task 4: Konfigurasi environment variables

**Files:**
- Create: `.env.local.example`, `.env.local`
- Modify: `.gitignore`

- [ ] **Step 1: Buat .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 2: Buat .env.local dengan kredensial Supabase asli**

Salin `.env.local.example` ke `.env.local` dan isi dengan nilai dari dashboard Supabase (Project Settings > API). CATATAN: pengguna harus sudah membuat project Supabase. Jika belum, hentikan dan minta pengguna membuatnya di https://supabase.com.

- [ ] **Step 3: Pastikan .env.local diabaikan git**

Verifikasi `.gitignore` mengandung baris `.env*.local` (create-next-app menambahkannya secara default). Jika tidak ada, tambahkan:
```
.env*.local
```

- [ ] **Step 4: Commit**

```bash
git add .env.local.example .gitignore
git commit -m "chore: add environment variable template"
```

---

## Task 5: Buat Supabase client (browser & server)

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`

- [ ] **Step 1: Buat lib/supabase/client.ts (browser client)**

```typescript
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 2: Buat lib/supabase/server.ts (server client)**

```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // dipanggil dari Server Component; aman diabaikan jika ada middleware
          }
        },
      },
    },
  )
}
```

- [ ] **Step 3: Buat lib/supabase/middleware.ts (refresh session)**

```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isInternal =
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/_next") &&
    request.nextUrl.pathname !== "/"

  if (!user && isInternal) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase
git commit -m "feat: add supabase browser and server clients"
```

---

## Task 6: Buat middleware proteksi route

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Buat middleware.ts**

```typescript
import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add route protection middleware"
```

---

## Task 7: Skema database inti - tabel profiles & enum

**Files:**
- Create: `supabase/migrations/0001_core_schema.sql`

- [ ] **Step 1: Buat file migration dengan extension & profiles**

Buat `supabase/migrations/0001_core_schema.sql` dengan isi awal:

```sql
-- Extension untuk UUID
create extension if not exists "pgcrypto";

-- Profiles: ekstensi auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- User terautentikasi boleh baca semua profil
create policy "authenticated can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- User boleh update profilnya sendiri
create policy "user can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trigger: buat profile otomatis saat user baru daftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0001_core_schema.sql
git commit -m "feat: add profiles table and auth trigger"
```

---

## Task 8: Skema database inti - helper auth & tabel produk

**Files:**
- Modify: `supabase/migrations/0001_core_schema.sql`

- [ ] **Step 1: Tambahkan helper function & tabel products ke migration**

Tambahkan di akhir `supabase/migrations/0001_core_schema.sql`:

```sql
-- Helper: cek apakah pemanggil adalah staff internal aktif
create or replace function public.is_internal_user()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- Produk
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'single' check (type in ('single','combo')),
  base_price numeric(12,2) not null default 0,
  category text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Varian / topping
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  is_required boolean not null default false,
  price_delta numeric(12,2) not null default 0,
  type text not null default 'option' check (type in ('option','addon')),
  is_active boolean not null default true
);

-- Isi paket combo
create table public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_product_id uuid not null references public.products(id) on delete cascade,
  child_product_id uuid not null references public.products(id) on delete restrict,
  qty integer not null default 1 check (qty > 0)
);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.combo_items enable row level security;

create policy "internal full access products"
  on public.products for all
  to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

create policy "internal full access variants"
  on public.product_variants for all
  to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

create policy "internal full access combo_items"
  on public.combo_items for all
  to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0001_core_schema.sql
git commit -m "feat: add products, variants, combo tables with RLS"
```

---

## Task 9: Terapkan migration ke Supabase

**Files:** (tidak ada file baru; eksekusi terhadap DB)

- [ ] **Step 1: Jalankan SQL di Supabase**

Buka Supabase Dashboard > SQL Editor, tempel isi `supabase/migrations/0001_core_schema.sql`, jalankan. Expected: "Success. No rows returned." Tidak ada error.

ALTERNATIF (jika Supabase CLI terpasang & project ter-link): `supabase db push`.

- [ ] **Step 2: Verifikasi tabel terbuat**

Di Supabase Dashboard > Table Editor, pastikan tabel `profiles`, `products`, `product_variants`, `combo_items` muncul dan RLS aktif (ikon perisai).

- [ ] **Step 3: Buat satu user internal awal**

Di Supabase Dashboard > Authentication > Users > Add user, buat user dengan email & password (mis. owner). Trigger akan otomatis membuat baris di `profiles`. Verifikasi di Table Editor `profiles` ada baris untuk user tsb dengan `is_active = true`.

---

## Task 10: Halaman login

**Files:**
- Create: `app/login/page.tsx`, `lib/domain/auth.ts`, `app/login/actions.ts`

- [ ] **Step 1: Buat server action login di app/login/actions.ts**

```typescript
"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect("/login?error=" + encodeURIComponent("Email atau password salah"))
  }

  redirect("/pos")
}
```

- [ ] **Step 2: Buat halaman login app/login/page.tsx**

```tsx
import { login } from "./actions"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-xl border p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Masuk Kasir</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-black px-3 py-2 text-white"
        >
          Masuk
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: Buat helper logout di lib/domain/auth.ts**

```typescript
"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
```

- [ ] **Step 4: Commit**

```bash
git add app/login lib/domain/auth.ts
git commit -m "feat: add login page and auth actions"
```

---

## Task 11: Layout internal terproteksi & placeholder kasir

**Files:**
- Create: `app/(internal)/layout.tsx`, `app/(internal)/pos/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Buat layout terproteksi app/(internal)/layout.tsx**

```tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/lib/domain/auth"

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">POS Fried Chicken</span>
        <form action={logout}>
          <button className="text-sm text-gray-600 underline">Keluar</button>
        </form>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Buat placeholder kasir app/(internal)/pos/page.tsx**

```tsx
export default function PosPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold">Kasir</h1>
      <p className="text-gray-600">Halaman kasir akan diisi di Plan 3.</p>
    </div>
  )
}
```

- [ ] **Step 3: Ubah app/page.tsx jadi redirect ke /pos**

```tsx
import { redirect } from "next/navigation"

export default function Home() {
  redirect("/pos")
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(internal)" app/page.tsx
git commit -m "feat: add protected internal layout and cashier placeholder"
```

---

## Task 12: Konfigurasi PWA

**Files:**
- Create: `public/manifest.json`, `public/icon-192.png`, `public/icon-512.png`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Buat public/manifest.json**

```json
{
  "name": "POS Fried Chicken",
  "short_name": "POS Ayam",
  "description": "Aplikasi kasir untuk usaha fried chicken",
  "start_url": "/pos",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "any",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Sediakan ikon PWA**

Tempatkan dua file PNG di `public/`: `icon-192.png` (192x192) dan `icon-512.png` (512x512). Sementara boleh pakai placeholder polos berwarna. Jika tidak ada alat membuat gambar, buat PNG solid sederhana menggunakan tool apa pun yang tersedia, atau salin logo usaha.

- [ ] **Step 3: Tautkan manifest di app/layout.tsx**

Di `app/layout.tsx`, tambahkan ke objek `metadata` (atau buat jika belum ada):

```tsx
export const metadata = {
  title: "POS Fried Chicken",
  description: "Aplikasi kasir untuk usaha fried chicken",
  manifest: "/manifest.json",
}

export const viewport = {
  themeColor: "#000000",
}
```

- [ ] **Step 4: Commit**

```bash
git add public/manifest.json public/icon-192.png public/icon-512.png app/layout.tsx
git commit -m "feat: add pwa manifest and icons"
```

---

## Task 13: Verifikasi alur autentikasi end-to-end

**Files:** (tidak ada file baru)

- [ ] **Step 1: Build untuk memastikan tidak ada error kompilasi**

Run:
```bash
npm run build
```
Expected: build sukses tanpa error TypeScript/lint.

- [ ] **Step 2: Jalankan test**

Run:
```bash
npm test
```
Expected: PASS.

- [ ] **Step 3: Verifikasi manual proteksi route**

Run `npm run dev`. Buka `http://localhost:3000/pos` tanpa login. Expected: dialihkan ke `/login`. Login dengan user yang dibuat di Task 9. Expected: masuk ke `/pos`, header menampilkan tombol "Keluar". Klik "Keluar". Expected: kembali ke `/login`.

- [ ] **Step 4: Commit (jika ada perubahan kecil dari verifikasi)**

```bash
git add -A
git commit -m "chore: verify auth flow" --allow-empty
```

---

## Catatan Penyelesaian

Setelah Plan 0 selesai: aplikasi PWA bisa di-install, login berfungsi, route internal terproteksi, dan skema DB inti (profiles + produk + RLS) siap. Lanjut ke Plan 1 (Menu & Produk) untuk UI pengelolaan menu.
