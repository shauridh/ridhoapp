-- =====================================================================
-- SEED DATA DUMMY - Sabana POS
-- Jalankan SETELAH semua migration (0001-0007) dan SETELAH membuat
-- minimal 1 user di Supabase Auth (karena order/shift butuh profile).
--
-- Aman dijalankan ulang: blok ini menghapus data dummy lama dulu.
-- TIDAK menghapus user/profile kamu.
-- =====================================================================

do $$
declare
  v_uid uuid;
  -- id produk
  p_ayam_dada uuid; p_ayam_paha uuid; p_ayam_sayap uuid; p_ayam_geprek uuid;
  p_nasi uuid; p_paket_a uuid; p_paket_b uuid;
  p_es_teh uuid; p_es_jeruk uuid; p_air uuid; p_kopi uuid;
  p_sambal uuid; p_kerupuk uuid;
  -- id bahan
  i_ayam uuid; i_beras uuid; i_tepung uuid; i_minyak uuid; i_cabai uuid; i_teh uuid; i_gula uuid;
  -- resep
  r_id uuid;
  -- shift / order loop
  v_shift uuid; v_order uuid;
  v_day int; v_n int; v_i int;
  v_when timestamptz; v_method text; v_total numeric; v_cash_sales numeric; v_qris_sales numeric;
  v_pid uuid; v_pname text; v_pprice numeric; v_qty int;
  v_prod_ids uuid[]; v_prod_names text[]; v_prod_prices numeric[]; v_pick int;
  v_open_bal numeric; v_counted numeric;
