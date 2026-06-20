# Phase Plan: UI/UX dan Dashboard Reporting

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Menyelesaikan peningkatan UI/UX dan dashboard reporting secara berurutan: dashboard dulu, lalu POS, lalu inventory/shift.

**Architecture:** Pertahankan fondasi Sabana POS yang sudah ada. Fokus pada hierarki visual, konsistensi komponen, feedback state, dan metrik dashboard yang bisa dipakai untuk keputusan harian.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, TypeScript, Supabase.

**Referensi spec:** `docs/superpowers/specs/2026-06-20-uiux-dashboard-spec.md`

---

## Urutan Fase

1. Dashboard reporting dan insight cards.
2. POS / kasir polish.
3. Inventory dan shift clarity.
4. Validasi dan penajaman metrik lanjutan.

---

## Fase 1: Dashboard Reporting

**Target:** Dashboard lebih action-oriented, bukan sekadar kumpulan angka.

### Task 1: Rapikan hierarki KPI

**Files:**

- Modify: `app/(internal)/dashboard/page.tsx`
- Modify: `components/ui/stat-card.tsx`
- Modify: `components/ui/page-header.tsx` jika diperlukan

- [ ] Buat urutan KPI yang lebih tegas: omzet, transaksi, average order value, item per transaksi.
- [ ] Tambahkan visual emphasis untuk metrik yang berubah tajam dibanding periode sebelumnya.
- [ ] Pastikan kartu utama tetap bersih di layar tablet dan desktop.

### Task 2: Tambah insight cards operasional

**Files:**

- Modify: `app/(internal)/dashboard/page.tsx`
- Modify: `lib/domain/report.ts`
- Modify: `lib/data/dashboard.ts` bila perlu

- [ ] Tampilkan jam puncak, hari terbaik, top product, dan kategori dominan sebagai insight cepat.
- [ ] Tambahkan state kosong jika data belum cukup.
- [ ] Tambahkan indikator warna yang membedakan kondisi normal, kuat, dan lemah.

### Task 3: Validasi metrik inti

**Files:**

- Modify: `lib/domain/report.ts`
- Modify: `lib/data/dashboard.ts`

- [ ] Pastikan metrik inti yang sudah ada tetap konsisten dan akurat.
- [ ] Siapkan daftar metrik lanjutan yang belum bisa dihitung untuk fase berikutnya.
- [ ] Dokumentasikan gap data yang masih dibutuhkan untuk margin, void rate, dan shift variance.

---

## Fase 2: POS / Kasir Polish

**Target:** Alur kasir lebih cepat dipindai, lebih enak dipakai, dan lebih minim gesekan.

### Task 1: Pertegas layout operasional

**Files:**

- Modify: `app/(internal)/pos/*`
- Modify: `components/ui/*` bila perlu

- [ ] Pastikan katalog produk dan keranjang punya prioritas visual yang jelas.
- [ ] Perkuat ukuran tombol utama dan jarak antar elemen.
- [ ] Buat panel keranjang lebih mudah dibaca saat transaksi ramai.

### Task 2: Perjelas feedback interaksi

**Files:**

- Modify: `components/ui/toast.tsx`
- Modify: `components/ui/dialog.tsx`
- Modify: `app/(internal)/pos/*`

- [ ] Gunakan toast untuk sukses/gagal, bukan alert browser.
- [ ] Gunakan dialog yang jelas untuk konfirmasi void, perubahan, dan tindakan berisiko.
- [ ] Pastikan loading state dan error state tampil konsisten.

### Task 3: Tingkatkan pemindaian produk

**Files:**

- Modify: `app/(internal)/pos/*`
- Modify: `components/ui/card.tsx`

- [ ] Buat kartu produk lebih cepat dipindai lewat ukuran, gambar, dan harga.
- [ ] Tampilkan state stok atau ketersediaan jika datanya tersedia.
- [ ] Pertahankan layout yang nyaman untuk tablet.

---

## Fase 3: Inventory dan Shift

**Target:** Layar operasional lebih jelas, terutama untuk status kritis dan keputusan cepat.

### Task 1: Inventory clarity

**Files:**

- Modify: `app/(internal)/inventory/*`
- Modify: `components/ui/badge.tsx`

- [ ] Tambahkan penekanan visual untuk low stock, fast moving, dan dead stock.
- [ ] Buat informasi yang paling penting tampil dulu.
- [ ] Kurangi rasa administratif pada layar yang sering dipakai harian.

### Task 2: Shift reconciliation clarity

**Files:**

- Modify: `app/(internal)/finance/*`
- Modify: `lib/domain/shift.ts`

- [ ] Tampilkan expected vs actual cash secara lebih tegas.
- [ ] Perlihatkan selisih dan status review dengan jelas.
- [ ] Pastikan ringkasan shift cepat dipindai tanpa kehilangan detail audit.

---

## Fase 4: Metrik Lanjutan

**Target:** Siapkan fondasi untuk margin, void analytics, inventory health, dan customer repeat behavior.

### Task 1: Definisikan gap data

**Files:**

- Modify: `docs/superpowers/specs/2026-06-20-uiux-dashboard-spec.md`
- Modify: `supabase/migrations/*` bila diperlukan

- [ ] Catat data apa yang belum tersedia untuk gross margin, void rate, settlement latency, dan repeat purchase.
- [ ] Tandai metrik yang bisa dihitung sekarang versus yang butuh skema baru.

### Task 2: Prioritaskan metrik tambahan

**Files:**

- Modify: `app/(internal)/dashboard/page.tsx`
- Modify: `lib/data/dashboard.ts`

- [ ] Prioritaskan gross margin, void rate, low stock, expected vs actual cash, dan aging piutang.
- [ ] Tunda metrik customer-level sampai identitas customer memang tersedia.

---

## Non-Goals

- Tidak mengubah seluruh data model dalam satu putaran.
- Tidak menambah fitur analitik yang belum punya sumber data jelas.
- Tidak memaksa redesign besar-besaran di luar area yang sudah diprioritaskan.

## Definition of Done

- Dashboard punya hierarki KPI dan insight yang jelas.
- POS terasa lebih cepat dipakai dan lebih enak dipindai.
- Inventory dan shift menunjukkan status kritis tanpa perlu membaca banyak teks.
- Daftar metrik lanjutan terdokumentasi dan dipisahkan dari metrik yang sudah bisa dikerjakan sekarang.
