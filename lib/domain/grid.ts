export type GridSetting = "auto" | 3 | 4 | 5

export function gridStyle(setting: GridSetting): { gridTemplateColumns: string } {
  if (setting === "auto") {
    return { gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }
  }
  return { gridTemplateColumns: `repeat(${setting}, 1fr)` }
}
