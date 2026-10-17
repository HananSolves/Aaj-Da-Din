import { describe, expect, it } from "vitest";
import { type BikramiDate, formatBikrami, toBikrami } from "../src/calendars/bikrami.ts";
import type { LunisolarYear } from "../src/calendars/year-data.ts";
import { masya2026, puranmashi2026, purnimantaMonths2026 } from "./fixtures/calendar.ts";
import { readCalendarFile } from "./fixtures/years.ts";

const load = (year: number) => readCalendarFile<LunisolarYear>("bikrami", year);

const data = new Map(Array.from({ length: 11 }, (_, i) => [2026 + i, load(2026 + i)] as const));
const dataFor = (date: Date): LunisolarYear => {
  const found = data.get(date.getFullYear());
  if (!found) throw new Error(`no data for ${date.getFullYear()}`);
  return found;
};
const bikrami = (date: Date) => toBikrami(date, dataFor(date));
const format = (date: Date) => formatBikrami(date, dataFor(date));

const local = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
};
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// The lookup reports the tithi at sunrise, so these expectations come from the published tithi
// begin and end times (converted to IST), not from the festival date.
//
// Drik Panchang, read 2026-10-15 (pages computed for Mul and Mumbai, UTC+5:30):
//  - Dashami runs 12:50 on 20 Oct to 14:11 on 21 Oct 2026, so the sunrise tithi is Navami on
//    20 Oct and Dashami on 21 Oct:
//    https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?geoname-id=1262574
//  - Amavasya runs 11:27 on 8 Nov to 12:31 on 9 Nov 2026, so 8 Nov is Chaturdashi and 9 Nov is
//    Amavasya: https://www.drikpanchang.com/festivals/lakshmipuja/festivals-lakshmipuja-timings.html?geoname-id=1275339&year=2026
//  - Pratipada runs 08:22 on 19 Mar to 06:22 on 20 Mar 2026 in Hanoi (UTC+7), which is 06:52 to
//    04:52 IST. That lies between two Amritsar sunrises, so 19 Mar is Amavasya and 20 Mar is
//    Dwitiya, and "Vikrama Samvata 2083 Begins" at that Pratipada:
//    https://www.drikpanchang.com/festivals/samvat-newyear/new-hindu-samvata-year-begins.html?year=2026
describe("published panchang tithis at sunrise", () => {
  it.each([
    ["2026-10-20", { month: 7, adhik: false, paksha: "sudi", day: 9, samvat: 2083 }],
    ["2026-10-21", { month: 7, adhik: false, paksha: "sudi", day: 10, samvat: 2083 }],
    ["2026-11-08", { month: 8, adhik: false, paksha: "vadi", day: 14, samvat: 2083 }],
    ["2026-11-09", { month: 8, adhik: false, paksha: "vadi", day: 15, samvat: 2083 }],
    ["2026-03-19", { month: 1, adhik: false, paksha: "vadi", day: 15, samvat: 2083 }],
    ["2026-03-20", { month: 1, adhik: false, paksha: "sudi", day: 2, samvat: 2083 }],
  ] satisfies [string, BikramiDate][])("%s", (iso, expected) => {
    expect(bikrami(local(iso))).toEqual(expected);
  });
});

describe("Samvat", () => {
  it("changes at Chaitra Shukla Pratipada, 19 March 2026", () => {
    expect(bikrami(local("2026-03-18")).samvat).toBe(2082);
    expect(bikrami(local("2026-03-19")).samvat).toBe(2083);
    expect(bikrami(local("2026-01-01")).samvat).toBe(2082);
    expect(bikrami(local("2026-12-31")).samvat).toBe(2083);
  });

  // 2029 is the one generated year with an adhik Chaitra (16 March to 13 April). Drik Panchang
  // (read 2026-10-15, Hanoi, UTC+7) lists "Vikrama Samvata 2086 Begins" on 14 April 2029, in the
  // nija month, with Pratipada running 04:39 on 14 Apr to 07:02 on 15 Apr (03:09 to 05:32 IST),
  // so the sunrise tithi is Pratipada on 14 Apr:
  // https://www.drikpanchang.com/festivals/samvat-newyear/new-hindu-samvata-year-begins.html?year=2029
  it("changes in the nija month, not the adhik one, in 2029", () => {
    expect(data.get(2029)?.months.filter(([, m, adhik]) => m === 0 && adhik === 1)).toHaveLength(1);
    expect(bikrami(local("2029-03-16"))).toMatchObject({ month: 1, adhik: true, samvat: 2085 });
    expect(bikrami(local("2029-04-13")).samvat).toBe(2085);
    expect(bikrami(local("2029-04-14"))).toEqual({
      month: 1,
      adhik: false,
      paksha: "sudi",
      day: 1,
      samvat: 2086,
    });
  });

  it("goes up by exactly one a year, in March or April", () => {
    let previous = bikrami(local("2026-01-01")).samvat;
    let changes = 0;
    for (let date = local("2026-01-02"); date.getFullYear() <= 2036; date = addDays(date, 1)) {
      const { samvat } = bikrami(date);
      if (samvat !== previous) {
        expect(samvat).toBe(previous + 1);
        expect([2, 3]).toContain(date.getMonth());
        changes++;
        previous = samvat;
      }
    }
    expect(changes).toBe(11);
  });
});

