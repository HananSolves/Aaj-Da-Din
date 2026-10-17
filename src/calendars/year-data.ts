// Type-only, so the build-time generator and astronomy-engine never reach the extension.
import type { LunisolarYear, SolarYear } from "../../scripts/calendar-math.ts";

export type { LunisolarYear, SolarYear };

/** The calendars that ship generated data, one folder each under data/calendar. */
export type DataCalendarId = "punjabi-solar" | "bikrami";

interface DataByCalendar {
  "punjabi-solar": SolarYear;
  bikrami: LunisolarYear;
}

/** Both datasets of one year, which is what the festival rules read. */
export type CalendarYear = SolarYear & LunisolarYear;

export interface DayLocation {
  /** Local calendar date as YYYY-MM-DD. */
  iso: string;
  /** Zero-based day of the year, the index into `LunisolarYear.tithi`. */
  dayIndex: number;
}

// Lazy per-calendar, per-year chunks: only the files for the calendars and year in use are fetched.
const loaders = import.meta.glob<DataByCalendar[DataCalendarId]>("../../data/calendar/*/*.json", {
  import: "default",
});

/** Loads the bundled data of one calendar for `year`, or `undefined` when there is no file. */
export async function loadCalendarYear<C extends DataCalendarId>(
  calendar: C,
  year: number,
): Promise<DataByCalendar[C] | undefined> {
  return loaders[`../../data/calendar/${calendar}/${year}.json`]?.() as
    | Promise<DataByCalendar[C]>
    | undefined;
}

/** Loads both calendars' data for `year`, or `undefined` when either file is missing. */
export async function loadFestivalYear(year: number): Promise<CalendarYear | undefined> {
  const [solar, lunisolar] = await Promise.all([
    loadCalendarYear("punjabi-solar", year),
    loadCalendarYear("bikrami", year),
  ]);
  return solar && lunisolar ? { ...solar, ...lunisolar } : undefined;
}

/** The local calendar date of `date` as YYYY-MM-DD (not the UTC date, which differs near midnight). */
export function localIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Finds the local calendar date of `date` in the data for its own Gregorian year. */
export function locate(date: Date, data: { year: number }): DayLocation {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }
  const year = date.getFullYear();
  if (year !== data.year) {
    throw new RangeError(`Date is in ${year} but the calendar data is for ${data.year}`);
  }
  const month = date.getMonth();
  const day = date.getDate();
  const iso = localIso(date);
  // UTC keeps the day count exact across daylight-saving changes.
  const dayIndex = Math.round((Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / 86_400_000);
  return { iso, dayIndex };
}
