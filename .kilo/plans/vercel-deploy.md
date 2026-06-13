# Deploy ke Vercel

## Prasyarat

- GitHub repository sudah terhubung ke Vercel
- Project Supabase sudah siap
- Environment variables sudah disalin dari `.env.local`
- Node.js versi terbaru sudah tersedia lokal untuk testing

## Environment Variables

Tambahkan variabel berikut di Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Jika aplikasi memakai provider lain atau webhook, tambahkan juga variabel yang relevan sesuai `.env.local`.

## Langkah Deploy

1. Buka dashboard Vercel
2. Pilih project `ridhoapp`
3. Masuk ke **Settings → Environment Variables**
4. Tambahkan semua environment variables yang dibutuhkan
5. Simpan perubahan
6. Masuk ke **Deployments**
7. Klik **Redeploy** pada deployment terbaru
8. Pastikan centang **Use existing Build Cache** jika ingin deploy lebih cepat

## Build Command

Vercel otomatis mendeteksi Next.js. Jika perlu set manual:

```bash
npm run build
```

## Install Command

```bash
npm install
```

## Output Directory

Biarkan default Next.js.

## Catatan Penting

- Pastikan Supabase URL dan key sesuai environment production
- Jika ada perubahan schema, jalankan migration Supabase sebelum redeploy
- Setelah deploy, cek halaman login dan dashboard internal
- Jika muncul error build, cek log deployment di Vercel

## Rollback

Jika deploy bermasalah:

1. Buka **Deployments**
2. Pilih deployment sebelumnya yang stabil
3. Klik **Promote to Production**

## Checklist Setelah Deploy

- [ ] Login berhasil
- [ ] Dashboard terbuka
- [ ] Menu CRUD berfungsi
- [ ] Inventory CRUD berfungsi
- [ ] POS masih bisa transaksi
- [ ] Finance masih bisa input data
- [ ] Environment variables sudah benar
