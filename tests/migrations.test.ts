import { describe, expect, it } from "vitest";
import { type MigrationStep, parseSettings } from "../src/settings/migrations.ts";
import { defaultSettings } from "../src/settings/types.ts";

const valid = {
  schemaVersion: 1,
  calendars: ["hijri", "gregorian"],
  theme: "dark",
  hijriOffset: 1,
};

describe("parseSettings", () => {
  it("returns a valid value unchanged", () => {
    expect(parseSettings(valid)).toEqual(valid);
    expect(parseSettings(defaultSettings)).toEqual(defaultSettings);
  });

  it("keeps extra fields", () => {
    expect(parseSettings({ ...valid, later: true })).toEqual({ ...valid, later: true });
  });

  it.each([null, undefined, "text", 42, []])("rejects %j", (value) => {
    expect(parseSettings(value)).toBeNull();
  });

  it.each([
    ["a newer schemaVersion", { ...valid, schemaVersion: 2 }],
    ["no schemaVersion", { ...valid, schemaVersion: undefined }],
    ["schemaVersion 0", { ...valid, schemaVersion: 0 }],
    ["a fractional schemaVersion", { ...valid, schemaVersion: 1.5 }],
    ["a string schemaVersion", { ...valid, schemaVersion: "1" }],
    ["empty calendars", { ...valid, calendars: [] }],
    ["calendars that is not an array", { ...valid, calendars: "gregorian" }],
    ["an unknown calendar", { ...valid, calendars: ["gregorian", "julian"] }],
    ["a non-string calendar", { ...valid, calendars: [1] }],
    ["a duplicate calendar", { ...valid, calendars: ["desi", "desi"] }],
    ["an offset out of range", { ...valid, hijriOffset: 2 }],
    ["an offset that is not a number", { ...valid, hijriOffset: "1" }],
    ["a non-string theme", { ...valid, theme: 3 }],
  ])("rejects %s", (_name, value) => {
    expect(parseSettings(value)).toBeNull();
  });
});

describe("parseSettings migrations", () => {
  const trail: string[] = [];
  const steps: MigrationStep[] = [
    (stored) => {
      trail.push("1to2");
      return { ...stored, theme: `${String(stored.theme)}-v2` };
    },
    (stored) => {
      trail.push("2to3");
      return { ...stored, theme: `${String(stored.theme)}-v3` };
    },
  ];

  it("runs every step from the stored version, in order", () => {
    trail.length = 0;
    const result = parseSettings(valid, steps, 3);
    expect(trail).toEqual(["1to2", "2to3"]);
    expect(result).toEqual({ ...valid, schemaVersion: 3, theme: "dark-v2-v3" });
  });

  it("runs only the steps after the stored version", () => {
    trail.length = 0;
    const result = parseSettings({ ...valid, schemaVersion: 2 }, steps, 3);
    expect(trail).toEqual(["2to3"]);
    expect(result).toEqual({ ...valid, schemaVersion: 3, theme: "dark-v3" });
  });

  it("does not mutate the stored value", () => {
    const stored = { ...valid };
    parseSettings(stored, steps, 3);
    expect(stored).toEqual(valid);
  });

  it("is null when a step throws", () => {
    const broken: MigrationStep[] = [
      () => {
        throw new Error("bad data");
      },
    ];
    expect(parseSettings(valid, broken, 2)).toBeNull();
  });

  it("is null when a step output fails the shape check", () => {
    const bad: MigrationStep[] = [(stored) => ({ ...stored, calendars: [] })];
    expect(parseSettings(valid, bad, 2)).toBeNull();
  });

  it("is null when a step is missing", () => {
    expect(parseSettings(valid, [], 2)).toBeNull();
  });
});
