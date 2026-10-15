import type { ThemeId } from "../themes/themes.ts";

export type CalendarId = "gregorian" | "desi" | "bikrami" | "nanakshahi" | "hijri";

export const dateStyles = ["list", "centered", "compact"] as const;
export type DateStyle = (typeof dateStyles)[number];

export const backgrounds = ["photo", "solid"] as const;
export type Background = (typeof backgrounds)[number];

export interface Settings {
  /** Bump when the shape changes and add a migration in migrations.ts. */
  schemaVersion: 2;
  calendars: CalendarId[];
  theme: ThemeId;
  dateStyle: DateStyle;
  background: Background;
  hijriOffset: -1 | 0 | 1;
}

export const defaultSettings: Settings = {
  schemaVersion: 2,
  calendars: ["gregorian", "desi", "nanakshahi"],
  theme: "chitta",
  dateStyle: "list",
  background: "photo",
  hijriOffset: 0,
};
