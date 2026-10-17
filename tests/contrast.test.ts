import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { themeIds } from "../src/themes/themes.ts";

const css = readFileSync(new URL("../entrypoints/newtab/critical.css", import.meta.url), "utf8");

interface Palette {
  bg: string;
  fg: string;
  muted: string;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

function palette(block: string): Palette {
  const value = (name: string): string => {
    const hex = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i").exec(block)?.[1];
    if (!hex) throw new Error(`--${name} not found in: ${block}`);
    return hex;
  };
  return { bg: value("bg"), fg: value("fg"), muted: value("muted") };
}

/** The `:root` default, the dark OS default and one palette per theme, keyed by a readable name. */
function palettes(): Record<string, Palette> {
  const defaults = /:root\s*{([^}]*)}/.exec(css)?.[1];
  const dark = /@media \(prefers-color-scheme: dark\)\s*{\s*:root\s*{([^}]*)}/.exec(css)?.[1];
  if (!defaults || !dark) throw new Error("default palettes not found in critical.css");

  const found: Record<string, Palette> = {
    "os light": palette(defaults),
    "os dark": palette(dark),
  };
  for (const [, id, block] of css.matchAll(/:root\[data-theme="([a-z]+)"\]\s*{([^}]*)}/g)) {
    if (id && block) found[id] = palette(block);
  }
  return found;
}

const aa = 4.5;

describe("contrast helper", () => {
  it("rates black on white 21:1 and a colour on itself 1:1", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#6b5a47", "#6b5a47")).toBeCloseTo(1, 5);
  });
});

describe("theme palettes", () => {
  const all = palettes();

  it("defines a palette for every theme id", () => {
    expect(Object.keys(all)).toEqual(expect.arrayContaining([...themeIds]));
  });

  it.each(Object.entries(all))("%s keeps text and muted text at WCAG AA", (_name, colours) => {
    expect(contrast(colours.bg, colours.fg)).toBeGreaterThanOrEqual(aa);
    expect(contrast(colours.bg, colours.muted)).toBeGreaterThanOrEqual(aa);
  });
});
