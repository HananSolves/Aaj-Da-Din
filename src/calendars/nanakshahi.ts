import { en } from "../strings/en.ts";

export interface NanakshahiDate {
  day: number;
  /** 1 to 12, where 1 is Chet. */
  month: number;
  year: number;
}

// Gregorian [month, day] on which each original (2003) Nanakshahi month starts, Chet first
// (project-plan §3.4.2). A month runs until the next start, so its length, including Phagun
// growing to 31 days in a Gregorian leap year, follows from the calendar itself.
const monthStarts = [
  [3, 14],
  [4, 14],
  [5, 15],
  [6, 15],
  [7, 16],
  [8, 16],
  [9, 15],
  [10, 15],
  [11, 14],
  [12, 14],
  [1, 13],
  [2, 12],
] as const;

const MS_PER_DAY = 86_400_000;

/** Converts the local calendar date of `date` to the original Nanakshahi calendar. */
export function toNanakshahi(date: Date): NanakshahiDate {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }
  const year = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();
  const key = gMonth * 100 + gDay;

  // Before 13 January no start in this Gregorian year has begun: still Poh, from 14 December.
  let month = 10;
  let startYear = year - 1;
  let startMonth = 12;
  let startDay = 14;
  let bestKey = 0;
  for (const [i, [m, d]] of monthStarts.entries()) {
    const startKey = m * 100 + d;
    if (startKey <= key && startKey > bestKey) {
      bestKey = startKey;
      month = i + 1;
      startYear = year;
      startMonth = m;
      startDay = d;
    }
  }

  // UTC keeps the day count exact across daylight-saving changes.
  const days = Date.UTC(year, gMonth - 1, gDay) - Date.UTC(startYear, startMonth - 1, startDay);
  return {
    day: Math.round(days / MS_PER_DAY) + 1,
    month,
    year: year - (key >= 314 ? 1468 : 1469),
  };
}

/** Formats the Nanakshahi date as, for example, "27 Assu 558 NS". */
export function formatNanakshahi(date: Date): string {
  const { day, month, year } = toNanakshahi(date);
  return `${day} ${en.punjabiMonths[month - 1]} ${year} ${en.nanakshahiEra}`;
}
