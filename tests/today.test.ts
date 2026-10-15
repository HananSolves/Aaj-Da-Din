import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { CalendarYear } from "../src/calendars/year-data.ts";
import type { CalendarId } from "../src/settings/types.ts";
import { todayRows } from "../src/ui/today.ts";

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

const data2026: CalendarYear = JSON.parse(
  readFileSync(new URL("../data/calendar/2026.json", import.meta.url), "utf8"),
);

const all: CalendarId[] = ["gregorian", "desi", "bikrami", "nanakshahi", "hijri"];
const settings = (calendars: CalendarId[], hijriOffset: -1 | 0 | 1 = 0) => ({
  calendars,
  hijriOffset,
});

// 21 October 2026, each expectation derived from a sourced fixture in the calendar tests:
//  - Desi: the Katak sangrand is 17 October (desi.test.ts, "1 Katak"), so 21 October is day 5.
//  - Nanakshahi: Katak starts 15 October (project-plan §3.4.2), so day 7; the year is 558 NS
//    (nanakshahi.test.ts, 11 October is "27 Assu 558 NS").
//  - Bikrami: Dashami is the sunrise tithi on 21 October, Assu Sudi 10, Samvat 2083
//    (Drik Panchang, bikrami.test.ts).
//  - Hijri: 11 October is 30 Rabi al-Thani 1448 AH (hijri.test.ts), so 21 October is 10 Jumada
//    al-Awwal; with a +1 offset it is the 11th.
const day = new Date(2026, 9, 21);
const expected = {
  gregorian: "21 October 2026",
  desi: "5 Katak",
  bikrami: "Assu Sudi 10, Samvat 2083",
  nanakshahi: "7 Katak 558 NS",
  hijri: "10 Jumada al-Awwal 1448 AH",
};

describe("todayRows", () => {
  it("gives one row per calendar with its name and date", () => {
    expect(todayRows(day, settings(all), data2026)).toEqual([
      { calendar: "gregorian", label: "Gregorian", text: expected.gregorian },
      { calendar: "desi", label: "Desi", text: expected.desi },
      { calendar: "bikrami", label: "Bikrami", text: expected.bikrami },
      { calendar: "nanakshahi", label: "Nanakshahi", text: expected.nanakshahi },
      { calendar: "hijri", label: "Hijri", text: expected.hijri },
    ]);
  });

  it("follows the order of settings.calendars", () => {
    const reversed = [...all].reverse();
    expect(todayRows(day, settings(reversed), data2026).map((r) => r.calendar)).toEqual(reversed);
    expect(todayRows(day, settings(["nanakshahi"]), data2026)).toEqual([
      { calendar: "nanakshahi", label: "Nanakshahi", text: expected.nanakshahi },
    ]);
  });

  it("leaves out Desi and Bikrami when the year has no data", () => {
    expect(todayRows(day, settings(all), undefined).map((r) => r.calendar)).toEqual([
      "gregorian",
      "nanakshahi",
      "hijri",
    ]);
  });

  it("moves only the Hijri row with the offset", () => {
    const base = todayRows(day, settings(all), data2026);
    const shifted = todayRows(day, settings(all, 1), data2026);
    expect(shifted.find((r) => r.calendar === "hijri")?.text).toBe("11 Jumada al-Awwal 1448 AH");
    expect(shifted.filter((r) => r.calendar !== "hijri")).toEqual(
      base.filter((r) => r.calendar !== "hijri"),
    );
  });

  it("leaves out only the Hijri row when the browser cannot convert it", () => {
    hijri.fail = true;
    try {
      expect(todayRows(day, settings(all), data2026).map((r) => r.calendar)).toEqual([
        "gregorian",
        "desi",
        "bikrami",
        "nanakshahi",
      ]);
    } finally {
      hijri.fail = false;
    }
  });

  it("throws on an invalid date", () => {
    expect(() => todayRows(new Date(Number.NaN), settings(all), data2026)).toThrow(RangeError);
  });
});
