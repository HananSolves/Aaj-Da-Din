import type { CalendarId, Settings } from "./types.ts";

// localStorage mirror of the settings for instant first paint.
// storage.sync stays the source of truth (project-plan §4.2).
const KEY = "add:settings";

const calendarIds: readonly string[] = [
  "gregorian",
  "desi",
  "bikrami",
  "nanakshahi",
  "hijri",
] satisfies CalendarId[];

/**
 * Parses the stored mirror. A missing, malformed or unrecognised value is "no mirror" (`null`),
 * so the new tab falls back to its defaults instead of failing to render.
 */
export function parseMirror(raw: string | null): Settings | null {
  if (!raw) {
    return null;
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { schemaVersion, calendars, theme, hijriOffset } = value as Record<string, unknown>;
  const valid =
    schemaVersion === 1 &&
    Array.isArray(calendars) &&
    calendars.length > 0 &&
    calendars.every((id) => typeof id === "string" && calendarIds.includes(id)) &&
    new Set(calendars).size === calendars.length &&
    typeof theme === "string" &&
    (hijriOffset === -1 || hijriOffset === 0 || hijriOffset === 1);
  return valid ? (value as Settings) : null;
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
