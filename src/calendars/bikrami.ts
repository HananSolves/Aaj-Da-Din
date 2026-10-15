import { en } from "../strings/en.ts";
import { type CalendarYear, locate } from "./year-data.ts";

export interface BikramiDate {
  /** 1 to 12, where 1 is Chet. */
  month: number;
  adhik: boolean;
  paksha: "sudi" | "vadi";
  /** 1 to 15 within the paksha. */
  day: number;
  /** Vikram Samvat year. */
  samvat: number;
}

const MS_PER_DAY = 86_400_000;

// Gregorian year + 57 from Chaitra Shukla 1, + 56 before it. In a year with an adhik Chaitra
// (2029) the new year turns in the nija month, the last Chaitra entry, as Drik Panchang dates it.
function samvatChangeIndex(data: CalendarYear): number {
  const chaitra = data.months.findLast(
    ([start, month, adhik]) => month === 0 && adhik === 0 && start.startsWith(`${data.year}-`),
  );
  if (!chaitra) {
    throw new Error(`${data.year}: no Chaitra month starts in this year`);
  }
  const startIndex =
    (Date.parse(`${chaitra[0]}T00:00:00Z`) - Date.UTC(data.year, 0, 1)) / MS_PER_DAY;
  const firstBright = data.tithi.findIndex((t, i) => i >= startIndex && t <= 15);
  if (firstBright < 0) {
    throw new Error(`${data.year}: no bright fortnight after Chaitra starts`);
  }
  // Tithi 1 skipped at sunrise means Pratipada began and ended between two sunrises. The panchang
  // dates the new year to the day it begins, which is the day before the first bright sunrise.
  return data.tithi[firstBright] === 1 ? firstBright : firstBright - 1;
}

/** Converts the local calendar date of `date` to the Bikrami (lunisolar, Purnimanta) calendar. */
export function toBikrami(date: Date, data: CalendarYear): BikramiDate {
  const { iso, dayIndex } = locate(date, data);
  const entry = data.months[data.months.findLastIndex(([start]) => start <= iso)];
  const tithi = data.tithi[dayIndex];
  if (!entry || tithi === undefined) {
    throw new Error(`${data.year}: no month or tithi for ${iso}`);
  }
  const [, monthIndex, adhik] = entry;
  return {
    month: monthIndex + 1,
    adhik: adhik === 1,
    paksha: tithi <= 15 ? "sudi" : "vadi",
    day: tithi <= 15 ? tithi : tithi - 15,
    samvat: data.year + (dayIndex >= samvatChangeIndex(data) ? 57 : 56),
  };
}

/** Formats the Bikrami date as, for example, "Assu Vadi 1, Samvat 2083". */
export function formatBikrami(date: Date, data: CalendarYear): string {
  const { month, adhik, paksha, day, samvat } = toBikrami(date, data);
  const name = en.punjabiMonths[month - 1];
  return `${adhik ? `${en.adhik} ` : ""}${name} ${en[paksha]} ${day}, ${en.samvat} ${samvat}`;
}
