import type { CalendarId } from "../calendars/registry.ts";
import type { FestivalSet, GurpurabSource } from "../festivals/sets.ts";
import type { ThemeId } from "../themes/themes.ts";

export type { CalendarId };

export const dateStyles = ["list", "centered", "compact"] as const;
export type DateStyle = (typeof dateStyles)[number];

export const backgrounds = ["photo", "solid"] as const;
export type Background = (typeof backgrounds)[number];

export interface Settings {
  /** Bump when the shape changes and add a migration in migrations.ts. */
  schemaVersion: 5;
  calendars: CalendarId[];
  theme: ThemeId;
  dateStyle: DateStyle;
  background: Background;
  hijriOffset: -1 | 0 | 1;
  festivalSets: FestivalSet[];
  gurpurabSource: GurpurabSource;
  showFestivalLines: boolean;
  showFact: boolean;
}

export const defaultSettings: Settings = {
  schemaVersion: 5,
  calendars: ["gregorian", "punjabi-solar", "nanakshahi"],
  theme: "chitta",
  dateStyle: "list",
  background: "photo",
  hijriOffset: 0,
  festivalSets: ["cultural", "sikh"],
  gurpurabSource: "sgpc",
  showFestivalLines: true,
  showFact: true,
};
