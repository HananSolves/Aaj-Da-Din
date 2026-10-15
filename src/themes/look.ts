import type { Settings } from "../settings/types.ts";

/** Sets the attributes that `critical.css` and the photo layer read; call only with validated settings. */
export function applyLook({
  theme,
  dateStyle,
  background,
}: Pick<Settings, "theme" | "dateStyle" | "background">): void {
  const { dataset } = document.documentElement;
  dataset.theme = theme;
  dataset.dateStyle = dateStyle;
  dataset.background = background;
}
