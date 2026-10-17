import { readdirSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findSankrantis, type LunisolarYear, type SolarYear } from "../scripts/calendar-math.ts";
import { dataCalendars } from "../scripts/calendars.ts";
import {
  masya2026,
  puranmashi2026,
  purnimantaMonths2026,
  sangrand2026,
  sangrand2027First3,
} from "./fixtures/calendar.ts";
import { readCalendarFile } from "./fixtures/years.ts";

function load(year: number): SolarYear & LunisolarYear {
  return {
    ...readCalendarFile<SolarYear>("punjabi-solar", year),
    ...readCalendarFile<LunisolarYear>("bikrami", year),
  };
}

const years = Array.from({ length: 11 }, (_, i) => 2026 + i);
const dayIndex = (iso: string, year: number) =>
  (Date.parse(`${iso}T00:00:00Z`) - Date.UTC(year, 0, 1)) / 86_400_000;

// Drik Panchang sankranti tables, read 2026-10-15, shown for Hanoi (UTC+7):
// https://www.drikpanchang.com/sankranti/sankranti.html?year=2026 (and ?year=2027)
// [sign entered (0 = Mesha), Hanoi time]
const drik: [number, string][] = [
  [9, "2026-01-14T16:43"],
  [10, "2026-02-13T05:44"],
  [11, "2026-03-15T02:38"],
  [0, "2026-04-14T11:08"],
  [1, "2026-05-15T07:58"],
  [2, "2026-06-15T14:29"],
  [3, "2026-07-17T01:15"],
  [4, "2026-08-17T09:34"],
  [5, "2026-09-17T09:28"],
  [6, "2026-10-17T21:27"],
  [7, "2026-11-16T21:18"],
  [8, "2026-12-16T11:59"],
  [9, "2027-01-14T22:44"],
  [10, "2027-02-13T11:43"],
  [11, "2027-03-15T08:34"],
  [0, "2027-04-14T17:03"],
  [1, "2027-05-15T13:54"],
  [2, "2027-06-15T20:30"],
  [3, "2027-07-17T07:22"],
  [4, "2027-08-17T15:46"],
  [5, "2027-09-17T15:44"],
  [6, "2027-10-18T03:42"],
  [7, "2027-11-17T03:32"],
  [8, "2027-12-16T18:12"],
];

describe("sankranti instants", () => {
  const computed = findSankrantis(
    new Date("2026-01-01T00:00:00Z"),
    new Date("2027-12-31T00:00:00Z"),
  );

  it("matches the Drik Panchang table within two minutes", () => {
    expect(computed).toHaveLength(drik.length);
    drik.forEach(([rashi, hanoi], i) => {
      const got = computed[i];
      expect(got?.rashi).toBe(rashi);
      const diffMs = Math.abs((got?.time.getTime() ?? 0) - Date.parse(`${hanoi}:00+07:00`));
      expect(diffMs).toBeLessThanOrEqual(2 * 60_000);
    });
  });
});

describe("sangrand days", () => {
  it("match the SGPC-based 2026 lists", () => {
    expect(load(2026).sangrand.slice(1)).toEqual(sangrand2026);
  });

  it("match the 2027 dates the source lists", () => {
    expect(load(2027).sangrand.slice(1, 4)).toEqual(sangrand2027First3);
  });

  it("carry the previous December sangrand into each file", () => {
    expect(load(2026).sangrand[0]).toBe("2025-12-15");
    expect(load(2027).sangrand[0]).toBe("2026-12-16");
  });
});

describe("tithi at sunrise", () => {
  const { tithi } = load(2026);
  const at = (iso: string) => tithi[dayIndex(iso, 2026)];

  it("is 30 on every listed masya", () => {
    for (const iso of masya2026) expect(at(iso)).toBe(30);
  });

  it("is 15 on a listed puranmashi, or 14 when purnima begins during that day", () => {
    for (const iso of puranmashi2026) {
      const next = at(
        new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10),
      );
      const today = at(iso);
      expect(today === 15 || (today === 14 && next === 16)).toBe(true);
    }
  });
});

describe("Purnimanta months", () => {
  it("start the day after each 2026 puranmashi, with adhik Jeth from 17 May to 15 June", () => {
    expect(load(2026).months.slice(1)).toEqual(purnimantaMonths2026);
  });
});

describe("all generated files", () => {
  it.each(years)("%i has the expected shape", (year) => {
    const data = load(year);
    const days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
    expect(data.year).toBe(year);
    expect(data.sangrand).toHaveLength(13);
    expect([...data.sangrand].sort()).toEqual(data.sangrand);
    expect(data.sangrand[0]?.startsWith(`${year - 1}-`)).toBe(true);
    expect(data.sangrand.slice(1).every((d) => d.startsWith(`${year}-`))).toBe(true);
    expect(data.tithi).toHaveLength(days);
    expect(data.tithi.every((t) => t >= 1 && t <= 30)).toBe(true);
    expect(data.months.length).toBeGreaterThanOrEqual(13);
    expect(data.months.length).toBeLessThanOrEqual(15);
    const starts = data.months.map((m) => m[0]);
    expect([...starts].sort()).toEqual(starts);
    expect(new Set(starts).size).toBe(starts.length);
  });

  // Freshness against the generator is `pnpm check:calendar`, which CI and `pnpm check` run on the
  // exact bytes; repeating it here would compute every calendar a second time.
  describe.each(dataCalendars)("$id", ({ id }) => {
    it.each(years)("%i is under 6 KB", (year) => {
      const size = statSync(new URL(`../data/calendar/${id}/${year}.json`, import.meta.url)).size;
      expect(size).toBeLessThan(6 * 1024);
    });
  });

  it("has one folder per calendar definition and no other", () => {
    const folders = readdirSync(new URL("../data/calendar/", import.meta.url), {
      withFileTypes: true,
    });
    expect(folders.every((f) => f.isDirectory())).toBe(true);
    expect(folders.map((f) => f.name).sort()).toEqual(dataCalendars.map((c) => c.id).sort());
  });

  it("has consecutive months that advance one name at a time", () => {
    for (const year of years) {
      const months = load(year).months;
      for (let i = 1; i < months.length; i++) {
        const [, prev, prevAdhik] = months[i - 1] ?? [];
        const [, name, adhik] = months[i] ?? [];
        if (prev === undefined || name === undefined) throw new Error("missing month");
        const sameName = name === prev;
        const nextName = name === (prev + 1) % 12;
        // The same name repeats only around an adhik month.
        expect(nextName || (sameName && (adhik === 1 || prevAdhik === 1))).toBe(true);
      }
    }
  });
});
