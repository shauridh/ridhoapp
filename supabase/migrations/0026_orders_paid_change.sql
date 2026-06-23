-- Add paid and change columns to orders table for cash transactions
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS paid NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS change NUMERIC(14,2);

COMMENT ON COLUMN public.orders.paid IS 'Jumlah uang yang diterima (cash only)';
COMMENT ON COLUMN public.orders.change IS 'Kembalian (cash only)';
