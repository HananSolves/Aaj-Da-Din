import { describe, expect, it } from "vitest";
import { formatGregorian } from "../src/calendars/gregorian.ts";

describe("formatGregorian", () => {
  it("formats a date in English long form", () => {
    expect(formatGregorian(new Date(2026, 9, 11))).toBe("11 October 2026");
  });
});
