"use client";

import { useState, useEffect } from "react";
import type { ProductRow, VariantRow } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { fetchBestSellerIds } from "../product-actions";

export function useProducts() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<Record<string, VariantRow[]>>({});
  const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);

  const toast = useToast();

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      supabase.from("product_variants").select("*").eq("is_active", true),
    ]).then(([{ data: prods, error }, { data: vars }]) => {
      if (error) toast.show("Gagal memuat produk", "error");
      setProducts(prods ?? []);
      const grouped: Record<string, VariantRow[]> = {};
      for (const v of vars ?? []) {
        if (!grouped[v.product_id]) grouped[v.product_id] = [];
        grouped[v.product_id].push(v);
      }
      setVariants(grouped);
      setLoading(false);
    });
  }, [toast]);

  useEffect(() => {
    fetchBestSellerIds().then(setBestSellerIds);
  }, []);

  return { products, loading, variants, bestSellerIds };
}
