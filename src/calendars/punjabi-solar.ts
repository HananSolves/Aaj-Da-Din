import { en } from "../strings/en.ts";
import { locate, type SolarYear } from "./year-data.ts";

export interface PunjabiSolarDate {
  day: number;
  /** 1 to 12, where 1 is Chet. */
  month: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * Converts the local calendar date of `date` to the Punjabi solar calendar. The sangrand day is
 * day 1 of the new month. `data.sangrand[0]` is always the previous December's sangrand, which
 * starts Poh (month 10), so entry i starts month ((9 + i) % 12) + 1.
 */
export function toPunjabiSolar(date: Date, data: SolarYear): PunjabiSolarDate {
  const { iso } = locate(date, data);
  const i = data.sangrand.findLastIndex((start) => start <= iso);
  const start = data.sangrand[i];
  if (start === undefined) {
    throw new Error(`${data.year}: no sangrand on or before ${iso}`);
  }
  const days = (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / MS_PER_DAY;
  return { day: days + 1, month: ((9 + i) % 12) + 1 };
}

/** Formats the Punjabi solar date as, for example, "25 Assu". */
export function formatPunjabiSolar(date: Date, data: SolarYear): string {
  const { day, month } = toPunjabiSolar(date, data);
  return `${day} ${en.punjabiMonths[month - 1]}`;
}
