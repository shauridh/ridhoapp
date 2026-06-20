-- ============================================================
-- 0021: RPC get_out_of_stock_product_ids
-- Kembalikan product_id yang punya resep aktif dengan minimal
-- satu bahan baku stock_qty <= 0.
-- Produk tanpa resep TIDAK masuk (dianggap selalu tersedia).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_out_of_stock_product_ids()
RETURNS TABLE(product_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT p.id
  FROM public.products p
  JOIN LATERAL (
    SELECT r.id AS recipe_id
    FROM public.recipes r
    WHERE r.product_id = p.id
      AND r.effective_from <= CURRENT_DATE
    ORDER BY r.effective_from DESC
    LIMIT 1
  ) latest_recipe ON true
  JOIN public.recipe_lines rl ON rl.recipe_id = latest_recipe.recipe_id
  JOIN public.ingredients i   ON i.id = rl.ingredient_id
  WHERE p.is_active = true
    AND i.stock_qty <= 0;
$$;

GRANT EXECUTE ON FUNCTION public.get_out_of_stock_product_ids() TO authenticated;
