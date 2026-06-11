# Desain Aplikasi POS Fried Chicken

Tanggal: 2026-06-11
Status: Draft untuk review
Scope: Fase 1 (POS Inti) + Fase 2 (Keuangan). Fase 3 (Online Order) ditunda, fondasi disiapkan.

## Ringkasan

Aplikasi Point of Sale (POS) untuk usaha fried chicken, berjalan sebagai PWA di tablet, dengan dukungan multi-perangkat (sync via Supabase). Mencakup kasir/transaksi, manajemen stok berbasis bahan baku + resep, manajemen drawer/shift kasir, dan modul keuangan (cashflow, OpEx/CapEx, laporan + dashboard grafik).

## Tujuan & Konteks

- Warung fried chicken, alur jualan cepat saji (kasir saja, tanpa meja/dapur display).
- Dipakai di tablet, butuh sync ke perangkat lain (mis. HP owner untuk lihat laporan).
- Belanja bahan mingguan dari supplier jauh, butuh proyeksi kebutuhan stok 7 hari.
- Owner butuh laporan keuangan & cashflow yang akurat (laba kotor, bukan disamakan dengan omset).

## Tech Stack

- Frontend: Next.js (App Router), dikemas sebagai PWA (installable, fullscreen, offline-capable).
- Backend/DB: Supabase — PostgreSQL, Auth, Realtime, Row Level Security (RLS).
- Hosting: Vercel.
- Offline: IndexedDB sebagai antrian transaksi lokal, sync otomatis saat online.

## Prinsip Arsitektur

1. Pemisahan route: route internal (POS, stok, keuangan) di balik login; route publik (Fase 3) terisolasi. Disiapkan via RLS sejak awal.
2. Offline-first untuk kasir: transaksi tetap jalan saat internet putus, masuk antrian, sync otomatis. ID transaksi berupa UUID dibuat di klien agar tidak dobel saat sync.
3. Modular per domain: kasir, stok, drawer, cashflow jadi modul terpisah dengan tanggung jawab jelas.

## Struktur Folder (garis besar)

```
/app
  /(internal)        -> route terproteksi
    /pos             -> kasir
    /shift           -> open/close drawer
    /inventory       -> stok & resep
    /finance         -> cashflow, laporan
    /settings        -> konversi, menu, harga
  /(public)          -> Fase 3 (disiapkan, belum diisi)
/lib
  /supabase          -> client & query
  /offline           -> antrian IndexedDB & sync
  /domain            -> logika bisnis (resep, stok, drawer, keuangan)
/components
```

## Model Data

### A. Menu & Produk

- `products`: id, name, type ('single' | 'combo'), base_price, category, is_active
- `product_variants`: id, product_id, name (mis. 'Level Pedas', 'Extra Saus'), is_required, price_delta, type ('option' | 'addon'), is_active
- `combo_items`: id, combo_product_id, child_product_id, qty

Catatan: varian punya `is_active` untuk hidup/mati tanpa menghapus data lama.

### B. Stok & Resep (jantung sistem)

- `ingredients`: id, name, tracking_type ('ingredient' | 'finished'), stock_qty, unit ('potong' | 'kg' | 'liter' | 'porsi'), low_stock_threshold
- `recipes`: id, product_id, effective_from, created_by, note
- `recipe_lines`: id, recipe_id, ingredient_id, qty_used
- `stock_movements`: id, ingredient_id, change_qty, reason ('sale' | 'purchase' | 'adjustment' | 'waste'), ref_id, created_at

Aturan:
- Saat jual, sistem memakai `recipe_lines` dari `recipes` aktif (effective_from terbaru <= tanggal jual), membuat `stock_movements` negatif per bahan.
- Edit konversi/resep = membuat versi `recipes` baru dengan `effective_from` baru. Transaksi lama tetap memakai versi lama (historis akurat).
- Contoh konversi awal (editable oleh owner): ayam beli per kantung (1 kantung = 9 potong); terigu per kg (1 kg untuk 3 kantung = 27 potong); minyak per pouch 2L (1 pouch untuk 10 kantung = 90 potong). Resep 1 porsi Ayam Goreng: ayam 1 potong, terigu ~0.037 kg, minyak ~0.022 L.

### C. Transaksi Penjualan

