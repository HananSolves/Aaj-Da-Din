import { describe, expect, it } from "vitest";
import { type MigrationStep, parseSettings } from "../src/settings/migrations.ts";
import { defaultSettings } from "../src/settings/types.ts";

const valid = {
  schemaVersion: 3,
  calendars: ["hijri", "gregorian"],
  theme: "raat",
  dateStyle: "centered",
  background: "solid",
  hijriOffset: 1,
  festivalSets: ["muslim", "cultural"],
  gurpurabSource: "nanakshahi",
};

describe("parseSettings", () => {
  it("returns a valid value unchanged", () => {
    expect(parseSettings(valid)).toEqual(valid);
    expect(parseSettings(defaultSettings)).toEqual(defaultSettings);
  });

  it("accepts no festival sets at all", () => {
    expect(parseSettings({ ...valid, festivalSets: [] })).toEqual({ ...valid, festivalSets: [] });
  });

  it("keeps extra fields", () => {
    expect(parseSettings({ ...valid, later: true })).toEqual({ ...valid, later: true });
  });

  it.each([null, undefined, "text", 42, []])("rejects %j", (value) => {
    expect(parseSettings(value)).toBeNull();
  });

  it.each([
    ["a newer schemaVersion", { ...valid, schemaVersion: 4 }],
    ["no schemaVersion", { ...valid, schemaVersion: undefined }],
    ["schemaVersion 0", { ...valid, schemaVersion: 0 }],
    ["a fractional schemaVersion", { ...valid, schemaVersion: 1.5 }],
    ["a string schemaVersion", { ...valid, schemaVersion: "3" }],
    ["empty calendars", { ...valid, calendars: [] }],
    ["calendars that is not an array", { ...valid, calendars: "gregorian" }],
    ["an unknown calendar", { ...valid, calendars: ["gregorian", "julian"] }],
    ["a non-string calendar", { ...valid, calendars: [1] }],
    ["a duplicate calendar", { ...valid, calendars: ["desi", "desi"] }],
    ["an offset out of range", { ...valid, hijriOffset: 2 }],
    ["an offset that is not a number", { ...valid, hijriOffset: "1" }],
    ["a non-string theme", { ...valid, theme: 3 }],
    ["an unknown theme", { ...valid, theme: "light" }],
    ["a missing theme", { ...valid, theme: undefined }],
    ["an unknown date style", { ...valid, dateStyle: "grid" }],
    ["a missing date style", { ...valid, dateStyle: undefined }],
    ["an unknown background", { ...valid, background: "video" }],
    ["a missing background", { ...valid, background: undefined }],
    ["festivalSets that is not an array", { ...valid, festivalSets: "sikh" }],
    ["an unknown festival set", { ...valid, festivalSets: ["sikh", "jain"] }],
    ["a non-string festival set", { ...valid, festivalSets: [1] }],
    ["a duplicate festival set", { ...valid, festivalSets: ["sikh", "sikh"] }],
    ["missing festivalSets", { ...valid, festivalSets: undefined }],
    ["an unknown Gurpurab source", { ...valid, gurpurabSource: "akal-takht" }],
    ["a missing Gurpurab source", { ...valid, gurpurabSource: undefined }],
  ])("rejects %s", (_name, value) => {
    expect(parseSettings(value)).toBeNull();
  });
});

describe("parseSettings 1 to 2", () => {
  const v1 = {
    schemaVersion: 1,
    calendars: ["hijri", "gregorian"],
    theme: "dark",
    hijriOffset: -1,
  };

  it("maps dark to raat and adds the new defaults, keeping the other fields", () => {
    expect(parseSettings(v1)).toEqual({
      ...v1,
      schemaVersion: 3,
      theme: "raat",
      dateStyle: "list",
      background: "photo",
      festivalSets: ["cultural", "sikh"],
      gurpurabSource: "sgpc",
    });
  });

  it.each(["light", "sepia", "", 7, null])("maps theme %j to chitta", (theme) => {
    expect(parseSettings({ ...v1, theme })?.theme).toBe("chitta");
  });

  it("maps a missing theme to chitta", () => {
    const { theme: _theme, ...withoutTheme } = v1;
    expect(parseSettings(withoutTheme)?.theme).toBe("chitta");
  });

  it("still rejects a v1 value whose other fields are invalid", () => {
    expect(parseSettings({ ...v1, calendars: [] })).toBeNull();
    expect(parseSettings({ ...v1, hijriOffset: 2 })).toBeNull();
  });
});

describe("parseSettings 2 to 3", () => {
  const v2 = {
    schemaVersion: 2,
    calendars: ["hijri", "gregorian"],
    theme: "sarson",
    dateStyle: "compact",
    background: "solid",
    hijriOffset: -1,
  };

  it("adds the cultural and Sikh sets and the SGPC source, keeping the other fields", () => {
    expect(parseSettings(v2)).toEqual({
      ...v2,
      schemaVersion: 3,
      festivalSets: ["cultural", "sikh"],
      gurpurabSource: "sgpc",
    });
  });

  it("overwrites nothing a v2 value could not have held", () => {
    expect(parseSettings({ ...v2, festivalSets: ["hindu"] })?.festivalSets).toEqual([
      "cultural",
      "sikh",
    ]);
  });

  it("still rejects a v2 value whose other fields are invalid", () => {
    expect(parseSettings({ ...v2, theme: "light" })).toBeNull();
  });
});

describe("parseSettings migration runner", () => {
  const trail: string[] = [];
  const steps: MigrationStep[] = [
    (stored) => stored,
    (stored) => {
      trail.push("2to3");
      return { ...stored, note: `${String(stored.note)}-v3` };
    },
    (stored) => {
      trail.push("3to4");
      return { ...stored, note: `${String(stored.note)}-v4` };
    },
  ];
  const v2 = { ...valid, schemaVersion: 2, note: "n" };

  it("runs every step from the stored version, in order", () => {
    trail.length = 0;
    const result = parseSettings(v2, steps, 4);
    expect(trail).toEqual(["2to3", "3to4"]);
    expect(result).toEqual({ ...v2, schemaVersion: 4, note: "n-v3-v4" });
  });

  it("runs only the steps after the stored version", () => {
    trail.length = 0;
    const result = parseSettings({ ...v2, schemaVersion: 3 }, steps, 4);
    expect(trail).toEqual(["3to4"]);
    expect(result).toEqual({ ...v2, schemaVersion: 4, note: "n-v4" });
  });

  it("does not mutate the stored value", () => {
    const stored = { ...v2 };
    parseSettings(stored, steps, 4);
    expect(stored).toEqual(v2);
  });

  it("is null when a step throws", () => {
    const broken: MigrationStep[] = [
      () => {
        throw new Error("bad data");
      },
    ];
    expect(parseSettings({ ...valid, schemaVersion: 1 }, broken, 2)).toBeNull();
  });

  it("is null when a step output fails the shape check", () => {
    const bad: MigrationStep[] = [(stored) => ({ ...stored, calendars: [] })];
    expect(parseSettings({ ...valid, schemaVersion: 1 }, bad, 2)).toBeNull();
  });

  it("is null when a step is missing", () => {
    expect(parseSettings({ ...valid, schemaVersion: 1 }, [], 2)).toBeNull();
  });
});
