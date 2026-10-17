import { describe, expect, it } from "vitest";
import {
  calendarRows,
  moveCalendar,
  toggleCalendar,
  toggleFestivalSet,
} from "../src/settings/edit.ts";
import { type CalendarId, defaultSettings, type Settings } from "../src/settings/types.ts";

const withCalendars = (calendars: CalendarId[]): Settings => ({ ...defaultSettings, calendars });

describe("calendarRows", () => {
  it("lists the enabled calendars in saved order, then the rest in the fixed order", () => {
    expect(calendarRows(withCalendars(["hijri", "punjabi-solar"]))).toEqual([
      { id: "hijri", enabled: true },
      { id: "punjabi-solar", enabled: true },
      { id: "gregorian", enabled: false },
      { id: "bikrami", enabled: false },
      { id: "nanakshahi", enabled: false },
    ]);
  });

  it("has no disabled rows when all five are on", () => {
    const all = withCalendars(["nanakshahi", "gregorian", "hijri", "punjabi-solar", "bikrami"]);
    expect(calendarRows(all).every((row) => row.enabled)).toBe(true);
    expect(calendarRows(all)).toHaveLength(5);
  });
});

describe("toggleCalendar", () => {
  it("appends a calendar that is turned on", () => {
    const next = toggleCalendar(withCalendars(["hijri", "punjabi-solar"]), "gregorian");
    expect(next.calendars).toEqual(["hijri", "punjabi-solar", "gregorian"]);
  });

  it("removes a calendar that is turned off, keeping the order of the rest", () => {
    const next = toggleCalendar(
      withCalendars(["hijri", "punjabi-solar", "gregorian"]),
      "punjabi-solar",
    );
    expect(next.calendars).toEqual(["hijri", "gregorian"]);
  });

  it("keeps the last enabled calendar on", () => {
    const only = withCalendars(["punjabi-solar"]);
    expect(toggleCalendar(only, "punjabi-solar")).toBe(only);
  });

  it("does not mutate its input", () => {
    const before = withCalendars(["hijri", "punjabi-solar"]);
    toggleCalendar(before, "gregorian");
    toggleCalendar(before, "punjabi-solar");
    expect(before.calendars).toEqual(["hijri", "punjabi-solar"]);
  });
});

describe("moveCalendar", () => {
  const three = withCalendars(["hijri", "punjabi-solar", "gregorian"]);

  it("moves a calendar up and down by swapping with its neighbour", () => {
    expect(moveCalendar(three, "gregorian", -1).calendars).toEqual([
      "hijri",
      "gregorian",
      "punjabi-solar",
    ]);
    expect(moveCalendar(three, "hijri", 1).calendars).toEqual([
      "punjabi-solar",
      "hijri",
      "gregorian",
    ]);
  });

  it.each([
    ["the first up", "hijri", -1],
    ["the last down", "gregorian", 1],
  ] as const)("leaves %s alone", (_name, id, delta) => {
    expect(moveCalendar(three, id, delta)).toBe(three);
  });

  it("leaves a disabled calendar alone", () => {
    expect(moveCalendar(three, "nanakshahi", -1)).toBe(three);
  });

  it("does not mutate its input", () => {
    moveCalendar(three, "punjabi-solar", 1);
    expect(three.calendars).toEqual(["hijri", "punjabi-solar", "gregorian"]);
  });
});

describe("toggleFestivalSet", () => {
  const sets = (festivalSets: Settings["festivalSets"]): Settings => ({
    ...defaultSettings,
    festivalSets,
  });

  it("adds a set in the canonical order wherever it was clicked", () => {
    expect(toggleFestivalSet(sets(["sikh"]), "cultural").festivalSets).toEqual([
      "cultural",
      "sikh",
    ]);
    expect(toggleFestivalSet(sets(["cultural", "sikh"]), "muslim").festivalSets).toEqual([
      "cultural",
      "sikh",
      "muslim",
    ]);
  });

  it("removes a set that is on, including the last one", () => {
    expect(toggleFestivalSet(sets(["cultural", "sikh"]), "cultural").festivalSets).toEqual([
      "sikh",
    ]);
    expect(toggleFestivalSet(sets(["sikh"]), "sikh").festivalSets).toEqual([]);
  });

  it("does not mutate its input", () => {
    const before = sets(["sikh"]);
    toggleFestivalSet(before, "hindu");
    expect(before.festivalSets).toEqual(["sikh"]);
  });
});
