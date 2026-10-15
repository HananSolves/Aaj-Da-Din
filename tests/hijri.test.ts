import { describe, expect, it } from "vitest";
import { formatHijri, type HijriOffset, toHijri } from "../src/calendars/hijri.ts";
import { en } from "../src/strings/en.ts";

function convert(y: number, m: number, d: number, offset?: HijriOffset) {
  return toHijri(new Date(y, m - 1, d), offset);
}

describe("toHijri", () => {
  it("returns a day, month and year in range", () => {
    const { day, month, year } = convert(2026, 10, 11);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(30);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
    expect(year).toBe(1448);
  });

  it("ignores the time of day", () => {
    expect(toHijri(new Date(2026, 9, 11, 0, 0, 1))).toEqual(
      toHijri(new Date(2026, 9, 11, 23, 59, 59)),
    );
  });

  it("throws RangeError for an Invalid Date", () => {
    expect(() => toHijri(new Date(Number.NaN))).toThrow(RangeError);
  });
});

describe("toHijri offset", () => {
  // Dates chosen to cross a Gregorian month and year end, and (via the sweep below) Hijri ones.
  const dates: [number, number, number][] = [
    [2026, 10, 11],
    [2026, 12, 31],
    [2027, 1, 1],
    [2027, 2, 28],
    [2028, 2, 29],
  ];

  it.each(dates)("+1 on %i-%i-%i equals offset 0 on the next day", (y, m, d) => {
    expect(convert(y, m, d, 1)).toEqual(convert(y, m, d + 1));
  });

  it.each(dates)("-1 on %i-%i-%i equals offset 0 on the previous day", (y, m, d) => {
    expect(convert(y, m, d, -1)).toEqual(convert(y, m, d - 1));
  });

  it("defaults to no offset", () => {
    expect(convert(2026, 10, 11)).toEqual(convert(2026, 10, 11, 0));
  });

  it("rolls across Hijri month and year ends", () => {
    let monthRollover = false;
    let yearRollover = false;
    for (let i = 0; i < 800; i++) {
      const today = convert(2026, 1, 1 + i);
      const tomorrow = convert(2026, 1, 2 + i);
      expect(convert(2026, 1, 1 + i, 1)).toEqual(tomorrow);
      if (tomorrow.day === 1) {
        monthRollover = true;
        expect(convert(2026, 1, 1 + i, 1).month).not.toBe(today.month);
      }
      if (tomorrow.month === 1 && today.month === 12) {
        yearRollover = true;
        expect(convert(2026, 1, 1 + i, 1).year).toBe(today.year + 1);
      }
    }
    expect(monthRollover).toBe(true);
    expect(yearRollover).toBe(true);
  });
});

describe("toHijri sweep", () => {
  it("moves one day at a time from 2026 to 2036", () => {
    const lengths = new Set<number>();
    let prev = convert(2026, 1, 1);
    let seenMonthStart = false;
    for (let i = 1; new Date(2026, 0, 1 + i).getFullYear() <= 2036; i++) {
      const cur = toHijri(new Date(2026, 0, 1 + i));
      const sameMonth = cur.month === prev.month && cur.year === prev.year;
      if (sameMonth) {
        expect(cur.day).toBe(prev.day + 1);
      } else {
        expect(cur.day).toBe(1);
        expect(cur.month).toBe(prev.month === 12 ? 1 : prev.month + 1);
        expect(cur.year).toBe(prev.month === 12 ? prev.year + 1 : prev.year);
        if (seenMonthStart) lengths.add(prev.day);
        seenMonthStart = true;
      }
      expect(cur.month).toBeGreaterThanOrEqual(1);
      expect(cur.month).toBeLessThanOrEqual(12);
      prev = cur;
    }
    expect([...lengths].sort()).toEqual([29, 30]);
  });
});

