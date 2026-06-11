# Desain UI/UX Sabana POS

Tanggal: 2026-06-11
Status: Draft untuk review
Scope: Sistem desain (design tokens + komponen) + penerapan penuh ke halaman Kasir. Layar lain (Shift, Stok, Keuangan, Menu) menyusul dengan komponen yang sama.

## Ringkasan

Memoles UI/UX aplikasi POS yang sudah fungsional menjadi tampilan bergaya brand Sabana (franchise fried chicken) yang nyaman dipakai di tablet. Putaran ini membangun fondasi sistem desain dan menerapkannya penuh ke halaman kasir sebagai acuan.

## Konteks

- Semua fitur Fase 1 & 2 sudah fungsional tapi UI masih mentah (tabel polos, tombol hitam-putih, `alert()`/`prompt()` bawaan browser).
- Pemilik adalah franchise Sabana dengan tone brand merah, krem, kuning.
- Perangkat utama: tablet. Akses sekunder: HP owner untuk laporan.

## Design Tokens

### Palet warna (pendekatan Sabana, dapat disesuaikan ke kode resmi nanti)

```
Merah (primary)      #E11B22   header bar, sidebar, tombol aksi utama, harga, brand
Merah gelap (hover)  #B31419   state hover/active tombol merah
Kuning (accent)      #FDB913   highlight, badge, tombol sekunder (QRIS)
Krem (surface)       #FBF3E4   background aplikasi
Putih                #FFFFFF   kartu, panel
Teks utama           #1F2937   semua teks utama
Teks sekunder        #6B7280   teks penjelas/meta
Sukses (hijau)       #16A34A   tombol tunai, status berhasil/toast sukses
Bahaya (merah-or)    #DC2626   error, void, stok menipis
Garis/border         #EADFC8   border kartu/elemen di atas krem
```

Token diterapkan via CSS variables di `app/globals.css` dan dipetakan ke util Tailwind (mis. `bg-brand`, `bg-accent`, `bg-surface`, `text-ink`). Semua warna teks WAJIB memakai token (`#1F2937`/`#6B7280`), bukan default abu Tailwind.

### Tipografi

- Font: **Plus Jakarta Sans**, dimuat via `next/font/google` di root layout (tanpa request eksternal runtime, optimal untuk PWA).
- Skala: angka penting (harga, total) berukuran besar agar terbaca sekilas saat sibuk.

### Bentuk, spasi, sentuh

- Sudut membulat (`rounded-lg`/`rounded-xl`).
- Kartu putih dengan bayangan halus di atas latar krem.
- Target sentuh minimal ~44px; tombol aksi kasir lebih besar.

## Komponen UI (components/ui/)

Komponen reusable bergaya Sabana, dipakai semua layar:

- **Button** — varian `primary` (merah), `secondary` (kuning), `ghost` (transparan/border), `danger`; ukuran `md` & `lg`; state `disabled` & `loading`.
- **Card** — panel putih, sudut membulat, bayangan halus, padding lega.
- **Modal** — dialog tengah + overlay gelap; untuk konfirmasi & input.
- **ConfirmDialog** & **PromptDialog** — berbasis Modal, mengembalikan Promise, menggantikan `confirm()`/`prompt()` (mis. alasan void).
- **Toast** — notifikasi melayang pojok, auto-hilang; varian `success`/`error`/`info`. Dikelola `ToastProvider` (React Context) di layout internal, dipanggil via hook `useToast()`. Menggantikan `alert()`.
- **Input** & **Select** — field konsisten: label, fokus ring merah, state error.
- **Badge** — status kecil (Aktif/Nonaktif, Menipis, Tunai/QRIS, PAKET).

## App Shell

- **Sidebar navigasi collapsible** (menggantikan header nav horizontal):
  - Latar merah Sabana, teks putih, item aktif disorot.
  - Bisa buka/tutup. Saat tertutup: ikon saja, area konten melebar.
  - Item: Kasir, Menu, Stok, Shift, Keuangan, Keluar.
  - State buka/tutup disimpan (localStorage) agar konsisten antar kunjungan.
- Konten utama berlatar krem, di kanan sidebar.
- Responsif: di layar sempit (HP) sidebar default tertutup/overlay.

## Halaman Kasir (penerapan acuan)

- **Layout dua kolom**: kiri grid produk, kanan panel keranjang menetap.
- **Filter kategori**: chip horizontal (Semua + kategori), chip aktif merah.
- **Kartu produk kotak (square)**: gambar (aspect-square) → nama → harga. Ukuran **responsif menyesuaikan device**.
- **Jumlah kolom grid dapat diatur**: kontrol segmented dengan pilihan tetap `Auto | 3 | 4 | 5`. "Auto" memakai CSS grid `repeat(auto-fill, minmax(140px, 1fr))` sehingga kolom menyesuaikan lebar layar otomatis; pilihan angka mengunci jumlah kolom (`repeat(N, 1fr)`). Preferensi disimpan di localStorage (key `pos.gridCols`), default `Auto`.
- **Gambar produk**: bersumber dari field gambar produk; bila kosong tampilkan placeholder (inisial/ikon ayam) di atas latar krem. (Catatan: kolom gambar produk perlu ditambahkan — lihat Dampak Data.)
- **Keranjang**: item dengan tombol qty besar (− / +), nama + varian, subtotal; total besar; tombol **Tunai** (hijau) & **QRIS** (kuning) lebar.
- **Variant picker**: pakai komponen Modal baru (bukan markup ad-hoc).
- **Struk**: pakai komponen Modal; tombol Tutup.
- **Notifikasi**: checkout berhasil/gagal pakai Toast (bukan `alert`).
- **Void** (riwayat): alasan via PromptDialog, konfirmasi via ConfirmDialog.

## Dampak Data (perubahan kecil skema)

- Tambah kolom `image_url text` (nullable) pada tabel `products` agar kartu bisa menampilkan gambar. Migration baru `0005_product_image.sql`. UI form menu mendapat field URL gambar (upload ke Supabase Storage opsional, di luar scope putaran ini — cukup URL dulu).
- Tidak ada perubahan data lain; ini murni lapisan presentasi.

## Pendekatan Penerapan

1. Pasang font + token + util Tailwind (fondasi).
2. Bangun komponen `components/ui/` (Button, Card, Modal, Confirm/Prompt, Toast, Input, Select, Badge).
3. Bangun App Shell (sidebar collapsible) di layout internal, pasang ToastProvider.
4. Terapkan ke halaman Kasir (grid responsif + kolom konfigurabel, keranjang, modal varian/struk, toast).
5. Tambah kolom gambar produk + field di form menu.
6. Layar lain (Shift, Stok, Keuangan, Menu) menyusul memakai komponen yang sama (putaran berikutnya).

## Testing

- Unit test logika murni baru bila ada (mis. util kolom grid). Komponen visual diverifikasi via build + tinjauan manual.
- Pastikan `npm run build` & `npm test` tetap hijau.
- Verifikasi tablet: tombol ramah sentuh, grid menyesuaikan, sidebar buka/tutup.

## Non-Goals (putaran ini)

- Upload gambar ke storage (cukup URL dulu).
- Dashboard grafik penjualan lengkap (putaran terpisah).
- Fase 3 (online order).
- Memoles seluruh layar sekaligus (fokus kasir; lainnya menyusul).
