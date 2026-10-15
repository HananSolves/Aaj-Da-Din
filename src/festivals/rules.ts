import { type BikramiDate, toBikrami } from "../calendars/bikrami.ts";
import { type HijriDate, type HijriOffset, toHijri } from "../calendars/hijri.ts";
import { type CalendarYear, locate } from "../calendars/year-data.ts";
import { festivals } from "./festivals.ts";
import type { FestivalSet, GurpurabSource } from "./sets.ts";

/** Months are 1 to 12 with 1 = Chet, as in `toDesi` and `toBikrami`. */
export type FestivalRule =
  | { kind: "gregorian"; month: number; day: number }
  | { kind: "sangrand"; month: number; daysBefore?: number }
  | { kind: "tithi"; month: number; paksha: "sudi" | "vadi"; day: number }
  | { kind: "dates"; dates: readonly string[] }
  /** Months are 1 to 12 with 1 = Muharram, matched on the date moved by the user's Hijri offset. */
  | { kind: "hijri"; month: number; day: number };

const pad = (n: number) => String(n).padStart(2, "0");

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

function isoAfter(date: Date, days: number): string {
  const d = addDays(date, days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface Festival {
  /** Key of the festival's name in `en.festivals`. */
  id: string;
  set: FestivalSet;
  rule: FestivalRule;
  /** Used instead of `rule` when the Gurpurab source is the Original Nanakshahi calendar. */
  original?: FestivalRule;
}

export interface FestivalQuery {
  sets: readonly FestivalSet[];
  source?: GurpurabSource;
  hijriOffset?: HijriOffset;
}

/**
 * Returns the ids of the festivals in `query.sets` that fall on the local calendar date of `date`, in
 * list order. A tithi festival keeps to the nija month. A tithi at sunrise on two days running
 * counts on the first, and one that is at no sunrise counts on the day it begins, as panchangs date
 * a vriddhi or kshaya tithi.
 */
export function resolveFestivals(
  date: Date,
  data: CalendarYear,
  { sets, source = "sgpc", hijriOffset = 0 }: FestivalQuery,
  list: readonly Festival[] = festivals,
): string[] {
  const { iso, dayIndex } = locate(date, data);
  const bikrami = toBikrami(date, data);
  // The file holds no day before 1 January, so that day always counts as a first day.
  const repeated = dayIndex > 0 && data.tithi[dayIndex - 1] === data.tithi[dayIndex];

  let hijri: HijriDate | null | undefined;
  const hijriToday = (): HijriDate | null => {
    if (hijri === undefined) {
      try {
        hijri = toHijri(date, hijriOffset);
      } catch {
        // No umm al-Qura data in this browser: a Hijri festival is left out, the rest still show.
        hijri = null;
      }
    }
    return hijri;
  };

  const matches = (rule: FestivalRule): boolean => {
    switch (rule.kind) {
      case "gregorian":
        return rule.month === date.getMonth() + 1 && rule.day === date.getDate();
      case "sangrand": {
        // Entry i of `sangrand` starts desi month ((9 + i) % 12) + 1, so a shift into another
        // year finds no entry and never matches.
        const i = data.sangrand.indexOf(isoAfter(date, rule.daysBefore ?? 0));
        return i >= 0 && ((9 + i) % 12) + 1 === rule.month;
      }
      case "dates":
        return rule.dates.includes(iso);
      case "hijri": {
        const today = hijriToday();
        return today !== null && today.month === rule.month && today.day === rule.day;
      }
      case "tithi": {
        const tithi = (rule.paksha === "vadi" ? 15 : 0) + rule.day;
        const inMonth = (b: BikramiDate) => !b.adhik && b.month === rule.month;
        const today = data.tithi[dayIndex];
        if (today === tithi) {
          return !repeated && inMonth(bikrami);
        }
        // A tithi missing from every sunrise began and ended between two of them. Panchangs date
        // it to the day it begins, the day before the next tithi first shows at sunrise. Vadi 1
        // opens its month, so the day it begins still belongs to the previous one.
        const skipped =
          today === (tithi === 1 ? 30 : tithi - 1) &&
          data.tithi[dayIndex + 1] === (tithi === 30 ? 1 : tithi + 1);
        if (!skipped) {
          return false;
        }
        return inMonth(tithi === 16 ? toBikrami(addDays(date, 1), data) : bikrami);
      }
    }
  };

  return list
    .filter(({ set, rule, original }) => {
      const active = source === "nanakshahi" && original ? original : rule;
      return sets.includes(set) && matches(active);
    })
    .map(({ id }) => id);
}
