export type CalendarId = "gregorian" | "desi" | "bikrami" | "nanakshahi" | "hijri";

export interface Settings {
  /** Bump when the shape changes and add a migration in migrations.ts. */
  schemaVersion: 1;
  calendars: CalendarId[];
  theme: string;
  hijriOffset: -1 | 0 | 1;
}

export const defaultSettings: Settings = {
  schemaVersion: 1,
  calendars: ["gregorian", "desi", "nanakshahi"],
  theme: "light",
  hijriOffset: 0,
};
