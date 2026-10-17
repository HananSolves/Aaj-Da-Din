import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadCalendarYear } from "../src/calendars/year-data.ts";
import type { CalendarId } from "../src/settings/types.ts";
import { todayRows } from "../src/ui/today.ts";

vi.mock("../src/calendars/year-data.ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/calendars/year-data.ts")>();
  return { ...original, loadCalendarYear: vi.fn(original.loadCalendarYear) };
});

const hijri = vi.hoisted(() => ({ fail: false }));
vi.mock("../src/calendars/hijri.ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/calendars/hijri.ts")>();
  return {
    ...original,
    formatHijri: (...args: Parameters<typeof original.formatHijri>) => {
      if (hijri.fail) throw new Error("Missing Hijri day: umm al-Qura calendar data unavailable");
      return original.formatHijri(...args);
    },
  };
});

const all: CalendarId[] = ["gregorian", "punjabi-solar", "bikrami", "nanakshahi", "hijri"];
const settings = (calendars: CalendarId[], hijriOffset: -1 | 0 | 1 = 0) => ({
  calendars,
  hijriOffset,
});

// 21 October 2026, each expectation derived from a sourced fixture in the calendar tests:
//  - Punjabi solar: the Katak sangrand is 17 October (punjabi-solar.test.ts, "1 Katak"), so
//    21 October is day 5.
//  - Nanakshahi: Katak starts 15 October (project-plan §3.4.2), so day 7; the year is 558 NS
//    (nanakshahi.test.ts, 11 October is "27 Assu 558 NS").
//  - Bikrami: Dashami is the sunrise tithi on 21 October, Assu Sudi 10, Samvat 2083
//    (Drik Panchang, bikrami.test.ts).
//  - Hijri: 11 October is 30 Rabi al-Thani 1448 AH (hijri.test.ts), so 21 October is 10 Jumada
//    al-Awwal; with a +1 offset it is the 11th.
const day = new Date(2026, 9, 21);
const expected = {
  gregorian: "21 October 2026",
  punjabiSolar: "5 Katak",
  bikrami: "Assu Sudi 10, Samvat 2083",
  nanakshahi: "7 Katak 558 NS",
  hijri: "10 Jumada al-Awwal 1448 AH",
};

const loader = vi.mocked(loadCalendarYear);
const original = loader.getMockImplementation();

beforeEach(() => {
  loader.mockClear();
  if (original) loader.mockImplementation(original);
});

describe("todayRows", () => {
  it("gives one row per calendar with its name and date", async () => {
    expect(await todayRows(day, settings(all))).toEqual([
      { calendar: "gregorian", label: "Gregorian", text: expected.gregorian },
      { calendar: "punjabi-solar", label: "Punjabi solar", text: expected.punjabiSolar },
      { calendar: "bikrami", label: "Bikrami", text: expected.bikrami },
      { calendar: "nanakshahi", label: "Nanakshahi", text: expected.nanakshahi },
      { calendar: "hijri", label: "Hijri", text: expected.hijri },
    ]);
  });

  it("follows the order of settings.calendars", async () => {
    const reversed = [...all].reverse();
    expect((await todayRows(day, settings(reversed))).map((r) => r.calendar)).toEqual(reversed);
    expect(await todayRows(day, settings(["nanakshahi"]))).toEqual([
      { calendar: "nanakshahi", label: "Nanakshahi", text: expected.nanakshahi },
    ]);
  });

  it("leaves out Punjabi solar and Bikrami when the year has no data", async () => {
    const rows = await todayRows(new Date(2037, 0, 5), settings(all));
    expect(rows.map((r) => r.calendar)).toEqual(["gregorian", "nanakshahi", "hijri"]);
  });

  it("moves only the Hijri row with the offset", async () => {
    const base = await todayRows(day, settings(all));
    const shifted = await todayRows(day, settings(all, 1));
    expect(shifted.find((r) => r.calendar === "hijri")?.text).toBe("11 Jumada al-Awwal 1448 AH");
    expect(shifted.filter((r) => r.calendar !== "hijri")).toEqual(
      base.filter((r) => r.calendar !== "hijri"),
    );
  });

  it("leaves out only the Hijri row when the browser cannot convert it", async () => {
    hijri.fail = true;
    try {
      expect((await todayRows(day, settings(all))).map((r) => r.calendar)).toEqual([
        "gregorian",
        "punjabi-solar",
        "bikrami",
        "nanakshahi",
      ]);
    } finally {
      hijri.fail = false;
    }
  });

  it("leaves out only the calendar whose data fails to load", async () => {
    loader.mockImplementation(async (calendar, year) => {
      if (calendar === "punjabi-solar") throw new Error("chunk failed");
      return original?.(calendar, year);
    });
    expect((await todayRows(day, settings(all))).map((r) => r.calendar)).toEqual([
      "gregorian",
      "bikrami",
      "nanakshahi",
      "hijri",
    ]);
  });

  it("rejects on an invalid date", async () => {
    await expect(todayRows(new Date(Number.NaN), settings(all))).rejects.toThrow(RangeError);
  });
});

describe("todayRows data loading", () => {
  it("requests no calendar data when no enabled calendar has any", async () => {
    await todayRows(day, settings(["gregorian", "nanakshahi", "hijri"]));
    expect(loader).not.toHaveBeenCalled();
  });

  it("requests only the data of the enabled calendars, for the year of the date", async () => {
    await todayRows(day, settings(["gregorian", "punjabi-solar"]));
    expect(loader.mock.calls).toEqual([["punjabi-solar", 2026]]);

    loader.mockClear();
    await todayRows(day, settings(["bikrami"]));
    expect(loader.mock.calls).toEqual([["bikrami", 2026]]);
  });
});
