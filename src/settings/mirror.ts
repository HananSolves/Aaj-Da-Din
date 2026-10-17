import { parseSettings } from "./migrations.ts";
import type { Settings } from "./types.ts";

// localStorage mirror of the settings for instant first paint.
// storage.sync stays the source of truth (project-plan §4.2).
const KEY = "tarikh:settings";

/**
 * Parses the stored mirror. A missing, malformed or unrecognised value is "no mirror" (`null`),
 * so the new tab falls back to its defaults instead of failing to render.
 */
export function parseMirror(raw: string | null): Settings | null {
  if (!raw) {
    return null;
  }
  try {
    return parseSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function readMirror(): Settings | null {
  try {
    return parseMirror(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function writeMirror(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Mirror is best-effort only.
  }
}
