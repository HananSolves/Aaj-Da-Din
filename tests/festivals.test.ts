import { describe, expect, it, vi } from "vitest";
import { toHijri } from "../src/calendars/hijri.ts";
import { locate } from "../src/calendars/year-data.ts";
import { festivals } from "../src/festivals/festivals.ts";
import { type Festival, type FestivalQuery, resolveFestivals } from "../src/festivals/rules.ts";
import { sangrand2026 } from "./fixtures/calendar.ts";
import {
  sourcedCultural,
  sourcedHindu,
  sourcedMuslim,
  sourcedOriginalNanakshahi,
  sourcedSikh,
} from "./fixtures/festivals.ts";
import { addDays, dataFor, firstYear, lastYear, local } from "./fixtures/years.ts";

vi.mock("../src/calendars/hijri.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/calendars/hijri.ts")>();
  return { ...actual, toHijri: vi.fn(actual.toHijri) };
});

const on = (
  iso: string,
  list: Festival[],
  sets: FestivalQuery["sets"] = ["cultural", "sikh"],
  rest: Omit<FestivalQuery, "sets"> = {},
) => {
  const date = local(iso);
  return resolveFestivals(date, dataFor(date), { sets, ...rest }, list);
};

const vaisakhSangrand: Festival = {
  id: "vaisakhSangrand",
  set: "cultural",
  rule: { kind: "sangrand", month: 2 },
};
const katakVadi15: Festival = {
  id: "katakVadi15",
  set: "sikh",
  rule: { kind: "tithi", month: 8, paksha: "vadi", day: 15 },
};

describe("sangrand rule", () => {
  // Vaisakh sangrand, 14 April 2026: Punjab Data, cited in tests/fixtures/calendar.ts.
  const sangrand = sangrand2026[3] ?? "";

  it("matches the sangrand day and not the days around it", () => {
    expect(sangrand).toBe("2026-04-14");
    expect(on(sangrand, [vaisakhSangrand])).toEqual(["vaisakhSangrand"]);
    expect(on("2026-04-13", [vaisakhSangrand])).toEqual([]);
    expect(on("2026-04-15", [vaisakhSangrand])).toEqual([]);
  });
});