- `orders`: id (UUID dari klien), shift_id, total, payment_method ('cash' | 'qris'), source ('cashier' | 'gofood' | 'grab' | 'shopee'), status ('completed' | 'voided'), created_at
- `order_items`: id, order_id, product_id, qty, unit_price, subtotal
- `order_item_variants`: id, order_item_id, variant_id, price_delta
- `order_edits`: id, order_id, edited_by, edited_at, reason, before_snapshot, after_snapshot

Edit/void transaksi: efek lama dibalik (stok dikembalikan, drawer/cashflow dikoreksi via entri koreksi, bukan hapus), lalu efek baru diterapkan. Alasan wajib. Semua tercatat di `order_edits`.

### D. Drawer / Shift Kasir

- `shifts`: id, opened_by, opened_at, closed_by, closed_at, opening_balance, expected_cash, counted_cash, cash_difference, owner_withdrawal, closing_balance, qris_total, status ('open' | 'closed')
- `cash_drawer_movements`: id, shift_id, direction ('in' | 'out'), amount, reason, category_id, created_by, created_at

Aturan:
- Open: opening_balance otomatis dari closing_balance shift sebelumnya; kasir konfirmasi.
- Cash out operasional (mis. beli gas) -> cash_drawer_movements + entri cashflow OpEx otomatis.
- Close: expected_cash = opening_balance + penjualan tunai - cash out; kasir input counted_cash; cash_difference = counted - expected (selalu tercatat, tidak diblokir); owner_withdrawal + qris_total masuk cashflow sebagai income; closing_balance jadi saldo awal besok.
- Cegah double-open shift di perangkat lain via cek realtime.

### E. Cashflow (CapEx, OpEx, arus non-penjualan)

- `cashflow_categories`: id, name, kind ('income' | 'opex' | 'capex' | 'capital' | 'withdrawal'), is_system
- `cashflow_entries`: id, entry_date, direction ('in' | 'out'), amount, category_id, kind, source ('sale' | 'drawer' | 'manual'), ref_id, created_by, note, created_at

Otomatis masuk cashflow_entries:
- Penjualan tunai (total shift) + QRIS (total shift) -> kind 'income', dibuat saat shift ditutup, ref_id = shift_id. Income diakui dari TOTAL PENJUALAN, bukan dari `owner_withdrawal`.
- Cash out drawer operasional -> kind 'opex'.
- Input manual owner -> OpEx besar, CapEx, suntik modal ('capital'), tarik dana ('withdrawal').

Catatan: `owner_withdrawal` di tabel `shifts` adalah pergerakan kas dari drawer ke owner pribadi (bukan income), tercatat sebagai info shift dan dapat dilaporkan terpisah sebagai "tarikan owner kumulatif". Saldo yang ditinggalkan (`closing_balance`) jadi modal kembalian untuk shift berikutnya, tidak mempengaruhi pengakuan income.

Definisi: input campuran (opsi C). Pengeluaran kecil dari drawer dicatat kasir (otomatis OpEx); CapEx & modal besar diinput owner terpisah.

Laba kotor harian = total income - total opex. CapEx, capital, withdrawal memengaruhi saldo kas tapi terpisah dari hitungan laba operasional.

### F. Auth & User

- `profiles`: id (= auth.uid), name, role ('staff'), is_active

Fase 1: satu peran (semua user internal akses penuh), dilindungi login Supabase Auth. Kolom `role` + RLS disiapkan agar multi-peran dan route publik (Fase 3) mudah ditambah tanpa migrasi besar.

## Alur Fitur Utama

### 1. Kasir (transaksi)

Pilih produk -> (jika ada varian) pilih level pedas/topping -> masuk keranjang -> ulangi -> checkout -> pilih bayar (Tunai/QRIS) -> konfirmasi. Saat konfirmasi: buat order + order_items + variants; kurangi stok via recipe_lines aktif (stock_movements); jika tunai tambah ke drawer, jika QRIS tambah qris_total shift; tampilkan/cetak struk.

Offline: transaksi masuk antrian IndexedDB, sync otomatis saat online, stok di-reconcile saat sync. Edit/void tersedia dengan alasan wajib (lihat order_edits).

### 2. Shift / Drawer

- OPEN: tampil saldo awal (dari closing kemarin), kasir konfirmasi, shift jadi 'open'.
- SELAMA: penjualan tunai nambah drawer otomatis; cash out (beli gas dll) input nominal + alasan -> jadi OpEx.
- CLOSE: sistem hitung expected_cash; input counted_cash (hitung fisik) -> tampil selisih; input owner_withdrawal -> sisanya jadi closing_balance besok; total penjualan tunai + qris_total shift masuk cashflow sebagai income (bukan owner_withdrawal).

