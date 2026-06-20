-- ============================================================
-- 0024: Ganti AT TIME ZONE 'utc' ke 'Asia/Jakarta' (WIB, GMT+7)
-- Berdampak pada:
--   - order_number daily counter (reset tengah malam WIB)
--   - close_shift entry_date cashflow
--   - create_order v_today untuk resep aktif
-- ============================================================

-- Update create_order (versi final dari 0018)
CREATE OR REPLACE FUNCTION public.create_order(
  p_total           numeric,
  p_payment_method  text,
  p_items           jsonb,
  p_discount_amount numeric  DEFAULT 0,
  p_discount_type   text     DEFAULT NULL,
  p_table_number    text     DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid            uuid := auth.uid();
  v_shift          uuid;
  v_order          public.orders%rowtype;
  v_item           jsonb;
  v_variant        jsonb;
  v_oi_id          uuid;
  v_today          date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_recipe         uuid;
  v_line           record;
  v_qty            integer;
  v_product        uuid;
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
  IF v_shift IS NULL THEN
    RAISE EXCEPTION 'Tidak ada shift yang sedang buka';
  END IF;

  -- Atomic order number counter (per hari WIB)
  INSERT INTO public.order_number_counters (counter_date, last_number)
  VALUES (v_today, 1)
  ON CONFLICT (counter_date)
  DO UPDATE SET last_number = order_number_counters.last_number + 1
  RETURNING last_number INTO v_next_order_num;

  INSERT INTO public.orders
    (shift_id, total, payment_method, source, status, created_by, order_number,
     discount_amount, discount_type, table_number)
  VALUES
    (v_shift, p_total, p_payment_method, 'cashier', 'completed', v_uid, v_next_order_num,
     COALESCE(p_discount_amount, 0), p_discount_type, p_table_number)
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty     := (v_item->>'qty')::int;
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

GRANT EXECUTE ON FUNCTION public.create_order(numeric, text, jsonb, numeric, text, text) TO authenticated;

-- Update close_shift (WIB entry_date)
CREATE OR REPLACE FUNCTION public.close_shift(
  p_shift_id        uuid,
  p_counted_cash    numeric,
  p_owner_withdrawal numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_shift     public.shifts%rowtype;
  v_cash      numeric := 0;
  v_qris      numeric := 0;
  v_transfer  numeric := 0;
  v_other     numeric := 0;
  v_cashout   numeric := 0;
  v_expected  numeric;
  v_diff      numeric;
  v_closing   numeric;
  v_income    numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Tidak terautentikasi'; END IF;
  IF NOT public.is_internal_user() THEN RAISE EXCEPTION 'Akses ditolak'; END IF;

  SELECT * INTO v_shift FROM public.shifts WHERE id = p_shift_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shift tidak ditemukan'; END IF;
  IF v_shift.status = 'closed' THEN RAISE EXCEPTION 'Shift sudah ditutup'; END IF;

  SELECT
    COALESCE(SUM(CASE
      WHEN lower(payment_method) LIKE '%tunai%' OR lower(payment_method) = 'cash'
      THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE
      WHEN lower(payment_method) LIKE '%qris%'
      THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE
      WHEN lower(payment_method) LIKE '%transfer%'
      THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE
      WHEN lower(payment_method) NOT LIKE '%tunai%'
       AND lower(payment_method) != 'cash'
       AND lower(payment_method) NOT LIKE '%qris%'
       AND lower(payment_method) NOT LIKE '%transfer%'
      THEN total ELSE 0 END), 0)
  INTO v_cash, v_qris, v_transfer, v_other
  FROM public.orders
  WHERE shift_id = p_shift_id AND status = 'completed';

  SELECT COALESCE(SUM(amount), 0) INTO v_cashout
  FROM public.cash_drawer_movements
  WHERE shift_id = p_shift_id AND direction = 'out';

  v_expected := v_shift.opening_balance + v_cash - v_cashout;
  v_diff     := p_counted_cash - v_expected;
  v_closing  := p_counted_cash - p_owner_withdrawal;

  UPDATE public.shifts SET
    closed_by          = v_uid,
    closed_at          = now(),
    expected_cash      = v_expected,
    counted_cash       = p_counted_cash,
    cash_difference    = v_diff,
    owner_withdrawal   = p_owner_withdrawal,
    closing_balance    = v_closing,
    qris_total         = v_qris,
    status             = 'closed'
  WHERE id = p_shift_id;

  v_income := v_cash + v_qris + v_transfer + v_other;
  IF v_income > 0 THEN
    INSERT INTO public.cashflow_entries
      (entry_date, direction, amount, kind, source, ref_id, note, created_by)
    VALUES
      ((now() AT TIME ZONE 'Asia/Jakarta')::date, 'in', v_income, 'income', 'sale',
       p_shift_id, 'Penjualan shift ' || p_shift_id, v_uid);
  END IF;

  RETURN jsonb_build_object(
    'cashSales',      v_cash,
    'qrisTotal',      v_qris,
    'transferTotal',  v_transfer,
    'otherTotal',     v_other,
    'openingBalance', v_shift.opening_balance,
    'closingBalance', v_closing,
    'cashDiff',       v_diff
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_shift(uuid, numeric, numeric) TO authenticated;
