-- ============================================================
-- 0022: Update close_shift RPC untuk support custom payment methods
-- Cash = metode mengandung 'tunai' atau 'cash' (case-insensitive)
-- QRIS = metode mengandung 'qris'
-- Transfer/lainnya = dicatat di rekap tapi tidak masuk kas fisik
-- ============================================================

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

  -- Hitung per kelompok metode bayar (case-insensitive, support custom names)
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

  -- Kas yang diharapkan ada di laci = hanya dari metode tunai/cash
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
      ((now() AT TIME ZONE 'utc')::date, 'in', v_income, 'income', 'sale',
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
