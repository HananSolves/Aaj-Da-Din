import { describe, expect, it } from "vitest";
import { formatNanakshahi, toNanakshahi } from "../src/calendars/nanakshahi.ts";

// [Gregorian year, month (1-12), day] -> expected [day, Nanakshahi month (1 = Chet), year]
type Case = [[number, number, number], [number, number, number]];

function convert([y, m, d]: [number, number, number]): [number, number, number] {
  const ns = toNanakshahi(new Date(y, m - 1, d));
  return [ns.day, ns.month, ns.year];
}

describe("toNanakshahi boundaries", () => {
  // First and last day of every month for NS year 558 (14 Mar 2026 to 13 Mar 2027), non-leap.
  const cases: Case[] = [
    [
      [2026, 3, 14],
      [1, 1, 558],
    ],
    [
      [2026, 4, 13],
      [31, 1, 558],
    ],
    [
      [2026, 4, 14],
      [1, 2, 558],
    ],
    [
      [2026, 5, 14],
      [31, 2, 558],
    ],
    [
      [2026, 5, 15],
      [1, 3, 558],
    ],
    [
      [2026, 6, 14],
      [31, 3, 558],
    ],
    [
      [2026, 6, 15],
      [1, 4, 558],
    ],
    [
      [2026, 7, 15],
      [31, 4, 558],
    ],
    [
      [2026, 7, 16],
      [1, 5, 558],
    ],
    [
      [2026, 8, 15],
      [31, 5, 558],
    ],
    [
      [2026, 8, 16],
      [1, 6, 558],
    ],
    [
      [2026, 9, 14],
      [30, 6, 558],
    ],
    [
      [2026, 9, 15],
      [1, 7, 558],
    ],
    [
      [2026, 10, 14],
      [30, 7, 558],
    ],
    [
      [2026, 10, 15],
      [1, 8, 558],
    ],
    [
      [2026, 11, 13],
      [30, 8, 558],
    ],
    [
      [2026, 11, 14],
      [1, 9, 558],
    ],
    [
      [2026, 12, 13],
      [30, 9, 558],
    ],
    [
      [2026, 12, 14],
      [1, 10, 558],
    ],
    [
      [2027, 1, 12],
      [30, 10, 558],
    ],
    [
      [2027, 1, 13],
      [1, 11, 558],
    ],
    [
      [2027, 2, 11],
      [30, 11, 558],
    ],
    [
      [2027, 2, 12],
      [1, 12, 558],
    ],
    [
      [2027, 3, 13],
      [30, 12, 558],
    ],
  ];

  it.each(cases)("%j is %j", (gregorian, expected) => {
    expect(convert(gregorian)).toEqual(expected);
  });

  it("changes the Nanakshahi year on 14 March", () => {
    expect(convert([2026, 3, 13])).toEqual([30, 12, 557]);
    expect(convert([2026, 3, 14])).toEqual([1, 1, 558]);
    expect(convert([2027, 3, 13])).toEqual([30, 12, 558]);
    expect(convert([2027, 3, 14])).toEqual([1, 1, 559]);
  });

  it("carries Poh across the Gregorian new year", () => {
    expect(convert([2026, 12, 31])).toEqual([18, 10, 558]);
    expect(convert([2027, 1, 1])).toEqual([19, 10, 558]);
  });

  it("gives Phagun a 31st day only in a Gregorian leap year", () => {
    expect(convert([2028, 2, 29])).toEqual([18, 12, 559]);
    expect(convert([2028, 3, 13])).toEqual([31, 12, 559]);
    expect(convert([2028, 3, 14])).toEqual([1, 1, 560]);
  });

  it("converts the day the plan uses as its example", () => {
    expect(convert([2026, 10, 11])).toEqual([27, 7, 558]);
  });

  it("ignores the time of day", () => {
    expect(toNanakshahi(new Date(2026, 9, 14, 23, 59, 59))).toEqual({
      day: 30,
      month: 7,
      year: 558,
    });
    expect(toNanakshahi(new Date(2026, 9, 15, 0, 0, 0))).toEqual({ day: 1, month: 8, year: 558 });
  });

  it("throws on an Invalid Date", () => {
    expect(() => toNanakshahi(new Date(Number.NaN))).toThrow(RangeError);
  });
});

