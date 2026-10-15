// Type-only, so the build-time generator and astronomy-engine never reach the extension.
import type { YearData } from "../../scripts/calendar-math.ts";

export type CalendarYear = YearData;

export interface DayLocation {
  /** Local calendar date as YYYY-MM-DD. */
  iso: string;
  /** Zero-based day of the year, the index into `CalendarYear.tithi`. */
  dayIndex: number;
}

// Lazy per-year chunks: only the file for the year being looked up is ever fetched.
const loaders = import.meta.glob<CalendarYear>("../../data/calendar/*.json", { import: "default" });

/** Loads the bundled data for `year`, or `undefined` when there is no file for it. */
export async function loadCalendarYear(year: number): Promise<CalendarYear | undefined> {
  return loaders[`../../data/calendar/${year}.json`]?.();
}

/** Finds the local calendar date of `date` in the data for its own Gregorian year. */
export function locate(date: Date, data: CalendarYear): DayLocation {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }
  const year = date.getFullYear();
  if (year !== data.year) {
    throw new RangeError(`Date is in ${year} but the calendar data is for ${data.year}`);
  }
  const month = date.getMonth();
  const day = date.getDate();
  const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  // UTC keeps the day count exact across daylight-saving changes.
  const dayIndex = Math.round((Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / 86_400_000);
  return { iso, dayIndex };
}
