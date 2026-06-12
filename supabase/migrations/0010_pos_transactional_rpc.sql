-- RPC transaksional untuk operasi POS yang menyangkut uang & stok.
-- Tujuan: atomik (semua-atau-tidak) + anti race condition.
-- Pengurangan stok pakai `stock_qty = stock_qty + delta` (atomik di level row),
-- bukan read-modify-write, sehingga aman saat transaksi bersamaan.

-- Helper: pilih recipe aktif (effective_from <= tanggal, terbaru) untuk produk.
create or replace function public._active_recipe_id(p_product uuid, p_date date)
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select id from public.recipes
  where product_id = p_product and effective_from <= p_date
  order by effective_from desc
  limit 1
$$;

-- =====================================================================
-- create_order: buat order + items + variants, kurangi stok via resep.
-- p_items: jsonb array of {productId, productName, qty, unitPrice,
--          variants:[{variantId, variantName, priceDelta}]}
-- Mengembalikan baris order yang dibuat.
-- =====================================================================
create or replace function public.create_order(
  p_total numeric,
  p_payment_method text,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_shift uuid;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_variant jsonb;
  v_oi_id uuid;
  v_today date := (now() at time zone 'utc')::date;
  v_recipe uuid;
  v_line record;
  v_qty integer;
  v_product uuid;
begin
  if v_uid is null then
    raise exception 'Tidak terautentikasi';
  end if;
  if not public.is_internal_user() then
    raise exception 'Akses ditolak';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;

  select id into v_shift from public.shifts where status = 'open' limit 1;

  insert into public.orders (shift_id, total, payment_method, source, status, created_by)
  values (v_shift, p_total, p_payment_method, 'cashier', 'completed', v_uid)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'qty')::int;
    v_product := (v_item->>'productId')::uuid;

    insert into public.order_items (order_id, product_id, product_name, qty, unit_price, subtotal)
    values (
      v_order.id,
      v_product,
      v_item->>'productName',
      v_qty,
      (v_item->>'unitPrice')::numeric,
      ((v_item->>'unitPrice')::numeric +
        coalesce((select sum((v->>'priceDelta')::numeric)
                  from jsonb_array_elements(v_item->'variants') v), 0)
      ) * v_qty
    )
    returning id into v_oi_id;

    for v_variant in select * from jsonb_array_elements(coalesce(v_item->'variants', '[]'::jsonb))
    loop
      insert into public.order_item_variants (order_item_id, variant_id, variant_name, price_delta)
      values (
        v_oi_id,
        (v_variant->>'variantId')::uuid,
        v_variant->>'variantName',
        (v_variant->>'priceDelta')::numeric
      );
    end loop;

    -- Kurangi stok via resep aktif (atomik).
    v_recipe := public._active_recipe_id(v_product, v_today);
    if v_recipe is not null then
      for v_line in
        select ingredient_id, qty_used from public.recipe_lines where recipe_id = v_recipe
      loop
        update public.ingredients
          set stock_qty = stock_qty - (v_line.qty_used * v_qty)
          where id = v_line.ingredient_id;

        insert into public.stock_movements (ingredient_id, change_qty, reason, ref_id, note, created_by)
        values (v_line.ingredient_id, -(v_line.qty_used * v_qty), 'sale', v_order.id,
                'Penjualan ' || v_qty || ' porsi', v_uid);
      end loop;
    end if;
  end loop;

  return v_order;
end;
$$;

grant execute on function public.create_order(numeric, text, jsonb) to authenticated;

