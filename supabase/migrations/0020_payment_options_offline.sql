-- ============================================================
-- 0020: Tambah kolom is_offline ke payment_options
-- untuk membedakan metode pembayaran offline (POS) vs online
-- ============================================================

ALTER TABLE public.payment_options
  ADD COLUMN IF NOT EXISTS is_offline boolean NOT NULL DEFAULT false;

-- Update existing options ke offline (tunai/qris/transfer/debit)
UPDATE public.payment_options 
SET is_offline = true 
WHERE name IN ('Tunai', 'QRIS', 'Transfer', 'Kartu Debit');

-- Seed offline default options jika belum ada
INSERT INTO public.payment_options (name, is_offline, is_active, sort_order) VALUES
  ('Tunai', true, true, 1),
  ('QRIS', true, true, 2),
  ('Transfer', true, true, 3),
  ('Kartu Debit', true, true, 4)
ON CONFLICT DO NOTHING;