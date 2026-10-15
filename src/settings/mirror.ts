import type { Settings } from "./types.ts";

// localStorage mirror of the settings for instant first paint.
// storage.sync stays the source of truth (project-plan §4.2).
const KEY = "add:settings";

export function readMirror(): Settings | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Settings) : null;
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
