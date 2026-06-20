-- ============================================================
-- 0019: Tambah payment_method ke online_orders
-- dan tabel payment_options untuk CRUD opsi pembayaran
-- ============================================================

-- Kolom metode bayar di online_orders (nullable = belum dibayar)
ALTER TABLE public.online_orders
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Tabel opsi pembayaran yang bisa di-CRUD
CREATE TABLE IF NOT EXISTS public.payment_options (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name     text NOT NULL,        -- mis. "COD", "Transfer BCA", "OVO"
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal full access payment_options"
  ON public.payment_options FOR ALL TO authenticated
  USING (public.is_internal_user()) WITH CHECK (public.is_internal_user());

-- Seed opsi default
INSERT INTO public.payment_options (name, is_active, sort_order) VALUES
  ('COD (Bayar di Tempat)', true, 1),
  ('Transfer Bank',         true, 2),
  ('QRIS',                  true, 3),
  ('OVO',                   false, 4),
  ('GoPay',                 false, 5),
  ('ShopeePay',             false, 6)
ON CONFLICT DO NOTHING;
