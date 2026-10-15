import { describe, expect, it, vi } from "vitest";
import { festivals } from "../src/festivals/festivals.ts";
import { festivalLines } from "../src/festivals/lines.ts";
import type { Festival } from "../src/festivals/rules.ts";
import { en } from "../src/strings/en.ts";
import { local, yearData } from "./fixtures/years.ts";

const load = vi.fn(async (year: number) => yearData(year));
const query = { sets: ["cultural", "sikh"] } as const;

describe("festival names", () => {
  it.each(festivals)("$id has a name", ({ id }) => {
    expect(Object.keys(en.festivals)).toContain(id);
  });
});

describe("festivalLines", () => {
  // Dates are the sourced ones in tests/fixtures/festivals.ts.
  it("gives only a Today line on the day of a festival", async () => {
    expect(await festivalLines(local("2026-11-24"), query, load)).toEqual({
      today: "Today: Prakash Purab Guru Nanak Dev Ji",
    });
  });

  it("gives only a Tomorrow line on the eve of a festival", async () => {
    expect(await festivalLines(local("2026-11-23"), query, load)).toEqual({
      tomorrow: "Tomorrow: Prakash Purab Guru Nanak Dev Ji",
    });
  });

  it("gives both lines when both days have a festival", async () => {
    // Lohri is the eve of Maghi.
    expect(await festivalLines(local("2026-01-13"), query, load)).toEqual({
      today: "Today: Lohri",
      tomorrow: "Tomorrow: Maghi",
    });
  });

  it("joins festivals on one day in list order", async () => {
    expect(await festivalLines(local("2026-04-14"), query, load)).toEqual({
      today: "Today: Vaisakhi · Khalsa Sajna Divas",
    });
  });

  it("gives no line when nothing falls on either day", async () => {
    expect(await festivalLines(local("2026-02-20"), query, load)).toEqual({});
  });

  it("leaves out a festival whose set is not enabled", async () => {
    expect(await festivalLines(local("2026-04-14"), { sets: ["cultural"] }, load)).toEqual({
      today: "Today: Vaisakhi",
    });
  });
});

describe("Hindu festival lines", () => {
  const withHindu = { sets: ["cultural", "hindu", "sikh"] } as const;

  it("joins Hindu and Sikh festivals on one day, Hindu first", async () => {
    // Diwali and Bandi Chhor Divas are both 8 Nov 2026 (tests/fixtures/festivals.ts).
    expect(await festivalLines(local("2026-11-08"), withHindu, load)).toEqual({
      today: "Today: Diwali · Bandi Chhor Divas",
    });
    expect(await festivalLines(local("2026-11-08"), query, load)).toEqual({
      today: "Today: Bandi Chhor Divas",
    });
  });

  it("joins Holi and Hola Mohalla on 4 Mar 2026", async () => {
    expect(await festivalLines(local("2026-03-04"), withHindu, load)).toEqual({
      today: "Today: Holi · Hola Mohalla",
    });
  });

  it("gives a Tomorrow line on the eve of a Hindu festival", async () => {
    expect(await festivalLines(local("2027-10-28"), withHindu, load)).toEqual({
      tomorrow: "Tomorrow: Diwali",
    });
  });

  it("shows no Hindu line in a year with no sourced dates", async () => {
    expect(await festivalLines(local("2032-11-02"), withHindu, load)).toEqual({});
  });
});

describe("Muslim festival lines", () => {
  const withMuslim = { sets: ["cultural", "sikh", "muslim"] } as const;

  it("marks every Muslim festival as expected", async () => {
    // 1 Shawwal 1448 is 9 March 2027 (tests/fixtures/festivals.ts).
    expect(await festivalLines(local("2027-03-08"), withMuslim, load)).toEqual({
      tomorrow: "Tomorrow: Eid al-Fitr (expected)",
    });
    expect(await festivalLines(local("2027-03-09"), withMuslim, load)).toEqual({
      today: "Today: Eid al-Fitr (expected)",
    });
  });

  it("shows nothing for the Muslim set when it is not enabled", async () => {
    expect(await festivalLines(local("2027-03-09"), query, load)).toEqual({});
  });

  it("moves Eid with the Hijri offset", async () => {
    expect(
      await festivalLines(local("2027-03-08"), { ...withMuslim, hijriOffset: 1 }, load),
    ).toEqual({ today: "Today: Eid al-Fitr (expected)" });
  });
});

