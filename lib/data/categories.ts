import { createClient } from "@/lib/supabase/server"

export interface CategoryRow {
  id: string
  name: string
  sort_order: number
}

export async function listCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
