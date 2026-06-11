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

export interface StockDeduction {
  ingredientId: string
  changeQty: number
}

export function calcStockDeductions(
  recipe: RecipeVersion,
  qtySold: number,
): StockDeduction[] {
  return recipe.lines.map((line) => ({
    ingredientId: line.ingredientId,
    changeQty: -roundQty(line.qtyUsed * qtySold),
  }))
}

function roundQty(n: number): number {
  return Math.round(n * 10000) / 10000
}