describe("Gurpurab source lines", () => {
  const original = { sets: ["cultural", "sikh"], source: "nanakshahi" } as const;

  it("shows a moved Gurpurab on its fixed date with the source named", async () => {
    // Guru Arjan Dev Ji, 2 Harh = 16 Jun (tests/fixtures/festivals.ts); the SGPC day is 18 Jun.
    expect(await festivalLines(local("2026-06-16"), original, load)).toEqual({
      today: "Today: Shaheedi Purab Guru Arjan Dev Ji (Original Nanakshahi)",
    });
    expect(await festivalLines(local("2026-06-15"), original, load)).toEqual({
      tomorrow: "Tomorrow: Shaheedi Purab Guru Arjan Dev Ji (Original Nanakshahi)",
    });
    expect(await festivalLines(local("2026-06-18"), original, load)).toEqual({});
  });

  it("keeps the SGPC day and no source label by default", async () => {
    expect(await festivalLines(local("2026-06-18"), query, load)).toEqual({
      today: "Today: Shaheedi Purab Guru Arjan Dev Ji",
    });
    expect(await festivalLines(local("2026-06-16"), query, load)).toEqual({});
  });

  it("names no source on a Gurpurab that both sources date alike", async () => {
    // Guru Nanak's Prakash is 24 Nov 2026 under both sources, and Guru Tegh Bahadur Ji's fixed date
    // is also 24 Nov.
    expect(await festivalLines(local("2026-11-24"), original, load)).toEqual({
      today:
        "Today: Prakash Purab Guru Nanak Dev Ji · Shaheedi Purab Guru Tegh Bahadur Ji (Original Nanakshahi)",
    });
  });
});

describe("labels", () => {
  // Synthetic festivals on days with real data: 9 March 2027 is 1 Shawwal 1448 and 14 April 2026
  // is the Vaisakh sangrand. Names that are not in en.festivals show as their id.
  const eid: Festival = { id: "eid", set: "muslim", rule: { kind: "hijri", month: 10, day: 1 } };
  const moved: Festival = {
    id: "moved",
    set: "sikh",
    rule: { kind: "gregorian", month: 3, day: 9 },
    original: { kind: "gregorian", month: 3, day: 10 },
  };
  const plain: Festival = {
    id: "plain",
    set: "sikh",
    rule: { kind: "gregorian", month: 3, day: 9 },
  };
  const all = { sets: ["muslim", "sikh"] } as const;

  it("marks a Hijri festival as expected", async () => {
    expect(await festivalLines(local("2027-03-09"), all, load, [eid])).toEqual({
      today: "Today: eid (expected)",
    });
  });

  it("moves a Hijri festival with the offset and keeps the label", async () => {
    expect(
      await festivalLines(local("2027-03-08"), { ...all, hijriOffset: 1 }, load, [eid]),
    ).toEqual({ today: "Today: eid (expected)" });
  });

  it("names the source of a Gurpurab that the Original Nanakshahi calendar moves", async () => {
    const original = { ...all, source: "nanakshahi" } as const;
    expect(await festivalLines(local("2027-03-10"), original, load, [moved, plain])).toEqual({
      today: "Today: moved (Original Nanakshahi)",
    });
  });

  it("adds no source label under the SGPC source or to a festival with no original date", async () => {
    expect(await festivalLines(local("2027-03-09"), all, load, [moved, plain])).toEqual({
      today: "Today: moved · plain",
    });
    const original = { ...all, source: "nanakshahi" } as const;
    expect(await festivalLines(local("2027-03-09"), original, load, [moved, plain])).toEqual({
      today: "Today: plain",
      tomorrow: "Tomorrow: moved (Original Nanakshahi)",
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
    expect(await festivalLines(local("2026-12-31"), query, load, [newYear])).toEqual({
      tomorrow: "Tomorrow: Maghi",
    });
    expect(load.mock.calls.map(([year]) => year).sort()).toEqual([2026, 2027]);
  });

  it("reads Today from the new year's file on 1 January", async () => {
    expect(await festivalLines(local("2027-01-01"), query, load, [newYear])).toEqual({
      today: "Today: Maghi",
    });
  });

  it.each(["2025-06-01", "2037-06-01"])(
    "returns no lines for %s, which has no file",
    async (iso) => {
      expect(await festivalLines(local(iso), query, load)).toEqual({});
    },
  );

  it("keeps the Today line when only next year's file is missing", async () => {
    expect(await festivalLines(local("2036-12-31"), query, load, [yearEnd])).toEqual({
      today: "Today: Lohri",
    });
  });

  it("throws for an invalid date", async () => {
    await expect(festivalLines(new Date(Number.NaN), query, load)).rejects.toThrow(RangeError);
  });
});
