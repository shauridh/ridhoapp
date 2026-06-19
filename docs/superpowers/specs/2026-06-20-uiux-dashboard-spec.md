# UI/UX dan Dashboard Reporting Roadmap

Tanggal: 2026-06-20
Status: Draft untuk review
Scope: Prioritas penyempurnaan UI/UX project Sabana POS dan matriks metrik yang layak ditampilkan di dashboard.

## Tujuan

Dokumen ini merangkum dua hal yang paling penting sebelum masuk coding:

1. Area UI/UX yang paling layak disempurnakan lebih dulu.
2. Metrik pelaporan apa saja yang sebaiknya tersedia di dashboard, dibagi antara yang sudah bisa dihitung dari data saat ini dan yang butuh perluasan data model.

## Konteks Saat Ini

- Aplikasi sudah punya pondasi fungsional yang kuat untuk POS, inventory, finance, order management, dan dashboard.
- Dashboard saat ini sudah menampilkan omzet, jumlah transaksi, rata-rata per transaksi, item per transaksi, top product, jam puncak, tren harian, kategori, dan komposisi metode pembayaran.
- Fokus terbesar berikutnya bukan menambah fitur acak, tetapi memperjelas alur kerja, hierarki visual, dan kualitas keputusan yang bisa diambil dari tampilan.

---

## 1. Prioritas Penyempurnaan UI/UX

### A. Prinsip desain yang harus dijaga

1. Cepat dipahami dalam 3 detik.
2. Aksi utama selalu paling menonjol.
3. Informasi operasional harus bisa dipindai, bukan dibaca pelan.
4. Feedback sistem harus konsisten di semua modul.
5. Desktop tablet-first, tetapi tetap aman untuk mobile.

### B. Area yang paling perlu ditingkatkan

#### 1) Dashboard

Masalah yang biasanya muncul:

- Terlalu banyak angka tanpa peta keputusan.
- Insight penting belum dibedakan dari sekadar statistik.
- Visual belum memberi prioritas mana yang harus ditindaklanjuti dulu.

Penyempurnaan yang disarankan:

- Buat lapisan hierarki yang jelas: KPI utama, insight operasional, lalu detail pendukung.
- Tambahkan state penekanan seperti "sedang turun", "puncak jam ramai", "stok kritis", atau "margin menipis".
- Sediakan switch periode yang lebih natural: hari ini, kemarin, 7 hari, 30 hari, bulan berjalan.
- Jadikan dashboard lebih action-oriented, misalnya kartu insight yang berujung ke halaman stok, order, atau shift.

#### 2) POS / Kasir

Masalah yang biasanya muncul:

- Keranjang dan katalog produk saling berebut perhatian.
- Tombol aksi terlalu kecil atau tidak konsisten.
- Variasi produk, ringkasan pembayaran, dan notifikasi belum cukup tegas.

Penyempurnaan yang disarankan:

- Perkuat layout dua kolom dengan keranjang sebagai panel yang selalu mudah diakses.
- Buat kartu produk lebih cepat dipindai dengan ukuran, gambar, harga, dan state stok yang jelas.
- Buat aksi utama lebih kontras: tunai, QRIS, simpan, void, cetak ulang.
- Gunakan feedback yang lebih informatif untuk sukses, error, dan validasi input.

#### 3) Inventory

Masalah yang biasanya muncul:

- Banyak layar inventory terasa administratif, bukan operasional.
- Selisih stok dan stok kritis sering kurang terlihat cepat.

Penyempurnaan yang disarankan:

- Tambahkan indikator prioritas: stok menipis, stock-out risk, dead stock, item fast moving.
- Ubah tampilan jadi lebih berorientasi tindakan, bukan cuma tabel.
- Tampilkan konteks konsumsi atau coverage days agar keputusan restock lebih cepat.

#### 4) Finance / Shift

Masalah yang biasanya muncul:

- Rekonsiliasi kas dan shift closure butuh kejelasan yang tinggi.
- User biasanya perlu membandingkan expected vs actual dengan cepat.

Penyempurnaan yang disarankan:

- Tampilkan selisih kas dengan penandaan visual yang jelas.
- Pisahkan status yang perlu di-review dari yang sudah aman.
- Gunakan ringkasan shift yang sangat padat, lalu detail di bawahnya.

#### 5) Order management

Masalah yang biasanya muncul:

- Banyak status order, tetapi prioritas penanganannya belum cukup jelas.
- History sering jadi tempat lihat data, bukan tempat ambil tindakan.

Penyempurnaan yang disarankan:

- Bedakan status operasional dengan warna dan aksi yang jelas.
- Tambahkan urutan kerja yang membantu user fokus ke order yang paling mendesak.
- Buat detail order lebih mudah dibaca untuk audit dan koreksi.

### C. Prioritas implementasi UI/UX

#### Fase 1: Fondasi visual dan interaksi

