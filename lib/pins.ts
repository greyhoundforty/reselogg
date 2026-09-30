import type { PlaceType } from "./types";

export const PIN_COLORS: Record<PlaceType, string> = {
  waterfall: "#2563eb",
  peak: "#b45309",
  trail: "#15803d",
  park: "#0f766e",
  garden: "#c026d3",
  "nature-center": "#7c3aed",
};

export const WNC_CENTER: [number, number] = [-82.55, 35.58];

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
