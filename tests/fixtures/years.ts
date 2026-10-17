import { readFileSync } from "node:fs";
import type { CalendarYear, DataCalendarId } from "../../src/calendars/year-data.ts";

export const firstYear = 2026;
export const lastYear = 2036;

/** Reads one calendar's committed file for `year`, exactly as the extension bundles it. */
export function readCalendarFile<T>(calendar: DataCalendarId, year: number): T {
  const file = new URL(`../../data/calendar/${calendar}/${year}.json`, import.meta.url);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

const years = new Map(
  Array.from({ length: lastYear - firstYear + 1 }, (_, i) => {
    const year = firstYear + i;
    const merged: CalendarYear = {
      ...readCalendarFile<CalendarYear>("punjabi-solar", year),
      ...readCalendarFile<CalendarYear>("bikrami", year),
    };
    return [year, merged] as const;
  }),
);

export function yearData(year: number): CalendarYear | undefined {
  return years.get(year);
}

export function dataFor(date: Date): CalendarYear {
  const found = years.get(date.getFullYear());
  if (!found) {
    throw new Error(`no data for ${date.getFullYear()}`);
  }
  return found;
}

export function local(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
