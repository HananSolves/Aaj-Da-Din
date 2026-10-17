import { describe, expect, it } from "vitest";
import { dataCalendars } from "../scripts/calendars.ts";
import {
  type CalendarYear,
  loadCalendarYear,
  loadFestivalYear,
  localIso,
  locate,
} from "../src/calendars/year-data.ts";
import { firstYear, lastYear, readCalendarFile } from "./fixtures/years.ts";

const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);

function fromFile(year: number): CalendarYear {
  return {
    ...readCalendarFile<CalendarYear>("punjabi-solar", year),
    ...readCalendarFile<CalendarYear>("bikrami", year),
  };
}

describe("loadCalendarYear", () => {
  describe.each(dataCalendars)("$id", ({ id }) => {
    it.each(years)("returns the bundled data for %i", async (year) => {
      expect(await loadCalendarYear(id, year)).toEqual(readCalendarFile(id, year));
    });

    it.each([2025, 2037])("returns undefined for %i, which has no file", async (year) => {
      expect(await loadCalendarYear(id, year)).toBeUndefined();
    });
  });

  it("gives each calendar only its own keys", async () => {
    expect(Object.keys((await loadCalendarYear("punjabi-solar", 2026)) ?? {})).toEqual([
      "year",
      "sangrand",
    ]);
    expect(Object.keys((await loadCalendarYear("bikrami", 2026)) ?? {})).toEqual([
      "year",
      "tithi",
      "months",
    ]);
  });
});

describe("loadFestivalYear", () => {
  it.each(years)("merges both calendars' data for %i", async (year) => {
    expect(await loadFestivalYear(year)).toEqual(fromFile(year));
  });

  it.each([2025, 2037])("returns undefined for %i, which has no files", async (year) => {
    expect(await loadFestivalYear(year)).toBeUndefined();
  });
});

describe("locate", () => {
  const data2026 = fromFile(2026);
  const data2028 = fromFile(2028);

  it("gives the first day of the year index 0", () => {
    expect(locate(new Date(2026, 0, 1), data2026)).toEqual({ iso: "2026-01-01", dayIndex: 0 });
  });

  it("counts the leap day in a leap year", () => {
    expect(locate(new Date(2028, 1, 29), data2028)).toEqual({ iso: "2028-02-29", dayIndex: 59 });
    expect(locate(new Date(2028, 2, 1), data2028)).toEqual({ iso: "2028-03-01", dayIndex: 60 });
  });

  it("gives 31 December the last index of the year", () => {
    expect(locate(new Date(2026, 11, 31), data2026)).toEqual({
      iso: "2026-12-31",
      dayIndex: data2026.tithi.length - 1,
    });
    expect(locate(new Date(2028, 11, 31), data2028).dayIndex).toBe(data2028.tithi.length - 1);
  });

  it("ignores the time of day", () => {
    expect(locate(new Date(2026, 5, 15, 23, 59, 59), data2026).iso).toBe("2026-06-15");
  });

  it("throws on an invalid date", () => {
    expect(() => locate(new Date(Number.NaN), data2026)).toThrow(RangeError);
  });

  it("throws when the data is for a different year", () => {
    expect(() => locate(new Date(2027, 0, 1), data2026)).toThrow(RangeError);
  });
});

describe("localIso", () => {
  it("gives the local date just after and just before midnight", () => {
    expect(localIso(new Date(2026, 9, 15, 0, 30))).toBe("2026-10-15");
    expect(localIso(new Date(2026, 9, 15, 23, 59))).toBe("2026-10-15");
  });

  it("zero-pads the month and day", () => {
    expect(localIso(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
