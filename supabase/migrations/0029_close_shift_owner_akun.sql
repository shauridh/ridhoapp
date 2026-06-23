-- ============================================================
-- 0029: Update close_shift untuk auto-catat withdrawal ke akun owner
-- ============================================================

DROP FUNCTION IF EXISTS public.close_shift(uuid, numeric, numeric);

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
  v_gojek     numeric := 0;
  v_grab      numeric := 0;
  v_shopee    numeric := 0;
  v_other     numeric := 0;
  v_cashout   numeric := 0;
  v_expected  numeric;
  v_diff      numeric;
  v_closing   numeric;
  v_income    numeric;
  v_owner_akun_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Tidak terautentikasi'; END IF;
  IF NOT public.is_internal_user() THEN RAISE EXCEPTION 'Akses ditolak'; END IF;

  SELECT * INTO v_shift FROM public.shifts WHERE id = p_shift_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shift tidak ditemukan'; END IF;
  IF v_shift.status = 'closed' THEN RAISE EXCEPTION 'Shift sudah ditutup'; END IF;

  -- Aggregate payment methods dengan breakdown online food platforms
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
      WHEN lower(payment_method) LIKE '%gojek%' OR lower(payment_method) LIKE '%gofood%'
      THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE
      WHEN lower(payment_method) LIKE '%grab%'
      THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE
      WHEN lower(payment_method) LIKE '%shopee%'
      THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE
      WHEN lower(payment_method) NOT LIKE '%tunai%'
       AND lower(payment_method) != 'cash'
       AND lower(payment_method) NOT LIKE '%qris%'
       AND lower(payment_method) NOT LIKE '%transfer%'
       AND lower(payment_method) NOT LIKE '%gojek%'
       AND lower(payment_method) NOT LIKE '%gofood%'
       AND lower(payment_method) NOT LIKE '%grab%'
       AND lower(payment_method) NOT LIKE '%shopee%'
      THEN total ELSE 0 END), 0)
  INTO v_cash, v_qris, v_transfer, v_gojek, v_grab, v_shopee, v_other
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

  -- Catat omzet ke cashflow
  v_income := v_cash + v_qris + v_transfer + v_gojek + v_grab + v_shopee + v_other;
  IF v_income > 0 THEN
    INSERT INTO public.cashflow_entries
      (entry_date, direction, amount, kind, source, ref_id, note, created_by)
    VALUES
      ((now() AT TIME ZONE 'Asia/Jakarta')::date, 'in', v_income, 'income', 'sale',
       p_shift_id, 'Penjualan shift ' || p_shift_id, v_uid);
  END IF;

  -- Auto-catat withdrawal ke akun owner (kas ril)
  IF p_owner_withdrawal > 0 THEN
    -- Cari akun owner yang aktif (is_owner = true)
    SELECT id INTO v_owner_akun_id
    FROM public.akun
    WHERE is_owner = true AND aktif = true
    LIMIT 1;

    -- Catat sebagai withdrawal di cashflow (direction out = keluar dari bisnis)
    INSERT INTO public.cashflow_entries
      (entry_date, direction, amount, kind, source, ref_id, note, created_by, akun_id)
    VALUES
      ((now() AT TIME ZONE 'Asia/Jakarta')::date, 'out', p_owner_withdrawal, 'withdrawal', 'drawer',
       p_shift_id, 'Ambil owner shift ' || p_shift_id, v_uid, v_owner_akun_id);

    -- Catat sebagai IN ke akun owner (saldo akun bertambah)
    IF v_owner_akun_id IS NOT NULL THEN
      INSERT INTO public.cashflow_entries
        (entry_date, direction, amount, kind, source, ref_id, note, created_by, akun_id)
      VALUES
        ((now() AT TIME ZONE 'Asia/Jakarta')::date, 'in', p_owner_withdrawal, 'withdrawal', 'drawer',
         p_shift_id, 'Kas ril masuk - shift ' || p_shift_id, v_uid, v_owner_akun_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'cashSales',       v_cash,
    'qrisTotal',       v_qris,
    'transferTotal',   v_transfer,
    'gojekTotal',      v_gojek,
    'grabTotal',       v_grab,
    'shopeeTotal',     v_shopee,
    'otherTotal',      v_other,
    'cashOut',         v_cashout,
    'openingBalance',  v_shift.opening_balance,
    'closingBalance',  v_closing,
    'ownerWithdrawal', p_owner_withdrawal,
    'cashDiff',        v_diff
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_shift(uuid, numeric, numeric) TO authenticated;