describe("month starts", () => {
  it.each(purnimantaMonths2026)("%s starts month %i (adhik %i)", (iso, monthIndex, adhik) => {
    const result = bikrami(local(iso));
    expect(result.month).toBe(monthIndex + 1);
    expect(result.adhik).toBe(adhik === 1);
    // A month that follows a full moon starts in the dark fortnight. An adhik month and the nija
    // month after it start at the new moon, in the bright one.
    const atNewMoon = iso === "2026-05-17" || iso === "2026-06-16";
    expect(result.paksha).toBe(atNewMoon ? "sudi" : "vadi");
    // Day 1, or day 2 when the first tithi is skipped at sunrise.
    expect([1, 2]).toContain(result.day);
  });

  it("labels days inside adhik Jeth, and not those either side", () => {
    expect(format(local("2026-05-17"))).toMatch(/^Adhik Jeth Sudi [12], Samvat 2083$/);
    expect(format(local("2026-06-15"))).toBe("Adhik Jeth Vadi 15, Samvat 2083");
    expect(format(local("2026-06-16"))).toMatch(/^Jeth Sudi [12], Samvat 2083$/);
    expect(format(local("2026-05-16"))).toBe("Jeth Vadi 15, Samvat 2083");
  });
});

describe("tithi fixtures", () => {
  it.each(masya2026)("%s is Vadi 15 (masya)", (iso) => {
    expect(bikrami(local(iso))).toMatchObject({ paksha: "vadi", day: 15 });
  });

  it.each(puranmashi2026)("%s is Sudi 15, or Sudi 14 when purnima begins that day", (iso) => {
    const today = bikrami(local(iso));
    const next = bikrami(addDays(local(iso), 1));
    const purnima = today.day === 15 && today.paksha === "sudi";
    const beginsToday = today.day === 14 && today.paksha === "sudi" && next.paksha === "vadi";
    expect(purnima || beginsToday).toBe(true);
  });
});

describe("every day from 2026 to 2036", () => {
  // Sudi 1-15 is tithi 1-15 and Vadi 1-15 is tithi 16-30.
  const tithiOf = (b: BikramiDate) => (b.paksha === "sudi" ? b.day : b.day + 15);

  it("advances the tithi by 0 to 2 and the month one name at a time", () => {
    let previous = bikrami(local("2026-01-01"));
    for (let date = local("2026-01-02"); date.getFullYear() <= 2036; date = addDays(date, 1)) {
      const current = bikrami(date);
      const where = `${date.toDateString()}: ${JSON.stringify(previous)} then ${JSON.stringify(current)}`;
      // 0 is a repeated tithi, 2 a skipped one.
      const step = (tithiOf(current) - tithiOf(previous) + 30) % 30;
      if (step > 2) throw new Error(`tithi jump, ${where}`);
      const nextMonth = current.month === (previous.month % 12) + 1 && !current.adhik;
      // The same name repeats only into or out of an adhik month.
      const aroundAdhik = current.month === previous.month && current.adhik !== previous.adhik;
      const sameMonth = current.month === previous.month && current.adhik === previous.adhik;
      if (!(nextMonth || aroundAdhik || sameMonth)) throw new Error(`month jump, ${where}`);
      previous = current;
    }
  });

  it("continues across 31 December into the next year's file", () => {
    for (let year = 2026; year < 2036; year++) {
      const dec31 = bikrami(new Date(year, 11, 31));
      const jan1 = bikrami(new Date(year + 1, 0, 1));
      expect((tithiOf(jan1) - tithiOf(dec31) + 30) % 30).toBeLessThanOrEqual(2);
      expect(jan1.month === dec31.month || jan1.month === (dec31.month % 12) + 1).toBe(true);
    }
  });
});

describe("errors", () => {
  it("throws on an invalid date", () => {
    expect(() => toBikrami(new Date(Number.NaN), dataFor(local("2026-01-01")))).toThrow(RangeError);
  });

  it("throws when the data is for a different year", () => {
    expect(() => toBikrami(local("2027-01-01"), dataFor(local("2026-01-01")))).toThrow(RangeError);
  });
});