- Konsistensi spacing, radius, warna, dan typography.
- Feedback sistem: loading, empty, success, error.
- Tombol, badge, card, dialog, dan toast yang seragam.

#### Fase 2: Pola kerja operasional

- POS yang lebih jelas secara visual.
- Dashboard dengan hierarki informasi yang lebih kuat.
- Inventory dan shift dengan indikator prioritas.

#### Fase 3: Decision support

- Insight otomatis di dashboard.
- Trigger aksi dari laporan, misalnya restock, review margin, atau cek shift.
- Komparasi periode dan anomaly spotting.

---

## 2. Matriks Metrik untuk Dashboard

### A. Prinsip pemilihan metrik

- Harus ada makna bisnis, bukan sekadar angka cantik.
- Harus bisa dipakai untuk ambil keputusan harian.
- Idealnya bisa dibandingkan antar periode.
- Kalau belum bisa dihitung dari data sekarang, tandai sebagai metrik lanjutan.

### B. Matriks metrik inti yang layak ditampilkan sekarang

| Kategori  | Metrik                       | Kenapa penting             | Sumber data saat ini           | Catatan   |
| --------- | ---------------------------- | -------------------------- | ------------------------------ | --------- |
| Revenue   | Omzet total                  | KPI paling dasar           | orders.total                   | Sudah ada |
| Revenue   | Omzet per hari               | Lihat performa harian      | orders.created_at + total      | Sudah ada |
| Revenue   | Growth vs periode sebelumnya | Tahu naik/turun            | dashboard range comparison     | Sudah ada |
| Transaksi | Jumlah transaksi             | Mengukur traffic penjualan | orders                         | Sudah ada |
| Transaksi | Average order value          | Cek kualitas transaksi     | omzet / transaksi              | Sudah ada |
| Basket    | Item per transaksi           | Cek pola pembelian         | total item / transaksi         | Sudah ada |
| Waktu     | Jam puncak                   | Bantu penjadwalan kasir    | order time aggregation         | Sudah ada |
| Produk    | Top product by qty           | Produk terlaris            | order_items.product_name + qty | Sudah ada |
| Produk    | Top product by omzet         | Produk paling bernilai     | order_items.subtotal           | Sudah ada |
| Kategori  | Omzet per kategori           | Lihat kontribusi menu      | product category               | Sudah ada |
| Payment   | Komposisi cash vs QRIS       | Lihat perilaku bayar       | payment_method                 | Sudah ada |
| Hari      | Hari terbaik                 | Tahu hari paling kuat      | sales by date                  | Sudah ada |

### C. Metrik operasional yang sangat berguna berikutnya

| Kategori   | Metrik                       | Kenapa penting              | Kebutuhan data             | Prioritas                             |
| ---------- | ---------------------------- | --------------------------- | -------------------------- | ------------------------------------- |
| Margin     | Gross margin                 | Omzet saja tidak cukup      | COGS / recipe cost         | Tinggi                                |
| Margin     | Profit per product           | Tahu produk paling sehat    | recipe cost + price        | Tinggi                                |
| Margin     | Margin per category          | Arahkan promo/menu mix      | product cost mapping       | Tinggi                                |
| Inventory  | Low stock count              | Mencegah stock-out          | current stock + threshold  | Tinggi                                |
| Inventory  | Stock coverage days          | Tahu stok tahan berapa hari | average usage rate         | Tinggi                                |
| Inventory  | Fast moving items            | Restock prioritas           | consumption trend          | Sedang                                |
| Inventory  | Slow/dead stock              | Kurangi item lambat         | sales velocity             | Sedang                                |
| Inventory  | Shrinkage / selisih opname   | Cek kebocoran stok          | opname vs system stock     | Tinggi                                |
| Finance    | Expected cash vs actual cash | Validasi shift              | shift closure data         | Tinggi                                |
| Finance    | Cash variance                | Lihat selisih nominal       | expected vs counted        | Tinggi                                |
| Payment    | QRIS success rate            | Pantau gangguan pembayaran  | QRIS transaction logs      | Sedang                                |
| Payment    | Settlement latency           | Kas masuk cepat atau lambat | settlement timestamps      | Sedang                                |
| Order      | Void rate                    | Deteksi masalah operasional | voided orders              | Tinggi                                |
| Order      | Void reasons                 | Cari pola kegagalan         | void reason log            | Sedang                                |
| Order      | Order fulfillment time       | Kinerja operasional         | created_at -> completed_at | Sedang                                |
| Customer   | Repeat purchase rate         | Lihat loyalitas             | customer identity          | Rendah bila belum ada customer master |
| Receivable | Aging piutang                | Prioritas penagihan         | piutang due date           | Tinggi                                |
| Receivable | Collection rate              | Efektivitas penagihan       | paid vs outstanding        | Tinggi                                |

### D. Metrik lanjutan yang ideal untuk fase berikutnya

