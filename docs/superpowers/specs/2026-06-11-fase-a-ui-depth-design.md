# Fase A: Fondasi UI Depth - Design Spec

Tanggal: 2026-06-11
Status: Draft untuk review
Scope: Memperkaya tampilan ridhoapp dengan depth visual (shadow, rounded, ikon lucide, chip ikon KPI, feedback tekan) + mobile bottom-nav, mempertahankan palet krem Sabana. Murni presentasi, tanpa perubahan data/logic.

## Konteks & Tujuan

ridhoapp sudah fungsional dengan token Sabana (krem #FBF3E4 + merah #E11B22) tapi terasa "flat" — latar krem rata, tanpa bayangan/ikon, emoji sebagai ikon. Tujuan Fase A: meniru teknik depth dari project referensi sfcridho (yang tampil lebih hidup) sambil tetap pakai identitas krem Sabana. Ini fase pertama dari roadmap parity menuju kesetaraan dengan sfcridho.

## Keputusan Desain (hasil brainstorm)

- Palet: tetap krem Sabana (#FBF3E4) + merah #E11B22. Bukan putih/pink sfcridho.
- Dark mode: TIDAK di fase ini (fokus light mode).
- Ikon: pakai `lucide-react`, ganti semua emoji di navigasi/UI/tombol/KPI.
- Depth: terapkan paket lengkap — shadow + hover lift, rounded-2xl, chip ikon berwarna di KPI, active:scale pada elemen sentuh.

## Token Visual (tambahan)

Tambah ke `app/globals.css` `@theme` (warna tint lembut untuk chip ikon KPI):
```
--color-tint-red:   #FEECEC
--color-tint-green: #E9F8EF
--color-tint-amber: #FEF6E7
--color-tint-blue:  #EAF1FE
```
Menghasilkan util `bg-tint-red`, `bg-tint-green`, `bg-tint-amber`, `bg-tint-blue`.

Warna brand & netral yang sudah ada (brand, accent, surface, ink, ink-soft, success, danger, hairline) tetap.

## Prinsip Depth

- Bayangan: kartu default `shadow-sm`; kartu interaktif `hover:shadow-lg`.
- Sudut: kartu/panel naik ke `rounded-2xl`.
- Feedback tekan: `active:scale-[0.97]` pada kartu produk & tombol besar.
- Kontras: latar tetap krem; kartu PUTIH + border `border-hairline` + shadow → memberi kedalaman agar tidak rata.

## Dependency

- Tambah `lucide-react` (ikon, tree-shakeable). Tidak ada dependency lain.

## Komponen (upgrade yang sudah ada di components/ui/)

- **Card** (`components/ui/card.tsx`): `rounded-2xl`, `shadow-sm`, `border border-hairline`. Tambah prop opsional `interactive?: boolean` yang menambah `hover:shadow-lg active:scale-[0.97] transition cursor-pointer`.
- **Button** (`components/ui/button.tsx`): tambah prop opsional `icon?: LucideIcon` (render di kiri label), `rounded-xl`, shadow halus pada varian solid (`shadow-sm`), `active:scale-[0.97]`. Varian & ukuran tetap.
- **Badge** (`components/ui/badge.tsx`): tetap; izinkan children ikon kecil opsional (tanpa perubahan API wajib).

## Komponen baru

- **StatCard** (`components/ui/stat-card.tsx`): kartu KPI. Props: `label: string`, `value: string`, `icon: LucideIcon`, `tone: "red" | "green" | "amber" | "blue"`. Layout: chip ikon (ikon lucide dalam kotak `bg-tint-*` warna sesuai tone, ikon `text-*`), label uppercase kecil `text-ink-soft`, value `text-2xl font-bold` warna sesuai tone. Card putih `rounded-2xl shadow-sm border`.
- **IconButton** (`components/ui/icon-button.tsx`): tombol ikon-saja ramah sentuh (min 40-44px). Props: `icon: LucideIcon`, `label` (aria-label), `onClick`, `variant?` (default ghost/bordered). Dipakai untuk +/− qty & hapus di cart.

## App Shell

- **Sidebar** (`app/(internal)/sidebar.tsx`): ganti emoji jadi ikon lucide:
  - Kasir → ShoppingCart, Menu → UtensilsCrossed, Stok → Package, Shift → Receipt, Keuangan → Wallet, Keluar → LogOut, brand → Drumstick.
  - Item aktif disorot (highlight + indikator). Tetap collapsible (state localStorage). Tambah `shadow` tipis.
  - Deteksi rute aktif dengan `usePathname()`.
- **BottomNav baru** (`app/(internal)/bottom-nav.tsx`): muncul hanya di layar `< md` (HP), sidebar disembunyikan di `< md`. Berisi ikon+label menu utama: Kasir, Stok, Menu, Keuangan, Shift. Item aktif disorot merah. Fixed di bawah, aman dari area konten (padding bawah pada main).
- Layout internal (`app/(internal)/layout.tsx`): sidebar `hidden md:flex`, render `BottomNav` (yang `md:hidden`), beri `pb-16 md:pb-0` pada main agar konten tidak tertutup bottom-nav.

## Penerapan ke Layar

- **Kasir**: kartu produk pakai Card `interactive` + ikon kategori (lucide), tombol Tunai/QRIS dengan ikon (Banknote/QrCode), +/− qty pakai IconButton.
- **Keuangan**: 4 KPI → StatCard (Pemasukan→TrendingUp/green, Pengeluaran→Receipt/red, Laba Kotor→BarChart3/amber, Saldo/CapEx→Wallet/blue). Nilai & data tetap.
- **Stok / Menu / Shift**: tabel & form dalam Card ber-shadow `rounded-2xl`; tombol ber-ikon; badge status tetap.
- **Sidebar**: ikon lucide di semua layar.

Catatan: semua perubahan visual; props, state, nama field form, dan server action calls TIDAK berubah.

## Testing

- `npm run build` harus sukses.
- `npm test` harus tetap hijau (27 test, tidak ada test baru karena murni visual).
- Verifikasi manual: tablet (sidebar + grid + shadow), HP (bottom-nav muncul, sidebar hilang), hover lift di kartu produk, chip ikon KPI tampil.

## Non-Goals (Fase A)

- Dark mode.
- Perubahan fungsionalitas / data / skema.
- Fitur baru sfcridho (kasir addon, batch goreng, online order, dll) — itu Fase B-G.
- Upload gambar (tetap URL, sudah ada).
