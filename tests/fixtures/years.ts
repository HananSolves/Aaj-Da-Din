import { readFileSync } from "node:fs";
import type { CalendarYear } from "../../src/calendars/year-data.ts";

export const firstYear = 2026;
export const lastYear = 2036;

const years = new Map(
  Array.from({ length: lastYear - firstYear + 1 }, (_, i) => {
    const year = firstYear + i;
    const file = new URL(`../../data/calendar/${year}.json`, import.meta.url);
    return [year, JSON.parse(readFileSync(file, "utf8")) as CalendarYear] as const;
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