describe("tithi rule", () => {
  // Amavasya runs 11:27 IST 8 Nov to 12:31 IST 9 Nov 2026 (Drik Panchang, cited in
  // tests/bikrami.test.ts), so the sunrise tithi is Chaturdashi on 8 Nov and Amavasya on 9 Nov.
  it("matches the day the tithi is at sunrise", () => {
    expect(on("2026-11-09", [katakVadi15])).toEqual(["katakVadi15"]);
    expect(on("2026-11-08", [katakVadi15])).toEqual([]);
    expect(on("2026-11-10", [katakVadi15])).toEqual([]);
  });

  it("skips an adhik month and matches the nija month", () => {
    const jethSudi3: Festival = {
      id: "jethSudi3",
      set: "cultural",
      rule: { kind: "tithi", month: 3, paksha: "sudi", day: 3 },
    };
    // Adhik Jeth runs 17 May to 15 June 2026 and nija Jeth Sudi runs 16 to 29 June (Punjab Data,
    // tests/fixtures/calendar.ts). The expected days are the ones whose sunrise tithi in the
    // data file is 3.
    const data = dataFor(local("2026-05-17"));
    const withTithi3 = (from: string, to: string) => {
      const days: string[] = [];
      for (let d = local(from); d <= local(to); d = addDays(d, 1)) {
        const dayIndex = Math.round(
          (Date.UTC(2026, d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86_400_000,
        );
        if (data.tithi[dayIndex] === 3) {
          days.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          );
        }
      }
      return days;
    };
    const inAdhik = withTithi3("2026-05-17", "2026-06-15");
    const inNija = withTithi3("2026-06-16", "2026-06-29");
    expect(inAdhik.length).toBeGreaterThan(0);
    expect(inNija.length).toBeGreaterThan(0);

    for (const iso of inAdhik) {
      expect(on(iso, [jethSudi3])).toEqual([]);
    }
    expect(on(inNija[0] ?? "", [jethSudi3])).toEqual(["jethSudi3"]);
  });

  it("counts a tithi that is at sunrise two days running on the first day only", () => {
    // The 2026 file shows tithi 22 at sunrise on both 9 and 10 January (indices 8 and 9), which is
    // Magh Vadi 7. Magh starts 4 January (tests/fixtures/calendar.ts).
    const data = dataFor(local("2026-01-09"));
    expect(data.tithi[8]).toBe(22);
    expect(data.tithi[9]).toBe(22);
    const maghVadi7: Festival = {
      id: "maghVadi7",
      set: "sikh",
      rule: { kind: "tithi", month: 11, paksha: "vadi", day: 7 },
    };
    expect(on("2026-01-08", [maghVadi7])).toEqual([]);
    expect(on("2026-01-09", [maghVadi7])).toEqual(["maghVadi7"]);
    expect(on("2026-01-10", [maghVadi7])).toEqual([]);
  });
});

describe("gregorian rule", () => {
  const leapDay: Festival = {
    id: "leapDay",
    set: "cultural",
    rule: { kind: "gregorian", month: 2, day: 29 },
  };

  it("matches the day and not the days around it, including 29 February", () => {
    expect(on("2028-02-29", [leapDay])).toEqual(["leapDay"]);
    expect(on("2028-02-28", [leapDay])).toEqual([]);
    expect(on("2028-03-01", [leapDay])).toEqual([]);
  });
});

describe("hijri rule", () => {
  // 1 Shawwal 1448 is Tuesday 9 March 2027 (umm al-Qura, tests/fixtures/festivals.ts).
  const firstShawwal: Festival = {
    id: "firstShawwal",
    set: "muslim",
    rule: { kind: "hijri", month: 10, day: 1 },
  };
  const muslim = ["muslim"] as const;

  it("matches the Hijri day and not the days around it", () => {
    expect(on("2027-03-09", [firstShawwal], muslim)).toEqual(["firstShawwal"]);
    expect(on("2027-03-08", [firstShawwal], muslim)).toEqual([]);
    expect(on("2027-03-10", [firstShawwal], muslim)).toEqual([]);
  });

  it.each([
    [1, "2027-03-08"],
    [-1, "2027-03-10"],
  ] as const)("moves with a Hijri offset of %i", (hijriOffset, iso) => {
    expect(on(iso, [firstShawwal], muslim, { hijriOffset })).toEqual(["firstShawwal"]);
    expect(on("2027-03-09", [firstShawwal], muslim, { hijriOffset })).toEqual([]);
  });

  it("never matches, and does not throw, when umm al-Qura data is unavailable", () => {
    vi.mocked(toHijri).mockImplementationOnce(() => {
      throw new Error("Missing Hijri day: umm al-Qura calendar data unavailable");
    });
    expect(on("2027-03-09", [firstShawwal], muslim)).toEqual([]);
  });

  it("leaves other rule kinds alone when umm al-Qura data is unavailable", () => {
    vi.mocked(toHijri).mockImplementation(() => {
      throw new Error("unavailable");
    });
    try {
      expect(on("2026-04-14", [vaisakhSangrand, firstShawwal], ["cultural", "muslim"])).toEqual([
        "vaisakhSangrand",
      ]);
    } finally {
      vi.mocked(toHijri).mockRestore();
    }
  });
});

describe("original rule", () => {
  // Listed SGPC day and fixed Original Nanakshahi day, 18 and 16 June (tests/fixtures/festivals.ts).
  const split: Festival = {
    id: "split",
    set: "sikh",
    rule: { kind: "dates", dates: ["2026-06-18"] },
    original: { kind: "gregorian", month: 6, day: 16 },
  };
  const same: Festival = {
    id: "same",
    set: "sikh",
    rule: { kind: "dates", dates: ["2026-06-18"] },
  };
  const sikh = ["sikh"] as const;

  it("uses the rule under the SGPC source, which is the default", () => {
    expect(on("2026-06-18", [split], sikh)).toEqual(["split"]);
    expect(on("2026-06-18", [split], sikh, { source: "sgpc" })).toEqual(["split"]);
    expect(on("2026-06-16", [split], sikh)).toEqual([]);
  });

  it("uses the original rule under the Original Nanakshahi source", () => {
    expect(on("2026-06-16", [split], sikh, { source: "nanakshahi" })).toEqual(["split"]);
    expect(on("2026-06-18", [split], sikh, { source: "nanakshahi" })).toEqual([]);
  });

  it("leaves a festival without an original rule unchanged by the source", () => {
    expect(on("2026-06-18", [same], sikh, { source: "nanakshahi" })).toEqual(["same"]);
  });

  it("still respects the enabled sets", () => {
    expect(on("2026-06-16", [split], ["cultural"], { source: "nanakshahi" })).toEqual([]);
  });
});

describe("sets", () => {
  const list = [vaisakhSangrand, { ...katakVadi15, rule: vaisakhSangrand.rule }];

  it("returns only festivals in an enabled set, in list order", () => {
    expect(on("2026-04-14", list)).toEqual(["vaisakhSangrand", "katakVadi15"]);
    expect(on("2026-04-14", list, ["cultural"])).toEqual(["vaisakhSangrand"]);
    expect(on("2026-04-14", list, ["sikh"])).toEqual(["katakVadi15"]);
  });

  it("returns nothing when no set is enabled", () => {
    expect(on("2026-04-14", list, [])).toEqual([]);
  });
});

describe("errors", () => {
  it("throws for an invalid date", () => {
    expect(() =>
      resolveFestivals(new Date(Number.NaN), dataFor(local("2026-04-14")), { sets: [] }, []),
    ).toThrow(RangeError);
  });

  it("throws when the data is for another year", () => {
    expect(() =>
      resolveFestivals(local("2027-04-14"), dataFor(local("2026-04-14")), { sets: [] }, []),
    ).toThrow(RangeError);
  });
});

describe("sangrand rule with daysBefore", () => {
  const dayBeforeMaghi: Festival = {
    id: "dayBeforeMaghi",
    set: "cultural",
    rule: { kind: "sangrand", month: 11, daysBefore: 1 },
  };

  it("matches the day before the sangrand only", () => {
    // Magh sangrand is 14 Jan 2026 (Dekho-ji, tests/fixtures/festivals.ts).
    expect(on("2026-01-13", [dayBeforeMaghi])).toEqual(["dayBeforeMaghi"]);
    expect(on("2026-01-12", [dayBeforeMaghi])).toEqual([]);
    expect(on("2026-01-14", [dayBeforeMaghi])).toEqual([]);
  });

  it("never matches when the shift leaves the year of the data", () => {
    expect(on("2026-12-31", [dayBeforeMaghi])).toEqual([]);
  });
});

describe("dates rule", () => {
  const listed: Festival = {
    id: "listed",
    set: "sikh",
    rule: { kind: "dates", dates: ["2026-11-08", "2027-11-09"] },
  };

  it("matches only the listed dates", () => {
    expect(on("2026-11-08", [listed])).toEqual(["listed"]);
    expect(on("2026-11-09", [listed])).toEqual([]);
    expect(on("2027-11-09", [listed])).toEqual(["listed"]);
  });
});

describe("skipped tithi", () => {
  // The 2027 file shows Sudi 2 at sunrise on 4 Aug and Sudi 4 on 5 Aug, so Sudi 3 is at no sunrise.
  // Panchangs date Teeyan to the day Tritiya begins, 4 Aug (tests/fixtures/festivals.ts).
  const teeyan = festivals.filter(({ id }) => id === "teeyan");

  it("falls on the day the tithi begins", () => {
    expect(on("2027-08-03", teeyan)).toEqual([]);
    expect(on("2027-08-04", teeyan)).toEqual(["teeyan"]);
    expect(on("2027-08-05", teeyan)).toEqual([]);
  });

  // Synthetic edits to the 2026 file. Katak is month 8, Maghar month 9, and Maghar starts on 25 Nov
  // (tests/fixtures/calendar.ts), so Sudi 15 belongs to Katak and Vadi 1 to Maghar.
  const edited = (edits: Record<string, number>) => {
    const data = dataFor(local("2026-11-24"));
    const tithi = [...data.tithi];
    for (const [iso, value] of Object.entries(edits)) {
      tithi[locate(local(iso), data).dayIndex] = value;
    }
    return { ...data, tithi };
  };
  const rule = (month: number, paksha: "sudi" | "vadi", day: number): Festival[] => [
    { id: "x", set: "cultural", rule: { kind: "tithi", month, paksha, day } },
  ];
  const run = (data: ReturnType<typeof edited>, iso: string, list: Festival[]) =>
    resolveFestivals(local(iso), data, { sets: ["cultural"] }, list);

  it("keeps a skipped Sudi 15 in the month of the day it begins", () => {
    const data = edited({ "2026-11-24": 14 });
    expect(run(data, "2026-11-24", rule(8, "sudi", 15))).toEqual(["x"]);
    expect(run(data, "2026-11-23", rule(8, "sudi", 15))).toEqual([]);
    expect(run(data, "2026-11-24", rule(9, "sudi", 15))).toEqual([]);
  });

  it("dates a skipped Vadi 1 to the day before the new month, in the new month", () => {
    const data = edited({ "2026-11-25": 17 });
    expect(run(data, "2026-11-24", rule(9, "vadi", 1))).toEqual(["x"]);
    expect(run(data, "2026-11-24", rule(8, "vadi", 1))).toEqual([]);
    expect(run(data, "2026-11-25", rule(9, "vadi", 1))).toEqual([]);
  });

  it("finds no skipped tithi on 31 December, which has no next day in the file", () => {
    // Poh (month 10) starts on 24 Dec 2026. Sudi 2 at sunrise on 31 Dec would date Sudi 3 to that
    // day, but the next day's tithi is in the 2027 file.
    const data = edited({ "2026-12-31": 2 });
    expect(run(data, "2026-12-31", rule(10, "sudi", 3))).toEqual([]);
  });
});

const sourced: Record<string, string[]> = {
  ...sourcedCultural,
  ...sourcedHindu,
  ...sourcedSikh,
  ...sourcedMuslim,
};

function* isoDaysOf(year: number): Generator<string> {
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = addDays(d, 1)) {
    yield `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
}

describe("sourced festival dates", () => {
  it.each(festivals)("$id has sourced dates", ({ id }) => {
    expect(sourced[id]?.length).toBeGreaterThan(0);
  });

  it.each(festivals)(
    "$id falls on its sourced dates and no other day of those years",
    (festival) => {
      const dates = sourced[festival.id] ?? [];
      for (const year of new Set(dates.map((d) => Number(d.slice(0, 4))))) {
        const matching = [...isoDaysOf(year)].filter(
          (iso) => on(iso, [festival], [festival.set]).length > 0,
        );
        expect(matching).toEqual(dates.filter((d) => d.startsWith(`${year}-`)));
      }
    },
  );
});

describe("tithi festivals across 2026 to 2036", () => {
  // A lunar year is 354 days, or 384 with an adhik month, and sunrise tithis move a day or two, so
  // a gap outside these bands means a festival went missing or fired twice.
  const tithiFestivals = festivals.filter(({ rule }) => rule.kind === "tithi");

  it.each(tithiFestivals)("$id recurs about once a lunar year", (festival) => {
    const days: number[] = [];
    for (let year = firstYear; year <= lastYear; year++) {
      for (const iso of isoDaysOf(year)) {
        if (on(iso, [festival]).length > 0) {
          days.push(Math.round(local(iso).getTime() / 86_400_000));
        }
      }
    }
    expect(days.length).toBeGreaterThan(1);
    for (const [i, day] of days.entries()) {
      const gap = day - (days[i - 1] ?? day);
      if (i > 0) {
        expect(
          (gap >= 350 && gap <= 360) || (gap >= 380 && gap <= 390),
          `${festival.id} gap ${gap} before day ${day}`,
        ).toBe(true);
      }
    }
  });
});

describe("Hijri festivals across 2026 to 2036", () => {
  // A Hijri year is 354 or 355 days, so successive days of one Hijri date are that far apart.
  const hijriFestivals = festivals.filter(({ rule }) => rule.kind === "hijri");

  it.each(hijriFestivals)("$id recurs every 354 or 355 days", (festival) => {
    const days: number[] = [];
    for (let year = firstYear; year <= lastYear; year++) {
      for (const iso of isoDaysOf(year)) {
        if (on(iso, [festival], [festival.set]).length > 0) {
          days.push(Math.round(local(iso).getTime() / 86_400_000));
        }
      }
    }
    expect(days.length).toBeGreaterThan(10);
    for (const [i, day] of days.entries()) {
      if (i > 0) {
        const gap = day - (days[i - 1] ?? day);
        expect([354, 355], `${festival.id} gap ${gap} before day ${day}`).toContain(gap);
      }
    }
  });
});

describe("Original Nanakshahi source", () => {
  const sikh = ["sikh"] as const;
  const daysOf = (festival: Festival, year: number, source: "sgpc" | "nanakshahi") =>
    [...isoDaysOf(year)].filter((iso) => on(iso, [festival], sikh, { source }).length > 0);
  const pad = (n: number) => String(n).padStart(2, "0");

  describe.each(Object.entries(sourcedOriginalNanakshahi))("%s", (id, [month, day]) => {
    const festival = festivals.find((f) => f.id === id) as Festival;

    it("falls on its fixed date and no other day in every year", () => {
      for (let year = firstYear; year <= lastYear; year++) {
        expect(daysOf(festival, year, "nanakshahi")).toEqual([`${year}-${pad(month)}-${pad(day)}`]);
      }
    });

    it("keeps its SGPC days under the SGPC source", () => {
      const sgpc = { ...festival, original: undefined };
      for (const year of [2026, 2027]) {
        expect(daysOf(festival, year, "sgpc")).toEqual(daysOf(sgpc, year, "sgpc"));
      }
    });
  });

  it("moves exactly the five festivals with a fixed date", () => {
    expect(festivals.filter((f) => f.original).map((f) => f.id)).toEqual(
      Object.keys(sourcedOriginalNanakshahi),
    );
  });

  // Hola Mohalla, Bandi Chhor Divas and Guru Nanak's Prakash were movable in the 2003 version, and
  // Khalsa Sajna Divas falls on the same day in both.
  it.each(["holaMohalla", "bandiChhorDivas", "prakashGuruNanak", "khalsaSajnaDivas"])(
    "gives %s the same days under both sources",
    (id) => {
      const festival = festivals.find((f) => f.id === id) as Festival;
      const years = [2026, 2027];
      expect(years.flatMap((year) => daysOf(festival, year, "sgpc")).length).toBeGreaterThan(0);
      for (const year of years) {
        expect(daysOf(festival, year, "nanakshahi")).toEqual(daysOf(festival, year, "sgpc"));
      }
    },
  );
});
