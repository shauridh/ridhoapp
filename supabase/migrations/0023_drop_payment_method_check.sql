-- ============================================================
-- 0023: Hapus check constraint orders_payment_method_check
-- agar custom payment methods dari payment_options bisa disimpan
-- ============================================================

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;
