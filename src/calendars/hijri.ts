import { en } from "../strings/en.ts";

export interface HijriDate {
  day: number;
  /** 1 to 12, where 1 is Muharram. */
  month: number;
  year: number;
}

/** Whole days added to the civil date, "Match your local mosque" in settings. */
export type HijriOffset = -1 | 0 | 1;

// Numeric parts only, so month names and era text never depend on the locale data.
const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = Number(parts.find((p) => p.type === type)?.value);
  if (!Number.isInteger(value)) {
    throw new Error(`Missing Hijri ${type}: umm al-Qura calendar data unavailable`);
  }
  return value;
}

/** Converts the local calendar date of `date`, moved by `offset` days, to the umm al-Qura Hijri calendar. */
export function toHijri(date: Date, offset: HijriOffset = 0): HijriDate {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }
  // Date arithmetic on local fields, not milliseconds, so a daylight-saving change cannot skip a day.
  const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
  const parts = formatter.formatToParts(shifted);
  return { day: part(parts, "day"), month: part(parts, "month"), year: part(parts, "year") };
}

/** Formats the Hijri date as, for example, "30 Rabi al-Thani 1448 AH". */
export function formatHijri(date: Date, offset: HijriOffset = 0): string {
  const { day, month, year } = toHijri(date, offset);
  return `${day} ${en.hijriMonths[month - 1]} ${year} ${en.hijriEra}`;
}
