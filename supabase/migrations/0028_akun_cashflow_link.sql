-- ============================================================
-- 0028: Link cashflow_entries ke akun + tandai akun owner
-- ============================================================

-- Tambah kolom akun_id ke cashflow_entries (nullable, backward compatible)
ALTER TABLE public.cashflow_entries
  ADD COLUMN IF NOT EXISTS akun_id uuid REFERENCES public.akun(id) ON DELETE SET NULL;

-- Tambah kolom is_owner ke akun untuk menandai akun kas ril owner
ALTER TABLE public.akun
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- Index untuk query saldo per akun
CREATE INDEX IF NOT EXISTS idx_cashflow_entries_akun
  ON public.cashflow_entries(akun_id)
  WHERE akun_id IS NOT NULL;

COMMENT ON COLUMN public.cashflow_entries.akun_id IS 'Akun tujuan/asal mutasi (opsional)';
COMMENT ON COLUMN public.akun.is_owner IS 'Tandai sebagai akun kas fisik owner (kas ril)';
