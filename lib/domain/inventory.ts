export interface RecipeLine {
  ingredientId: string
  qtyUsed: number
}

export interface RecipeVersion {
  id: string
  effectiveFrom: string // ISO date YYYY-MM-DD
  lines: RecipeLine[]
}

export function selectActiveRecipe(
  recipes: RecipeVersion[],
  saleDate: string,
): RecipeVersion | null {
  const eligible = recipes
    .filter((r) => r.effectiveFrom <= saleDate)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))
  return eligible[0] ?? null
}
