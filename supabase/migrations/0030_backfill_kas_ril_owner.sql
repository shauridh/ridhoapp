-- ============================================================
-- 0030: Backfill kas ril owner dari data shifts historis
-- Untuk setiap shift yang sudah closed dengan owner_withdrawal > 0,
-- insert cashflow_entries linked ke akun owner (is_owner = true).
-- Skip jika sudah ada entry untuk shift tersebut (idempotent).
-- ============================================================

DO $$
DECLARE
  v_owner_akun_id uuid;
  v_shift         record;
BEGIN
  -- Cari akun owner aktif
  SELECT id INTO v_owner_akun_id
  FROM public.akun
  WHERE is_owner = true AND aktif = true
  LIMIT 1;

  -- Jika tidak ada akun owner, skip
  IF v_owner_akun_id IS NULL THEN
    RAISE NOTICE 'Tidak ada akun owner (is_owner=true). Backfill dilewati.';
    RETURN;
  END IF;

  -- Loop semua shift closed dengan withdrawal > 0
  FOR v_shift IN
    SELECT
      id,
      closed_at,
      owner_withdrawal,
      COALESCE(closed_by, opened_by) AS created_by
    FROM public.shifts
    WHERE status = 'closed'
      AND owner_withdrawal > 0
      AND owner_withdrawal IS NOT NULL
  LOOP
    -- Idempotent: skip jika sudah ada entry kas ril untuk shift ini
    IF EXISTS (
      SELECT 1
      FROM public.cashflow_entries
      WHERE ref_id = v_shift.id
        AND akun_id = v_owner_akun_id
        AND kind = 'withdrawal'
        AND direction = 'in'
    ) THEN
      CONTINUE;
    END IF;

    -- Insert entry IN ke akun owner (kas ril bertambah)
    INSERT INTO public.cashflow_entries
      (entry_date, direction, amount, kind, source, ref_id, note, created_by, akun_id)
    VALUES
      (
        (v_shift.closed_at AT TIME ZONE 'Asia/Jakarta')::date,
        'in',
        v_shift.owner_withdrawal,
        'withdrawal',
        'drawer',
        v_shift.id,
        'Backfill kas ril - shift ' || v_shift.id,
        v_shift.created_by,
        v_owner_akun_id
      );

  END LOOP;

  RAISE NOTICE 'Backfill kas ril selesai untuk akun %', v_owner_akun_id;
END;
$$;