begin
  -- Ambil user pertama sebagai pembuat data.
  select id into v_uid from public.profiles order by created_at limit 1;
  if v_uid is null then
    raise exception 'Belum ada profile. Buat user dulu di Supabase Auth.';
  end if;

  -- ---------------------------------------------------------------
  -- Bersihkan data dummy lama (urut sesuai FK)
  -- ---------------------------------------------------------------
  delete from public.order_item_variants;
  delete from public.order_items;
  delete from public.order_edits;
  delete from public.orders;
  delete from public.cash_drawer_movements;
  delete from public.cashflow_entries where source in ('sale','drawer') or note like 'DUMMY%';
  delete from public.shifts;
  delete from public.stock_movements;
  delete from public.recipe_lines;
  delete from public.recipes;
  delete from public.product_variants;
  delete from public.combo_items;
  delete from public.products;
  delete from public.ingredients;
  delete from public.online_orders;
  delete from public.piutang;
  delete from public.opex;
  delete from public.akun;

  -- ---------------------------------------------------------------
  -- PRODUK
  -- ---------------------------------------------------------------
  insert into public.products (name, type, base_price, category) values
    ('Ayam Dada', 'single', 12000, 'Ayam') returning id into p_ayam_dada;
  insert into public.products (name, type, base_price, category) values
    ('Ayam Paha', 'single', 12000, 'Ayam') returning id into p_ayam_paha;
  insert into public.products (name, type, base_price, category) values
    ('Ayam Sayap', 'single', 9000, 'Ayam') returning id into p_ayam_sayap;
  insert into public.products (name, type, base_price, category) values
    ('Ayam Geprek', 'single', 15000, 'Ayam') returning id into p_ayam_geprek;
  insert into public.products (name, type, base_price, category) values
    ('Nasi Putih', 'single', 5000, 'Nasi') returning id into p_nasi;
  insert into public.products (name, type, base_price, category) values
    ('Es Teh', 'single', 4000, 'Minuman') returning id into p_es_teh;
  insert into public.products (name, type, base_price, category) values
    ('Es Jeruk', 'single', 5000, 'Minuman') returning id into p_es_jeruk;
  insert into public.products (name, type, base_price, category) values
    ('Air Mineral', 'single', 3000, 'Minuman') returning id into p_air;
  insert into public.products (name, type, base_price, category) values
    ('Kopi', 'single', 6000, 'Minuman') returning id into p_kopi;
  insert into public.products (name, type, base_price, category) values
    ('Sambal Extra', 'single', 2000, 'Tambahan') returning id into p_sambal;
  insert into public.products (name, type, base_price, category) values
    ('Kerupuk', 'single', 2000, 'Tambahan') returning id into p_kerupuk;
  insert into public.products (name, type, base_price, category) values
    ('Paket Hemat A (Ayam+Nasi+Es Teh)', 'combo', 18000, 'Paket') returning id into p_paket_a;
  insert into public.products (name, type, base_price, category) values
    ('Paket Geprek (Geprek+Nasi+Es Jeruk)', 'combo', 22000, 'Paket') returning id into p_paket_b;

  -- Varian untuk ayam geprek (level pedas - wajib pilih)
  insert into public.product_variants (product_id, name, is_required, price_delta, type) values
    (p_ayam_geprek, 'Level 1', true, 0, 'option'),
    (p_ayam_geprek, 'Level 3', true, 0, 'option'),
    (p_ayam_geprek, 'Level 5', true, 2000, 'option');

  -- Isi combo
  insert into public.combo_items (combo_product_id, child_product_id, qty) values
    (p_paket_a, p_ayam_dada, 1), (p_paket_a, p_nasi, 1), (p_paket_a, p_es_teh, 1),
    (p_paket_b, p_ayam_geprek, 1), (p_paket_b, p_nasi, 1), (p_paket_b, p_es_jeruk, 1);

  -- ---------------------------------------------------------------
  -- BAHAN BAKU
  -- ---------------------------------------------------------------
  insert into public.ingredients (name, stock_qty, unit, purchase_unit, purchase_unit_qty, low_stock_threshold) values
    ('Ayam Potong', 120, 'pcs', 'ekor', 9, 30) returning id into i_ayam;
  insert into public.ingredients (name, stock_qty, unit, purchase_unit, purchase_unit_qty, low_stock_threshold) values
    ('Beras', 50, 'kg', 'karung', 25, 10) returning id into i_beras;
  insert into public.ingredients (name, stock_qty, unit, purchase_unit, purchase_unit_qty, low_stock_threshold) values
    ('Tepung Bumbu', 30, 'kg', 'sak', 5, 8) returning id into i_tepung;
  insert into public.ingredients (name, stock_qty, unit, purchase_unit, purchase_unit_qty, low_stock_threshold) values
    ('Minyak Goreng', 40, 'liter', 'jerigen', 18, 10) returning id into i_minyak;
  insert into public.ingredients (name, stock_qty, unit, purchase_unit, purchase_unit_qty, low_stock_threshold) values
    ('Cabai', 8, 'kg', 'kg', 1, 3) returning id into i_cabai;
  insert into public.ingredients (name, stock_qty, unit, purchase_unit, purchase_unit_qty, low_stock_threshold) values
    ('Teh Celup', 200, 'pcs', 'box', 50, 40) returning id into i_teh;
  insert into public.ingredients (name, stock_qty, unit, purchase_unit, purchase_unit_qty, low_stock_threshold) values
    ('Gula', 25, 'kg', 'kg', 1, 5) returning id into i_gula;

  -- ---------------------------------------------------------------
  -- RESEP (contoh: Ayam Dada & Es Teh)
  -- ---------------------------------------------------------------
  insert into public.recipes (product_id, effective_from, created_by, note)
    values (p_ayam_dada, current_date - 60, v_uid, 'Resep ayam dada') returning id into r_id;
  insert into public.recipe_lines (recipe_id, ingredient_id, qty_used) values
    (r_id, i_ayam, 1), (r_id, i_tepung, 0.05), (r_id, i_minyak, 0.1);

  insert into public.recipes (product_id, effective_from, created_by, note)
    values (p_es_teh, current_date - 60, v_uid, 'Resep es teh') returning id into r_id;
  insert into public.recipe_lines (recipe_id, ingredient_id, qty_used) values
    (r_id, i_teh, 1), (r_id, i_gula, 0.02);

  -- ---------------------------------------------------------------
  -- AKUN, OPEX, PIUTANG
  -- ---------------------------------------------------------------
  insert into public.akun (nama, tipe, saldo_awal) values
    ('Kas Laci', 'kas_fisik', 500000),
    ('BCA Toko', 'bank', 5000000),
    ('GoPay', 'ewallet', 1200000);

  insert into public.opex (nama, nominal, frekuensi, jatuh_tempo) values
    ('Sewa Kios', 1500000, 'bulanan', 1),
    ('Listrik', 400000, 'bulanan', 20),
    ('Gaji Karyawan', 2000000, 'bulanan', 28),
    ('Gas LPG', 22000, 'harian', null);

  insert into public.piutang (pihak, nominal, tipe, keterangan, status, jatuh_tempo, tenor, bunga, cicilan) values
    ('Pelanggan Kantor X', 350000, 'piutang', 'Pesanan rapat belum bayar', 'belum', current_date + 7, null, null, null),
    ('Supplier Ayam', 1200000, 'hutang', 'Tempo bayar ayam', 'belum', current_date + 14, null, null, null),
    ('Koperasi', 6000000, 'hutang', 'Pinjaman alat', 'belum', current_date + 90, 6, 2, 1060000);

  -- ---------------------------------------------------------------
  -- ONLINE ORDERS (beberapa contoh)
  -- ---------------------------------------------------------------
  insert into public.online_orders (nama, phone, alamat, items, catatan, subtotal, ongkir, total, status, confirm_token, created_at) values
    ('Budi', '6281234567890', 'Jl. Mawar No. 5',
     jsonb_build_array(jsonb_build_object('name','Paket Hemat A','qty',2,'harga',18000)),
     'Pedas', 36000, 5000, 41000, 'pending', gen_random_uuid()::text, now() - interval '20 minutes'),
    ('Siti', '6285677788899', 'Jl. Melati No. 12',
     jsonb_build_array(jsonb_build_object('name','Ayam Geprek','qty',3,'harga',15000)),
     '', 45000, 5000, 50000, 'confirmed', gen_random_uuid()::text, now() - interval '1 hour'),
    ('Andi', '6287812345678', 'Perumahan Indah Blok C2',
     jsonb_build_array(jsonb_build_object('name','Paket Geprek','qty',1,'harga',22000)),
     'Tanpa sambal', 22000, 5000, 27000, 'done', gen_random_uuid()::text, now() - interval '3 hours');

  -- ---------------------------------------------------------------
  -- APP SETTINGS
  -- ---------------------------------------------------------------
  insert into public.app_settings (key, value) values
    ('store_name', 'Sabana Fried Chicken'),
    ('ongkir', '5000'),
    ('online_enabled', 'true'),
    ('owner_wa', ''),
    ('wa_report_enabled', 'false')
  on conflict (key) do update set value = excluded.value;

  -- ---------------------------------------------------------------
  -- TRANSAKSI HISTORIS 30 HARI + SHIFT HARIAN
  -- ---------------------------------------------------------------
  v_prod_ids := array[p_ayam_dada, p_ayam_paha, p_ayam_sayap, p_ayam_geprek, p_nasi, p_es_teh, p_es_jeruk, p_air, p_kopi, p_paket_a, p_paket_b];
  v_prod_names := array['Ayam Dada','Ayam Paha','Ayam Sayap','Ayam Geprek','Nasi Putih','Es Teh','Es Jeruk','Air Mineral','Kopi','Paket Hemat A','Paket Geprek'];
  v_prod_prices := array[12000,12000,9000,15000,5000,4000,5000,3000,6000,18000,22000];

  for v_day in reverse 29..0 loop
    v_open_bal := 300000;
    v_cash_sales := 0;
    v_qris_sales := 0;

    -- Buka shift jam 09:00 hari itu
    insert into public.shifts (opened_by, opened_at, opening_balance, status)
      values (v_uid, (current_date - v_day) + time '09:00', v_open_bal, 'open')
      returning id into v_shift;

    -- 15-45 transaksi per hari
    v_n := 15 + floor(random() * 30)::int;
    for v_i in 1..v_n loop
      -- jam ramai: 11-14 dan 18-20
      v_when := (current_date - v_day) + (time '10:00' + (floor(random()*11) || ' hours')::interval + (floor(random()*60) || ' minutes')::interval);
      v_method := case when random() < 0.6 then 'cash' else 'qris' end;
      v_total := 0;

      insert into public.orders (shift_id, total, payment_method, source, status, created_by, created_at)
        values (v_shift, 0, v_method, 'cashier', 'completed', v_uid, v_when)
        returning id into v_order;

      -- 1-3 item per order
      for v_pick in 1..(1 + floor(random()*3)::int) loop
        declare idx int := 1 + floor(random() * array_length(v_prod_ids,1))::int;
        begin
          v_pid := v_prod_ids[idx];
          v_pname := v_prod_names[idx];
          v_pprice := v_prod_prices[idx];
          v_qty := 1 + floor(random()*3)::int;
          insert into public.order_items (order_id, product_id, product_name, qty, unit_price, subtotal)
            values (v_order, v_pid, v_pname, v_qty, v_pprice, v_pprice * v_qty);
          v_total := v_total + v_pprice * v_qty;
        end;
      end loop;

      update public.orders set total = v_total where id = v_order;
      if v_method = 'cash' then v_cash_sales := v_cash_sales + v_total;
      else v_qris_sales := v_qris_sales + v_total; end if;
    end loop;

    -- Cash out kecil (beli es/gas) di sebagian hari
    if random() < 0.5 then
      insert into public.cash_drawer_movements (shift_id, direction, amount, reason, created_by, created_at)
        values (v_shift, 'out', 20000 + floor(random()*30000)::int, 'Beli es batu', v_uid, (current_date - v_day) + time '15:00');
    end if;

    -- Tutup shift (kecuali hari ini biar shift masih terbuka untuk dicoba)
    if v_day > 0 then
      v_counted := v_open_bal + v_cash_sales - 20000;
      update public.shifts set
        closed_by = v_uid,
        closed_at = (current_date - v_day) + time '21:30',
        expected_cash = v_open_bal + v_cash_sales,
        counted_cash = v_counted,
        cash_difference = v_counted - (v_open_bal + v_cash_sales),
        owner_withdrawal = v_cash_sales,
        closing_balance = v_counted - v_cash_sales,
        qris_total = v_qris_sales,
        status = 'closed'
      where id = v_shift;

      -- Catat pemasukan ke cashflow
      insert into public.cashflow_entries (entry_date, direction, amount, kind, source, ref_id, note, created_by)
        values (current_date - v_day, 'in', v_cash_sales + v_qris_sales, 'income', 'sale', v_shift, 'DUMMY penjualan harian', v_uid);
    end if;
  end loop;

  raise notice 'Seed selesai. User: %, total order dibuat untuk 30 hari.', v_uid;
end $$;
