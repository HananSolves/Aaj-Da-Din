import { browser } from "wxt/browser";
import { parseSettings } from "./migrations.ts";
import { readMirror, writeMirror } from "./mirror.ts";
import type { Settings } from "./types.ts";

const KEY = "settings";

/**
 * Reads settings from `storage.sync` (the source of truth) and refreshes the mirror. Never writes
 * to `storage.sync`: a missing, unreadable or newer-schema value is `null`, and a failing read
 * falls back to the mirror.
 */
export async function loadSettings(): Promise<Settings | null> {
  try {
    const stored = await browser.storage.sync.get(KEY);
    const settings = parseSettings(stored[KEY]);
    if (settings) {
      writeMirror(settings);
    }
    return settings;
  } catch {
    return readMirror();
  }
}

/** Writes `storage.sync` first so the mirror is never ahead of it; a failed write rejects. */
export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ [KEY]: settings });
  writeMirror(settings);
}