| Kategori   | Metrik                             | Nilai tambah                | Butuh perubahan                       |
| ---------- | ---------------------------------- | --------------------------- | ------------------------------------- |
| Customer   | New vs returning customer          | Baca loyalitas dan akuisisi | Ya, perlu identitas customer          |
| Customer   | Average visits per customer        | Ukur repeat behavior        | Ya                                    |
| Menu       | Attachment rate / add-on rate      | Lihat efektivitas upsell    | Ya, perlu struktur item add-on        |
| Menu       | Bundle performance                 | Evaluasi paket              | Ya, perlu label bundle                |
| Finance    | Net cashflow harian                | Lihat kesehatan kas         | Ya, lebih ideal jika cashflow lengkap |
| Operations | Throughput per shift               | Produktivitas shift         | Ya, perlu shift completion detail     |
| Operations | Time-to-open / time-to-close shift | Audit disiplin operasional  | Ya                                    |

### E. Struktur dashboard yang disarankan

1. KPI bar utama.
2. Insight cards yang menjawab "apa yang perlu saya perhatikan sekarang".
3. Grafik tren harian / mingguan.
4. Distribusi metode bayar.
5. Performa produk dan kategori.
6. Panel operasional: stok kritis, void, variance, piutang, dan shift warning.

### F. Rekomendasi prioritas metrik untuk tampilan awal

Jika dashboard ingin tetap bersih, urutan paling aman adalah:

1. Omzet total.
2. Jumlah transaksi.
3. Average order value.
4. Item per transaksi.
5. Jam puncak.
6. Top product.
7. Omzet per kategori.
8. Cash vs QRIS.
9. Void rate.
10. Expected vs actual cash.

## Dampak Data yang Perlu Disiapkan

Beberapa metrik di atas sudah bisa dihitung dari query dan domain logic yang ada. Namun untuk metrik yang lebih kuat, kita perlu memastikan data berikut tersedia dengan rapi:

- Cost per product atau recipe cost untuk margin.
- Timestamp lengkap untuk fulfillment dan settlement.
- Log void reason yang konsisten.
- Threshold stok per item atau per ingredient.
- Identitas customer untuk repeat purchase.
- Detail piutang lengkap, termasuk due date dan status pembayaran.

---

## Gap Data — Update 2026-06-20

Hasil evaluasi Fase 1 (dashboard dan metrik inti), berikut gap yang sudah dipetakan:

### Metrik yang SUDAH bisa dihitung sekarang

- Omzet total, transaksi, AOV, item per transaksi → `orders` + `order_items`
- Jam puncak, hari terbaik → aggregasi dari `orders.created_at`
- Top product by qty dan omzet → `order_items.product_name + qty + subtotal`
- Omzet per kategori → `order_items.products.category`
- Komposisi cash vs QRIS → `orders.payment_method`
- Low stock count dan stock-out count → `ingredients.stock_qty` vs `ingredients.low_stock_threshold`
- Stock coverage days → `ingredients.stock_qty` + rata-rata pemakaian dari `ingredient_usages`
- Expected vs actual cash per shift → `shift_closure` data via `shift-panel`
- Cash variance → selisih expected vs counted di shift closure
- Aging piutang → `piutang` tabel dengan due date

### Metrik yang BELUM bisa dihitung — butuh skema baru

| Metrik                  | Apa yang kurang                                                              | Prioritas |
| ----------------------- | ---------------------------------------------------------------------------- | --------- |
| Gross margin per produk | Tidak ada `cost_price` atau `recipe_cost` di `products`                      | Tinggi    |
| Void rate               | Tidak ada status/flag `voided` di `orders`, dan tidak ada `void_reason`      | Tinggi    |
| Order fulfillment time  | Tidak ada `completed_at` di `orders`, hanya `created_at`                     | Sedang    |
| QRIS settlement latency | Tidak ada `settled_at` timestamp                                             | Sedang    |
| Repeat purchase rate    | Tidak ada `customer_id` di `orders`                                          | Rendah    |
| Throughput per shift    | Tidak ada `order_count` atau link order ke shift yang eksplisit di ringkasan | Sedang    |

### Rekomendasi perluasan skema (fase berikutnya)

1. Tambah kolom `cost_price` (numeric, nullable) di tabel `products` — dasar untuk gross margin.
2. Tambah kolom `is_voided` (boolean) dan `void_reason` (text, nullable) di tabel `orders`.
3. Tambah kolom `completed_at` (timestamptz) di tabel `orders` untuk fulfillment time.
4. Tunda customer identity sampai ada kebutuhan bisnis yang jelas.

---

## Kesimpulan

Urutan yang paling masuk akal adalah:

1. Rapikan UI/UX fondasi supaya semua layar terasa satu sistem.
2. Perkuat dashboard dengan hierarki insight yang jelas.
3. Tambahkan metrik operasional yang langsung memicu tindakan.
4. Baru lanjut ke metrik lanjutan yang butuh perluasan data model.

Dengan urutan ini, dashboard tidak cuma jadi tempat lihat angka, tapi benar-benar jadi alat kontrol operasional harian.