describe("toNanakshahi sweep 2026 to 2036", () => {
  const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];

  function isLeap(year: number): boolean {
    return new Date(year, 1, 29).getMonth() === 1;
  }

  // Phagun begins on 12 Feb and ends on 13 Mar of the same Gregorian year.
  function lengthOf(month: number, gregorianYear: number): number {
    return month === 12 ? (isLeap(gregorianYear) ? 31 : 30) : (monthLengths[month - 1] ?? 0);
  }

  const counts = new Map<string, number>();
  const end = new Date(2036, 11, 31);
  let prev = toNanakshahi(new Date(2026, 0, 1));
  counts.set(`${prev.year}-${prev.month}`, 1);

  for (
    let d = new Date(2026, 0, 2);
    d <= end;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    const cur = toNanakshahi(d);
    const sameMonth = cur.month === prev.month;
    const expectedDay = sameMonth ? prev.day + 1 : 1;
    const expectedMonth = sameMonth ? prev.month : (prev.month % 12) + 1;
    const expectedYear = cur.month === 1 && !sameMonth ? prev.year + 1 : prev.year;
    const prevGregorianYear = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() - 1,
    ).getFullYear();
    if (
      cur.day !== expectedDay ||
      cur.month !== expectedMonth ||
      cur.year !== expectedYear ||
      prev.day > lengthOf(prev.month, prevGregorianYear)
    ) {
      throw new Error(
        `Sweep broke at ${d.toDateString()}: ${JSON.stringify(prev)} then ${JSON.stringify(cur)}`,
      );
    }
    counts.set(`${cur.year}-${cur.month}`, (counts.get(`${cur.year}-${cur.month}`) ?? 0) + 1);
    prev = cur;
  }

  it("advances one day at a time and rolls month and year only at the boundaries", () => {
    expect(prev).toEqual({ day: 18, month: 10, year: 568 });
  });

  it("gives every complete Nanakshahi year the right month lengths", () => {
    // NS 558 (starts 14 Mar 2026) to NS 567 (ends 13 Mar 2036) lie fully inside the sweep.
    for (let year = 558; year <= 567; year++) {
      let total = 0;
      for (let month = 1; month <= 12; month++) {
        const length = lengthOf(month, year + 1469);
        expect(counts.get(`${year}-${month}`), `NS ${year} month ${month}`).toBe(length);
        total += length;
      }
      expect(total).toBe(isLeap(year + 1469) ? 366 : 365);
    }
  });
});

