import { festivalSets, gurpurabSources } from "../festivals/sets.ts";
import { themeIds } from "../themes/themes.ts";
import { backgrounds, type CalendarId, dateStyles, type Settings } from "./types.ts";

export const currentSchemaVersion = 3;

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
];

const calendarIds: readonly string[] = [
  "gregorian",
  "desi",
  "bikrami",
  "nanakshahi",
  "hijri",
] satisfies CalendarId[];

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
  } = value;
  return (
    schemaVersion === current &&
    Array.isArray(calendars) &&
    calendars.length > 0 &&
    calendars.every((id) => typeof id === "string" && calendarIds.includes(id)) &&
    new Set(calendars).size === calendars.length &&
    themeIds.some((id) => id === theme) &&
    dateStyles.some((id) => id === dateStyle) &&
    backgrounds.some((id) => id === background) &&
    (hijriOffset === -1 || hijriOffset === 0 || hijriOffset === 1) &&
    Array.isArray(sets) &&
    sets.every((id) => festivalSets.some((known) => known === id)) &&
    new Set(sets).size === sets.length &&
    gurpurabSources.some((id) => id === gurpurabSource)
  );
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
