import { describe, expect, it, vi } from "vitest";
import { festivals } from "../src/festivals/festivals.ts";
import { festivalLines } from "../src/festivals/lines.ts";
import type { Festival } from "../src/festivals/rules.ts";
import { en } from "../src/strings/en.ts";
import { local, yearData } from "./fixtures/years.ts";

const load = vi.fn(async (year: number) => yearData(year));
const sets = ["cultural", "sikh"] as const;

describe("festival names", () => {
  it.each(festivals)("$id has a name", ({ id }) => {
    expect(Object.keys(en.festivals)).toContain(id);
  });
});

describe("festivalLines", () => {
  // Dates are the sourced ones in tests/fixtures/festivals.ts.
  it("gives only a Today line on the day of a festival", async () => {
    expect(await festivalLines(local("2026-11-24"), sets, load)).toEqual({
      today: "Today: Prakash Purab Guru Nanak Dev Ji",
    });
  });

  it("gives only a Tomorrow line on the eve of a festival", async () => {
    expect(await festivalLines(local("2026-11-23"), sets, load)).toEqual({
      tomorrow: "Tomorrow: Prakash Purab Guru Nanak Dev Ji",
    });
  });

  it("gives both lines when both days have a festival", async () => {
    // Lohri is the eve of Maghi.
    expect(await festivalLines(local("2026-01-13"), sets, load)).toEqual({
      today: "Today: Lohri",
      tomorrow: "Tomorrow: Maghi",
    });
  });

  it("joins festivals on one day in list order", async () => {
    expect(await festivalLines(local("2026-04-14"), sets, load)).toEqual({
      today: "Today: Vaisakhi · Khalsa Sajna Divas",
    });
  });

  it("gives no line when nothing falls on either day", async () => {
    expect(await festivalLines(local("2026-02-20"), sets, load)).toEqual({});
  });

  it("leaves out a festival whose set is not enabled", async () => {
    expect(await festivalLines(local("2026-04-14"), ["cultural"], load)).toEqual({
      today: "Today: Vaisakhi",
    });
  });
});

describe("year boundaries and missing data", () => {
  // A synthetic list puts a festival on 1 Jan and on 31 Dec, which no real festival falls on.
  const newYear: Festival = {
    id: "maghi",
    set: "cultural",
    rule: { kind: "gregorian", month: 1, day: 1 },
  };
  const yearEnd: Festival = {
    id: "lohri",
    set: "cultural",
    rule: { kind: "gregorian", month: 12, day: 31 },
  };

  it("reads Tomorrow from the next year's file on 31 December", async () => {
    load.mockClear();
    expect(await festivalLines(local("2026-12-31"), sets, load, [newYear])).toEqual({
      tomorrow: "Tomorrow: Maghi",
    });
    expect(load.mock.calls.map(([year]) => year).sort()).toEqual([2026, 2027]);
  });

  it("reads Today from the new year's file on 1 January", async () => {
    expect(await festivalLines(local("2027-01-01"), sets, load, [newYear])).toEqual({
      today: "Today: Maghi",
    });
  });

  it.each(["2025-06-01", "2037-06-01"])(
    "returns no lines for %s, which has no file",
    async (iso) => {
      expect(await festivalLines(local(iso), sets, load)).toEqual({});
    },
  );

  it("keeps the Today line when only next year's file is missing", async () => {
    expect(await festivalLines(local("2036-12-31"), sets, load, [yearEnd])).toEqual({
      today: "Today: Lohri",
    });
  });

  it("throws for an invalid date", async () => {
    await expect(festivalLines(new Date(Number.NaN), sets, load)).rejects.toThrow(RangeError);
  });
});
