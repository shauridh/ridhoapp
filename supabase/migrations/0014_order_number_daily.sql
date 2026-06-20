-- ============================================================
-- PART A: Tambah kolom order_number ke tabel orders
-- Reset harian — #001 per hari, dihitung dari order pertama hari itu
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number integer;

-- Index untuk query nomor order hari ini dengan cepat
CREATE INDEX IF NOT EXISTS idx_orders_date_number
  ON public.orders (date(created_at AT TIME ZONE 'utc'), order_number);

-- Backfill: isi existing rows berdasar urutan created_at per hari UTC
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY date(created_at AT TIME ZONE 'utc')
           ORDER BY created_at
         )::integer AS rn
  FROM public.orders
)
UPDATE public.orders o
SET order_number = n.rn
FROM numbered n
WHERE o.id = n.id;

-- ============================================================
-- PART B: Update fungsi create_order — tambah order_number otomatis
-- Mengganti fungsi di 0010_pos_transactional_rpc.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order(
  p_total numeric,
  p_payment_method text,
  p_items jsonb
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_shift uuid;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_variant jsonb;
  v_oi_id uuid;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_recipe uuid;
  v_line record;
  v_qty integer;
  v_product uuid;
  v_next_order_num integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi';
  END IF;
  IF NOT public.is_internal_user() THEN
    RAISE EXCEPTION 'Akses ditolak';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang kosong';
  END IF;

  SELECT id INTO v_shift FROM public.shifts WHERE status = 'open' LIMIT 1;

  -- Hitung nomor order hari ini (reset harian, mulai dari 1)
  SELECT COALESCE(MAX(order_number), 0) + 1
    INTO v_next_order_num
    FROM public.orders
   WHERE date(created_at AT TIME ZONE 'utc') = v_today;

  INSERT INTO public.orders
    (shift_id, total, payment_method, source, status, created_by, order_number)
  VALUES
    (v_shift, p_total, p_payment_method, 'cashier', 'completed', v_uid, v_next_order_num)
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'qty')::int;
    v_product := (v_item->>'productId')::uuid;

    INSERT INTO public.order_items (order_id, product_id, product_name, qty, unit_price, subtotal)
    VALUES (
      v_order.id,
      v_product,
      v_item->>'productName',
      v_qty,
      (v_item->>'unitPrice')::numeric,
      ((v_item->>'unitPrice')::numeric +
        COALESCE((SELECT SUM((v->>'priceDelta')::numeric)
                  FROM jsonb_array_elements(v_item->'variants') v), 0)
      ) * v_qty
    )
    RETURNING id INTO v_oi_id;

    FOR v_variant IN SELECT * FROM jsonb_array_elements(COALESCE(v_item->'variants', '[]'::jsonb))
    LOOP
      INSERT INTO public.order_item_variants (order_item_id, variant_id, variant_name, price_delta)
      VALUES (
        v_oi_id,
        (v_variant->>'variantId')::uuid,
        v_variant->>'variantName',
        (v_variant->>'priceDelta')::numeric
      );
    END LOOP;

    -- Kurangi stok via resep aktif (atomik).
    v_recipe := public._active_recipe_id(v_product, v_today);
    IF v_recipe IS NOT NULL THEN
      FOR v_line IN
        SELECT ingredient_id, qty_used FROM public.recipe_lines WHERE recipe_id = v_recipe
      LOOP
        UPDATE public.ingredients
          SET stock_qty = stock_qty - (v_line.qty_used * v_qty)
          WHERE id = v_line.ingredient_id;

        INSERT INTO public.stock_movements (ingredient_id, change_qty, reason, ref_id, note, created_by)
        VALUES (v_line.ingredient_id, -(v_line.qty_used * v_qty), 'sale', v_order.id,
                'Penjualan ' || v_qty || ' porsi', v_uid);
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_order;
END;
$$;
