import { createClient } from "@/lib/supabase/server"

export interface ProductRow {
  id: string
  name: string
  type: "single" | "combo"
  base_price: number
  category: string
  is_active: boolean
  created_at: string
}

export async function listProducts(): Promise<ProductRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProduct(id: string): Promise<ProductRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export interface VariantRow {
  id: string
  product_id: string
  name: string
  is_required: boolean
  price_delta: number
  type: "option" | "addon"
  is_active: boolean
}

export async function listVariants(productId: string): Promise<VariantRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
