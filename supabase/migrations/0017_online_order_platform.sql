-- ============================================================
-- 0017: Tambah kolom platform ke online_orders
-- Platform: gofood | grabfood | shopeefood | manual | web
-- Default 'web' untuk order dari halaman publik
-- ============================================================

ALTER TABLE public.online_orders
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'web'
    CHECK (platform IN ('web', 'gofood', 'grabfood', 'shopeefood', 'manual'));

-- Index untuk filter laporan per platform
CREATE INDEX IF NOT EXISTS idx_online_orders_platform
  ON public.online_orders (platform, created_at DESC);

-- Backfill: order lama dari halaman publik = 'web'
UPDATE public.online_orders
  SET platform = 'web'
  WHERE platform IS NULL OR platform = '';
