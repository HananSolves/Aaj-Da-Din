import { describe, expect, it } from "vitest";
import { parseMirror } from "../src/settings/mirror.ts";
import { defaultSettings } from "../src/settings/types.ts";

const valid = {
  schemaVersion: 4,
  calendars: ["hijri", "gregorian"],
  theme: "raat",
  dateStyle: "compact",
  background: "solid",
  hijriOffset: 1,
  festivalSets: ["muslim"],
  gurpurabSource: "nanakshahi",
  showFestivalLines: true,
  showFact: false,
};
const parse = (value: unknown) => parseMirror(JSON.stringify(value));

describe("parseMirror", () => {
  it("returns a valid mirror unchanged", () => {
    expect(parse(valid)).toEqual(valid);
    expect(parse(defaultSettings)).toEqual(defaultSettings);
  });

  it("keeps extra fields", () => {
    expect(parse({ ...valid, later: true })).toEqual({ ...valid, later: true });
  });

  it("migrates a schema 1 mirror in memory", () => {
    const v1 = { schemaVersion: 1, calendars: ["desi"], theme: "dark", hijriOffset: 0 };
    expect(parse(v1)).toEqual({
      ...v1,
      schemaVersion: 4,
      theme: "raat",
      dateStyle: "list",
      background: "photo",
      festivalSets: ["cultural", "sikh"],
      gurpurabSource: "sgpc",
      showFestivalLines: true,
      showFact: true,
    });
  });

  it("migrates a schema 2 mirror in memory", () => {
    const {
      festivalSets: _sets,
      gurpurabSource: _source,
      showFestivalLines: _lines,
      showFact: _fact,
      ...v2
    } = valid;
    expect(parse({ ...v2, schemaVersion: 2 })).toEqual({
      ...v2,
      schemaVersion: 4,
      festivalSets: ["cultural", "sikh"],
      gurpurabSource: "sgpc",
      showFestivalLines: true,
      showFact: true,
    });
  });

  it.each([null, "", "not json", "{", "null", "[]", '"text"', "42"])("rejects %j", (raw) => {
    expect(parseMirror(raw)).toBeNull();
  });

  it.each([
    ["a newer schemaVersion", { ...valid, schemaVersion: 5 }],
    ["no schemaVersion", { ...valid, schemaVersion: undefined }],
    ["empty calendars", { ...valid, calendars: [] }],
    ["calendars that is not an array", { ...valid, calendars: "gregorian" }],
    ["an unknown calendar", { ...valid, calendars: ["gregorian", "julian"] }],
    ["a non-string calendar", { ...valid, calendars: [1] }],
    ["a duplicate calendar", { ...valid, calendars: ["desi", "desi"] }],
    ["an offset out of range", { ...valid, hijriOffset: 2 }],
    ["an offset that is not a number", { ...valid, hijriOffset: "1" }],
    ["a non-string theme", { ...valid, theme: 3 }],
    ["an unknown theme", { ...valid, theme: "light" }],
    ["an unknown date style", { ...valid, dateStyle: "grid" }],
    ["an unknown background", { ...valid, background: "video" }],
    ["an unknown festival set", { ...valid, festivalSets: ["jain"] }],
    ["a duplicate festival set", { ...valid, festivalSets: ["sikh", "sikh"] }],
    ["an unknown Gurpurab source", { ...valid, gurpurabSource: "akal-takht" }],
  ])("rejects %s", (_name, value) => {
    expect(parse(value)).toBeNull();
  });
});