// Published umm al-Qura dates, read on 2026-10-15. The official KACST calendar could not be
// reached, so these are two independent pages that reproduce it:
// - Makkah Live, "Key Islamic dates in 1448 AH": day 1 of every month of 1448
//   https://makkahlive.net/en/tools/islamic-calendar
// - H. Gent, Utrecht University, "The Umm al-Qura Calendar of Saudi Arabia": principal dates
//   https://webspace.science.uu.nl/~gent0113/islam/ummalqura_principal.htm
// [Gregorian year, month (1-12), day] -> expected [day, Hijri month (1 = Muharram), year]
describe("toHijri published fixtures", () => {
  const cases: [[number, number, number], [number, number, number]][] = [
    // Makkah Live: month starts of 1448 (Muharram 1448 begins the year after 1447 ends).
    [
      [2026, 6, 16],
      [1, 1, 1448],
    ],
    [
      [2026, 7, 15],
      [1, 2, 1448],
    ],
    [
      [2026, 8, 14],
      [1, 3, 1448],
    ],
    [
      [2026, 9, 12],
      [1, 4, 1448],
    ],
    [
      [2026, 10, 12],
      [1, 5, 1448],
    ],
    [
      [2026, 11, 11],
      [1, 6, 1448],
    ],
    [
      [2026, 12, 10],
      [1, 7, 1448],
    ],
    [
      [2027, 1, 9],
      [1, 8, 1448],
    ],
    [
      [2027, 2, 8],
      [1, 9, 1448],
    ],
    [
      [2027, 3, 9],
      [1, 10, 1448],
    ],
    [
      [2027, 4, 8],
      [1, 11, 1448],
    ],
    [
      [2027, 5, 7],
      [1, 12, 1448],
    ],
    // Last day of the month before each start, from the 29 or 30 day lengths Makkah Live lists.
    [
      [2026, 7, 14],
      [29, 1, 1448],
    ],
    [
      [2026, 10, 11],
      [30, 4, 1448],
    ],
    [
      [2027, 5, 6],
      [29, 11, 1448],
    ],
    // Gent: Hijri year changeover, 1 Muharram 1449, and the day before it.
    [
      [2027, 6, 6],
      [1, 1, 1449],
    ],
    [
      [2027, 6, 5],
      [30, 12, 1448],
    ],
    // Gent: principal dates of 1447 and 1448.
    [
      [2025, 6, 26],
      [1, 1, 1447],
    ],
    [
      [2026, 2, 18],
      [1, 9, 1447],
    ],
    [
      [2026, 3, 20],
      [1, 10, 1447],
    ],
    [
      [2026, 5, 27],
      [10, 12, 1447],
    ],
    [
      [2026, 8, 25],
      [12, 3, 1448],
    ],
    [
      [2027, 5, 16],
      [10, 12, 1448],
    ],
  ];

  it.each(cases)("%j is %j", ([y, m, d], [day, month, year]) => {
    expect(convert(y, m, d)).toEqual({ day, month, year });
  });
});

describe("formatHijri", () => {
  it("formats 11 October 2026 from the published fixtures", () => {
    expect(formatHijri(new Date(2026, 9, 11))).toBe("30 Rabi al-Thani 1448 AH");
  });

  it("applies the offset", () => {
    expect(formatHijri(new Date(2026, 9, 11), 1)).toBe("1 Jumada al-Awwal 1448 AH");
    expect(formatHijri(new Date(2026, 9, 11), -1)).toBe("29 Rabi al-Thani 1448 AH");
  });

  it("names all 12 months in order from their published first days", () => {
    const firstDays = [
      new Date(2026, 5, 16),
      new Date(2026, 6, 15),
      new Date(2026, 7, 14),
      new Date(2026, 8, 12),
      new Date(2026, 9, 12),
      new Date(2026, 10, 11),
      new Date(2026, 11, 10),
      new Date(2027, 0, 9),
      new Date(2027, 1, 8),
      new Date(2027, 2, 9),
      new Date(2027, 3, 8),
      new Date(2027, 4, 7),
    ];
    expect(firstDays.map((d) => formatHijri(d))).toEqual(
      en.hijriMonths.map((name) => `1 ${name} 1448 AH`),
    );
  });
});
