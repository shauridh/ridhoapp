# Menu Grid, Gambar Produk, dan POS Sidebar Plan

## Tujuan

Memperbaiki 3 hal yang dilaporkan user:

1. Gambar menu/produk tidak muncul setelah upload.
2. Halaman Kelola Menu menggunakan tampilan grid, bukan tabel.
3. Menu aksi POS seperti Tersimpan, Online, Riwayat, dan Kelola Shift ditempatkan di area sidebar/bottom navigation agar Kasir lebih rapi.

## Temuan Saat Ini

### 1. Gambar menu tidak muncul

File terkait:

- `app/(internal)/settings/menu/image-actions.ts`
- `app/(internal)/settings/menu/product-form.tsx`
- `app/(internal)/settings/menu/page.tsx`
- `supabase/migrations/0011_storage_product_images.sql`

Kemungkinan penyebab:

- Migration bucket `produk-images` belum dijalankan di Supabase production.
- Bucket belum public.
- Policy RLS Storage belum aktif untuk internal user.
- URL gambar sudah tersimpan di `products.image_url`, tetapi browser tidak bisa mengakses file karena bucket private.
- Jika bucket belum ada, upload akan gagal dengan error RLS.

Solusi yang direncanakan:

- Pastikan migration `0011_storage_product_images.sql` dijalankan di Supabase.
- Jika perlu, tambahkan fallback/debug UI pada ProductForm:
  - Tampilkan status upload
  - Tampilkan URL gambar setelah upload
  - Tampilkan error storage secara jelas
- Validasi bucket dan policy:
  - Bucket: `produk-images`
  - Public: `true`
  - Allowed MIME: JPG, PNG, WEBP, GIF
  - Max size: 5MB
  - Policy: internal authenticated user boleh upload/manage

### 2. Inputan menu dibuat grid

File terkait:

- `app/(internal)/settings/menu/page.tsx`
- `app/(internal)/settings/menu/product-row-actions.tsx`
- `app/(internal)/settings/menu/product-form.tsx`

Implementasi yang direncanakan:

- Ganti tabel produk di `MenuPage` dengan grid card.
- Setiap card produk menampilkan:
  - Gambar produk atau placeholder
  - Nama produk
  - Kategori
  - Badge tipe: Satuan/Paket
  - Harga
  - Badge status: Aktif/Nonaktif
  - Tombol Edit dan Hapus
- Grid responsif:
  - Mobile: 1 kolom
  - Tablet: 2 kolom
  - Desktop: 3-4 kolom
- Empty state tetap ditampilkan jika belum ada produk.

### 3. Menu aksi POS di sidebar bagian bawah

File terkait:

- `app/(internal)/pos/pos-client.tsx`
- `app/(internal)/sidebar.tsx`
- `app/(internal)/pos/held-orders.tsx`
- `app/(internal)/pos/online-orders.tsx`
- `app/(internal)/pos/shift-panel.tsx`

Status saat ini:

- Tersimpan, Online, Riwayat, Kelola Shift berada di header kanan POS page.
- Tersimpan, Online, dan Kelola Shift adalah panel/SlideOver yang dikontrol state lokal `PosClient`.
- Riwayat adalah link ke `/pos/history`.

Pertimbangan desain:

- Jika dipindahkan ke global sidebar (`app/(internal)/sidebar.tsx`), maka:
  - Riwayat mudah dipindahkan karena sudah berupa route.
  - Tersimpan, Online, dan Kelola Shift membutuhkan kontrol state dari `PosClient`, sehingga perlu mekanisme komunikasi dari sidebar ke POS page.
- Jika dibuat bottom action bar di area POS, maka:
  - Tidak perlu mengubah arsitektur global sidebar.
  - Lebih cepat dan lebih aman.
  - Tetap memenuhi kebutuhan UX: aksi POS tidak lagi menumpuk di header.

Rekomendasi implementasi:

- Buat bottom action rail/bar khusus POS di `PosClient`, bukan global sidebar.
- Letakkan di bagian bawah area konten POS:
  - Tersimpan
  - Online
  - Riwayat
  - Kelola Shift
- Hapus tombol-tombol tersebut dari header kanan POS.
- Header kanan bisa hanya berisi notifikasi/search jika diperlukan, atau kosong.
- Untuk mobile, bottom bar tetap sticky di bawah area POS dan tidak menutupi cart floating button.

## Implementasi Teknis

### A. Fix gambar produk

1. Pastikan migration storage sudah diterapkan:
   - `supabase/migrations/0011_storage_product_images.sql`
2. Jika perlu, tambahkan migration tambahan untuk memperbaiki bucket jika sudah dibuat private:
   - Update `storage.buckets.public = true`
   - Drop/recreate policy storage.objects
3. Pada `ProductForm`, tambahkan helper visual:
   - Jika `imageUrl` ada, tampilkan preview lebih besar
   - Jika upload gagal, tampilkan pesan error
   - Jika upload berhasil, tampilkan status singkat

### B. Ubah Kelola Menu menjadi grid

Di `MenuPage`:

- Hapus render tabel.
- Buat grid:
  ```tsx
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
  ```
- Buat card:
  ```tsx
  <Card className="overflow-hidden">
    <div className="aspect-[4/3] bg-surface">...</div>
    <div className="space-y-3 p-4">...</div>
  </Card>
  ```
- Pindahkan `ProductRowActions` ke dalam card.
- Gunakan `ProductRowActions` yang sekarang berisi Edit/Hapus saja.

### C. Pindahkan aksi POS

Di `PosClient`:

- Hapus blok header buttons untuk:
  - Tersimpan
  - Online
  - Riwayat
  - Kelola Shift
- Tambahkan bottom action bar di bawah area product grid/cart:
  ```tsx
  <div className="sticky bottom-0 border-t border-hairline bg-white/95 p-3 backdrop-blur">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">...</div>
  </div>
  ```
- Riwayat bisa tetap berupa `Link`.
- Tersimpan/Online/Kelola Shift tetap memanggil `setPanel`.

## Validasi

### Local

- `npm run build`
- Cek halaman `/settings/menu`
- Cek upload gambar produk
- Cek gambar produk muncul di:
  - Kelola Menu
  - POS product grid
- Cek aksi POS:
  - Tersimpan membuka panel held orders
  - Online membuka panel online orders
  - Riwayat membuka `/pos/history`
  - Kelola Shift membuka shift panel

### Supabase

Pastikan migration dijalankan:

```bash
supabase migration up
```

Atau jalankan SQL migration di Supabase SQL Editor.

## Risiko

- Jika bucket `produk-images` sudah dibuat manual dengan konfigurasi berbeda, migration `on conflict` akan mengupdate konfigurasi bucket.
- Jika policy storage lama masih ada dengan nama berbeda, policy baru mungkin tidak menggantikan policy lama yang memblokir upload. Perlu cek manual di Supabase Storage Policies.
- Jika user ingin aksi POS benar-benar masuk ke global sidebar kiri, implementasi akan lebih kompleks karena perlu state sharing dari global sidebar ke POS page.

## Pertanyaan untuk User

Untuk poin 3, apakah yang dimaksud:

1. **Bottom bar khusus POS** di bagian bawah halaman Kasir, atau
2. **Sidebar global kiri bagian bawah** yang hanya muncul saat berada di halaman Kasir?

Rekomendasi saya: opsi 1 karena lebih cepat, stabil, dan tidak mengubah arsitektur global sidebar.