### 3. Stok & Saran Belanja

- Lihat stok: daftar bahan + sisa + indikator menipis (<= threshold) + field rata-rata pemakaian harian (rolling 7/30 hari).
- Restock: input pembelian -> stock_movements (+) + cashflow OpEx.
- Adjustment: koreksi manual (rusak/waste) -> stock_movements + alasan.
- Saran belanja: hitung rata-rata pemakaian harian (dari stock_movements 'sale') -> proyeksi kebutuhan 7 hari -> rekomendasi jumlah beli per bahan dalam unit beli (kantung/kg/pouch).
- Edit konversi: ubah recipe_lines -> simpan sebagai recipe versi baru, berlaku untuk transaksi ke depan, historis tak berubah.

### 4. Keuangan (owner)

- Dashboard: ringkasan harian + grafik (lihat bagian Dashboard).
- Cashflow: buku besar, filter tanggal/kategori/kind.
- Input manual: OpEx besar / CapEx / suntik modal / tarik dana.
- Laporan: penjualan per periode/produk/metode bayar; pengeluaran per kategori; arus kas masuk/keluar.

## Dashboard & Grafik

Semua grafik bisa difilter rentang tanggal (hari ini / 7 hari / 30 hari / custom) dan dapat diekspor. Ditandai prioritas: [INTI] dibangun di awal, [LANJUTAN] menyusul.

### A. KPI Cards
- Omset hari ini (tunai vs QRIS terpisah) [INTI]
- Jumlah transaksi & rata-rata nilai per transaksi (avg basket) [INTI]
- Laba kotor hari ini [INTI]
- Saldo kas saat ini [INTI]

### B. Grafik Penjualan
- Tren penjualan (line/area): per jam hari ini, per hari (7/30 hari), per bulan [INTI]
- Jam sibuk (heatmap/bar per jam) [LANJUTAN]
- Penjualan per hari dalam seminggu (bar) [LANJUTAN]
- Metode bayar (donut): tunai vs QRIS [INTI]

### C. Grafik Produk
- Top produk terlaris (bar horizontal): by qty & by omset [INTI]
- Produk paling untung (bar): kontribusi laba kotor [LANJUTAN]
- Penjualan per kategori (donut/stacked) [LANJUTAN]
- Slow movers: produk jarang laku [LANJUTAN]

### D. Grafik Keuangan & Stok
- Cashflow in vs out (bar berpasangan per periode) [LANJUTAN]
- Breakdown pengeluaran (donut): OpEx per kategori, CapEx terpisah [LANJUTAN]
- Tren laba kotor (line) [LANJUTAN]
- Pemakaian bahan vs sisa stok (bar): proyeksi kapan habis [LANJUTAN]

### E. Operasional
- Selisih kas (cash difference) per shift [LANJUTAN]
- Penjualan per sumber (cashier vs GoFood vs Grab) [LANJUTAN]

## Error Handling & Edge Cases

- Stok minus: boleh jual tapi beri peringatan; tercatat untuk koreksi (warung tetap jalan).
- Double-open shift di perangkat lain: dicegah via cek realtime.
- Selisih kas: selalu tercatat, tidak diblokir.
- Konflik sync offline: transaksi pakai UUID dibuat di klien agar tidak dobel.
- Edit konversi resep: tidak mengubah transaksi lama (versioning by effective_from).
- Edit/void order: efek lama dibalik via entri koreksi, bukan hapus data; alasan wajib; tercatat di order_edits.

## Testing

- Unit test logika domain: konversi resep, hitung expected_cash, proyeksi belanja, kalkulasi laba kotor, rata-rata pemakaian harian.
- Integration test: alur jual -> stok berkurang -> cashflow terisi; edit order -> reversal benar.
- RLS test: data internal tidak bocor tanpa auth.

## Rencana Fase

- Fase 1 (POS Inti): kasir, menu (item + combo + varian), stok bahan baku + resep, drawer/shift, auth, multi-perangkat sync, offline.
- Fase 2 (Keuangan): cashflow OpEx/CapEx/modal, laporan, dashboard grafik (mulai dari item [INTI]).
- Fase 3 (ditunda): halaman pesan online publik + pencatatan manual order platform luar. Fondasi (RLS, kolom source, pemisahan route) sudah disiapkan.