-- =====================================================================
-- void_order: batalkan order + kembalikan stok (atomik).
-- =====================================================================
create or replace function public.void_order(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders%rowtype;
  v_today date := (now() at time zone 'utc')::date;
  v_item record;
  v_recipe uuid;
  v_line record;
begin
  if v_uid is null then raise exception 'Tidak terautentikasi'; end if;
  if not public.is_internal_user() then raise exception 'Akses ditolak'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Alasan wajib diisi'; end if;

  -- Kunci baris order untuk cegah double-void bersamaan.
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order tidak ditemukan'; end if;
  if v_order.status = 'voided' then raise exception 'Order sudah dibatalkan'; end if;

  update public.orders set status = 'voided', void_reason = p_reason where id = p_order_id;

  for v_item in
    select product_id, sum(qty) as qty from public.order_items
    where order_id = p_order_id group by product_id
  loop
    v_recipe := public._active_recipe_id(v_item.product_id, v_today);
    if v_recipe is not null then
      for v_line in
        select ingredient_id, qty_used from public.recipe_lines where recipe_id = v_recipe
      loop
        update public.ingredients
          set stock_qty = stock_qty + (v_line.qty_used * v_item.qty)
          where id = v_line.ingredient_id;

        insert into public.stock_movements (ingredient_id, change_qty, reason, ref_id, note, created_by)
        values (v_line.ingredient_id, (v_line.qty_used * v_item.qty), 'adjustment', p_order_id,
                'Void order: ' || p_reason, v_uid);
      end loop;
    end if;
  end loop;

  insert into public.order_edits (order_id, edited_by, action, reason, after_snapshot)
  values (p_order_id, v_uid, 'void', p_reason, jsonb_build_object('status', 'voided'));
end;
$$;

grant execute on function public.void_order(uuid, text) to authenticated;

-- =====================================================================
-- close_shift: hitung kas + tutup shift + catat pemasukan (atomik).
-- Mengembalikan ringkasan untuk dipakai action (rekap WA dsb).
-- =====================================================================
create or replace function public.close_shift(
  p_shift_id uuid,
  p_counted_cash numeric,
  p_owner_withdrawal numeric
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_shift public.shifts%rowtype;
  v_cash numeric := 0;
  v_qris numeric := 0;
  v_cashout numeric := 0;
  v_expected numeric;
  v_diff numeric;
  v_closing numeric;
  v_income numeric;
begin
  if v_uid is null then raise exception 'Tidak terautentikasi'; end if;
  if not public.is_internal_user() then raise exception 'Akses ditolak'; end if;

  select * into v_shift from public.shifts where id = p_shift_id for update;
  if not found then raise exception 'Shift tidak ditemukan'; end if;
  if v_shift.status = 'closed' then raise exception 'Shift sudah ditutup'; end if;

  select coalesce(sum(total), 0) into v_cash from public.orders
    where shift_id = p_shift_id and payment_method = 'cash' and status = 'completed';
  select coalesce(sum(total), 0) into v_qris from public.orders
    where shift_id = p_shift_id and payment_method = 'qris' and status = 'completed';
  select coalesce(sum(amount), 0) into v_cashout from public.cash_drawer_movements
    where shift_id = p_shift_id and direction = 'out';

  v_expected := v_shift.opening_balance + v_cash - v_cashout;
  v_diff := p_counted_cash - v_expected;
  v_closing := p_counted_cash - p_owner_withdrawal;

  update public.shifts set
    closed_by = v_uid,
    closed_at = now(),
    expected_cash = v_expected,
    counted_cash = p_counted_cash,
    cash_difference = v_diff,
    owner_withdrawal = p_owner_withdrawal,
    closing_balance = v_closing,
    qris_total = v_qris,
    status = 'closed'
  where id = p_shift_id;

  v_income := v_cash + v_qris;
  if v_income > 0 then
    insert into public.cashflow_entries (entry_date, direction, amount, kind, source, ref_id, note, created_by)
    values ((now() at time zone 'utc')::date, 'in', v_income, 'income', 'sale', p_shift_id,
            'Penjualan shift ' || p_shift_id, v_uid);
  end if;

  return jsonb_build_object(
    'cashSales', v_cash,
    'qrisTotal', v_qris,
    'openingBalance', v_shift.opening_balance,
    'closingBalance', v_closing,
    'cashDiff', v_diff
  );
end;
$$;

grant execute on function public.close_shift(uuid, numeric, numeric) to authenticated;
