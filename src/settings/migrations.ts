import { calendarIds } from "../calendars/registry.ts";
import { festivalSets, gurpurabSources } from "../festivals/sets.ts";
import { themeIds } from "../themes/themes.ts";
import { backgrounds, dateStyles, type Settings } from "./types.ts";

export const currentSchemaVersion = 5;

/** Takes a value stored at schema `n` (the step at index `n - 1`) and returns it at schema `n + 1`. */
export type MigrationStep = (stored: Record<string, unknown>) => Record<string, unknown>;

export const migrations: MigrationStep[] = [
  // 1 to 2: the free-form theme became a known id; dateStyle and background are new.
  (stored) => ({
    ...stored,
    theme: stored.theme === "dark" ? "raat" : "chitta",
    dateStyle: "list",
    background: "photo",
  }),
  // 2 to 3: festival sets and the Gurpurab source are new. The sets are what v2 always showed.
  (stored) => ({ ...stored, festivalSets: ["cultural", "sikh"], gurpurabSource: "sgpc" }),
  // 3 to 4: both toggles are new. Every earlier schema showed the festival lines (and had no fact).
  (stored) => ({ ...stored, showFestivalLines: true, showFact: true }),
  // 4 to 5: the Desi calendar is now Punjabi solar.
  (stored) => ({
    ...stored,
    calendars: Array.isArray(stored.calendars)
      ? stored.calendars.map((id) => (id === "desi" ? "punjabi-solar" : id))
      : stored.calendars,
  }),
];

function isCurrentShape(value: Record<string, unknown>, current: number): boolean {
  const {
    schemaVersion,
    calendars,
    theme,
    dateStyle,
    background,
    hijriOffset,
    festivalSets: sets,
    gurpurabSource,
    showFestivalLines,
    showFact,
  } = value;
  return (
    schemaVersion === current &&
    Array.isArray(calendars) &&
    calendars.length > 0 &&
    calendars.every((id) => calendarIds.some((known) => known === id)) &&
    new Set(calendars).size === calendars.length &&
    themeIds.some((id) => id === theme) &&
    dateStyles.some((id) => id === dateStyle) &&
    backgrounds.some((id) => id === background) &&
    (hijriOffset === -1 || hijriOffset === 0 || hijriOffset === 1) &&
    Array.isArray(sets) &&
    sets.every((id) => festivalSets.some((known) => known === id)) &&
    new Set(sets).size === sets.length &&
    gurpurabSources.some((id) => id === gurpurabSource) &&
    typeof showFestivalLines === "boolean" &&
    typeof showFact === "boolean"
  );
}

/** True for a stored value written by a newer release, which an older one must not overwrite. */
export function isNewerSchema(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const version = (value as Record<string, unknown>).schemaVersion;
  return typeof version === "number" && Number.isInteger(version) && version > currentSchemaVersion;
}

/**
 * Validates stored settings (from `storage.sync` or the mirror), migrating older schemas up to
 * `current`. Anything unreadable, including a schema newer than this build knows, is `null`.
 */
export function parseSettings(
  value: unknown,
  steps: MigrationStep[] = migrations,
  current: number = currentSchemaVersion,
): Settings | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  let stored = value as Record<string, unknown>;
  const from = stored.schemaVersion;
  if (typeof from !== "number" || !Number.isInteger(from) || from < 1 || from > current) {
    return null;
  }
  try {
    for (let version = from; version < current; version++) {
      const step = steps[version - 1];
      if (!step) {
        return null;
      }
      stored = { ...step(stored), schemaVersion: version + 1 };
    }
  } catch {
    return null;
  }
  return isCurrentShape(stored, current) ? (stored as unknown as Settings) : null;
}
