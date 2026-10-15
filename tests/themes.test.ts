import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { en } from "../src/strings/en.ts";
import { themeIds } from "../src/themes/themes.ts";

const css = readFileSync(new URL("../entrypoints/newtab/critical.css", import.meta.url), "utf8");

interface Palette {
  bg: string;
  fg: string;
  muted: string;
  colorScheme: string;
}

function palette(body: string | undefined): Palette {
  const get = (name: string) =>
    new RegExp(`${name}:\\s*(#[0-9a-f]{6}|light|dark)\\s*;`).exec(body ?? "")?.[1] ?? "";
  return {
    bg: get("--bg"),
    fg: get("--fg"),
    muted: get("--muted"),
    colorScheme: get("color-scheme"),
  };
}

const named = [...css.matchAll(/:root\[data-theme="([^"]+)"\]\s*\{([^}]*)\}/g)];
const palettes: Record<string, Palette> = {
  "default (:root)": palette(/^:root\s*\{([^}]*)\}/m.exec(css)?.[1]),
  "default (dark scheme)": palette(
    /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/.exec(css)?.[1],
  ),
  ...Object.fromEntries(named.map(([, id = "", body]) => [id, palette(body)])),
};

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("theme palettes in critical.css", () => {
  it("has exactly one data-theme block per theme id, and none for an unknown id", () => {
    expect(named.map(([, id]) => id).sort()).toEqual([...themeIds].sort());
  });

  it.each(Object.entries(palettes))("%s declares a complete palette", (_name, p) => {
    expect(p.bg).toMatch(/^#/);
    expect(p.fg).toMatch(/^#/);
    expect(p.muted).toMatch(/^#/);
    expect(["light", "dark"]).toContain(p.colorScheme);
  });

  it.each(Object.entries(palettes))("%s has 4.5:1 contrast for text and muted text", (_name, p) => {
    expect(contrast(p.fg, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("uses chitta and raat as the OS-scheme defaults", () => {
    expect(palettes["default (:root)"]).toEqual(palettes.chitta);
    expect(palettes["default (dark scheme)"]).toEqual(palettes.raat);
  });
});

describe("look labels", () => {
  it("has a non-empty name for every theme and date style", () => {
    for (const name of [...Object.values(en.themeNames), ...Object.values(en.dateStyleNames)]) {
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
