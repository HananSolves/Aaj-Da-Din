import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type CalendarYear,
  loadCalendarYear,
  localIso,
  locate,
} from "../src/calendars/year-data.ts";

const years = Array.from({ length: 11 }, (_, i) => 2026 + i);

function fromFile(year: number): CalendarYear {
  return JSON.parse(
    readFileSync(new URL(`../data/calendar/${year}.json`, import.meta.url), "utf8"),
  );
}

describe("loadCalendarYear", () => {
  it.each(years)("returns the bundled data for %i", async (year) => {
    expect(await loadCalendarYear(year)).toEqual(fromFile(year));
  });

  it.each([2025, 2037])("returns undefined for %i, which has no file", async (year) => {
    expect(await loadCalendarYear(year)).toBeUndefined();
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