// Published-source fixtures (project-plan §3.4.2: verify against a published Nanakshahi source).
//
// Source 1: "Nanakshahi Calendar - 2003", the fixed-date Gurpurab list of the original 2003
// calendar, as reproduced at https://khalsaspirit.com/wp-content/uploads/files/NanakshahiCalendar.pdf
// (read 2026-10-15). Each row below is a "<day> <month> / <Gregorian date>" pair copied from it, so
// the expected values do not come from the converter. The document gives no Nanakshahi year number.
// The document spells the eighth month "Katik", while the app uses "Katak" (project-plan §3.4.2).
//
// Source 2: https://en.wikipedia.org/wiki/Nanakshahi_calendar (read 2026-10-15): "15 October 2026 CE
// is Nanakshahi 558", year 1 being 1469 CE, and Phagun having an extra day in a leap year.
describe("toNanakshahi against the published 2003 calendar", () => {
  // [Gregorian month, Gregorian day, Nanakshahi day, Nanakshahi month (1 = Chet)], all in 2003.
  const fixtures: [number, number, number, number][] = [
    [3, 14, 1, 1], // 1 Chet / 14 March (New Year Day)
    [3, 19, 6, 1], // 6 Chet / 19 March
    [4, 14, 1, 2], // 1 Vaisakh / 14 April
    [4, 16, 3, 2], // 3 Vaisakh / 16 April
    [4, 18, 5, 2], // 5 Vaisakh / 18 April
    [5, 2, 19, 2], // 19 Vaisakh / 2 May
    [5, 15, 1, 3], // 1 Jeth / 15 May
    [5, 23, 9, 3], // 9 Jeth / 23 May
    [6, 11, 28, 3], // 28 Jeth / 11 June
    [6, 15, 1, 4], // 1 Harh / 15 June
    [6, 16, 2, 4], // 2 Harh / 16 June
    [7, 2, 18, 4], // 18 Harh / 2 July
    [7, 5, 21, 4], // 21 Harh / 5 July
    [7, 16, 1, 5], // 1 Sawan / 16 July
    [7, 21, 6, 5], // 6 Sawan / 21 July
    [7, 23, 8, 5], // 8 Sawan / 23 July
    [8, 16, 1, 6], // 1 Bhadon / 16 August
    [8, 30, 15, 6], // 15 Bhadon / 30 August
    [9, 1, 17, 6], // 17 Bhadon / 1 September
    [9, 15, 1, 7], // 1 Assu / 15 September
    [9, 16, 2, 7], // 2 Assu / 16 September
    [9, 18, 4, 7], // 4 Assu / 18 September
    [9, 22, 8, 7], // 8 Assu / 22 September
    [10, 9, 25, 7], // 25 Assu / 9 October
    [10, 15, 1, 8], // 1 Katik / 15 October
    [10, 20, 6, 8], // 6 Katik / 20 October
    [10, 21, 7, 8], // 7 Katik / 21 October
    [11, 14, 1, 9], // 1 Maghar / 14 November
    [11, 24, 11, 9], // 11 Maghar / 24 November
    [12, 14, 1, 10], // 1 Poh / 14 December
    [1, 5, 23, 10], // 23 Poh / 5 January
    [1, 13, 1, 11], // 1 Magh / 13 January
    [1, 31, 19, 11], // 19 Magh / 31 January
    [2, 12, 1, 12], // 1 Phagun / 12 February
  ];

  it.each(fixtures)("%i/%i matches the published day %i of month %i", (m, d, day, month) => {
    const ns = toNanakshahi(new Date(2003, m - 1, d));
    expect([ns.day, ns.month]).toEqual([day, month]);
  });

  it("numbers 15 October 2026 as 1 Katak 558", () => {
    expect(toNanakshahi(new Date(2026, 9, 15))).toEqual({ day: 1, month: 8, year: 558 });
  });
});

describe("formatNanakshahi", () => {
  it("formats the day, month name, year and era", () => {
    expect(formatNanakshahi(new Date(2026, 9, 11))).toBe("27 Assu 558 NS");
    expect(formatNanakshahi(new Date(2026, 2, 14))).toBe("1 Chet 558 NS");
    expect(formatNanakshahi(new Date(2027, 2, 13))).toBe("30 Phagun 558 NS");
  });

  it("names all 12 months in calendar order", () => {
    const names = [14, 14, 15, 15, 16, 16, 15, 15, 14, 14].map(
      (day, i) => formatNanakshahi(new Date(2026, i + 2, day)).split(" ")[1],
    );
    names.push(formatNanakshahi(new Date(2027, 0, 13)).split(" ")[1]);
    names.push(formatNanakshahi(new Date(2027, 1, 12)).split(" ")[1]);
    expect(names).toEqual([
      "Chet",
      "Vaisakh",
      "Jeth",
      "Harh",
      "Sawan",
      "Bhadon",
      "Assu",
      "Katak",
      "Maghar",
      "Poh",
      "Magh",
      "Phagun",
    ]);
  });
});
