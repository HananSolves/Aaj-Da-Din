import { describe, expect, it } from "vitest";
import { formatPunjabiSolar, toPunjabiSolar } from "../src/calendars/punjabi-solar.ts";
import type { SolarYear } from "../src/calendars/year-data.ts";
import { sangrand2026 } from "./fixtures/calendar.ts";
import { readCalendarFile } from "./fixtures/years.ts";

const load = (year: number) => readCalendarFile<SolarYear>("punjabi-solar", year);

const data = new Map(Array.from({ length: 11 }, (_, i) => [2026 + i, load(2026 + i)] as const));
const dataFor = (date: Date): SolarYear => {
  const found = data.get(date.getFullYear());
  if (!found) throw new Error(`no data for ${date.getFullYear()}`);
  return found;
};
const punjabiSolar = (date: Date) => toPunjabiSolar(date, dataFor(date));

const local = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
};

// Punjab Data's 2026 jantri, read 2026-10-15, writes each sangrand as day 1 of its Punjabi solar month,
// for example "1 Vaisakh (Sangrand)" on 14 April:
// https://www.punjabdata.com/Nanakshahi-Calendar-2026-Punjabi-Jantri.aspx
// Month numbers count Chet as 1. The page names them Maagh, Phagan, Chet, Vaisakh, Jeth, Harh,
// Sawan, Bhadon, Assu, Kattak, Maghar and Poh, in the order of `sangrand2026`.
const monthOfSangrand2026 = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe("sangrand days", () => {
  it.each(sangrand2026.map((iso, i) => [iso, monthOfSangrand2026[i]] as const))(
    "%s is day 1 of month %i",
    (iso, month) => {
      expect(punjabiSolar(local(iso))).toEqual({ day: 1, month });
    },
  );

  it.each(sangrand2026.map((iso, i) => [iso, monthOfSangrand2026[i]] as const))(
    "the day before %s ends the previous month",
    (iso, month) => {
      const before = new Date(
        local(iso).getFullYear(),
        local(iso).getMonth(),
        local(iso).getDate() - 1,
      );
      const result = punjabiSolar(before);
      expect(result.month).toBe(month === 1 ? 12 : (month ?? 1) - 1);
      expect(result.day).toBeGreaterThanOrEqual(29);
      expect(result.day).toBeLessThanOrEqual(32);
    },
  );
});

describe("year boundary", () => {
  it("continues Poh from 2026 into 2027", () => {
    expect(punjabiSolar(local("2026-12-31"))).toEqual({ day: 16, month: 10 });
    expect(punjabiSolar(local("2027-01-01"))).toEqual({ day: 17, month: 10 });
  });
});

describe("every day from 2026 to 2036", () => {
  it("has a day of 1 to 32 and advances one day at a time", () => {
    let previous = punjabiSolar(local("2026-01-01"));
    expect(previous.day).toBeGreaterThanOrEqual(1);
    for (let date = local("2026-01-02"); date.getFullYear() <= 2036; ) {
      const current = punjabiSolar(date);
      expect(current.day).toBeGreaterThanOrEqual(1);
      expect(current.day).toBeLessThanOrEqual(32);
      const sameMonth = current.month === previous.month && current.day === previous.day + 1;
      const nextMonth = current.month === (previous.month % 12) + 1 && current.day === 1;
      if (!(sameMonth || nextMonth)) {
        throw new Error(
          `${date.toDateString()}: ${JSON.stringify(previous)} followed by ${JSON.stringify(current)}`,
        );
      }
      previous = current;
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    }
  });
});

describe("formatPunjabiSolar", () => {
  it("formats the day and month name", () => {
    expect(formatPunjabiSolar(local("2026-10-17"), dataFor(local("2026-10-17")))).toBe("1 Katak");
    expect(formatPunjabiSolar(local("2026-10-16"), dataFor(local("2026-10-16")))).toBe("30 Assu");
    expect(formatPunjabiSolar(local("2026-12-31"), dataFor(local("2026-12-31")))).toBe("16 Poh");
  });
});

describe("errors", () => {
  it("throws on an invalid date", () => {
    expect(() => toPunjabiSolar(new Date(Number.NaN), dataFor(local("2026-01-01")))).toThrow(
      RangeError,
    );
  });

  it("throws when the data is for a different year", () => {
    expect(() => toPunjabiSolar(local("2027-01-01"), dataFor(local("2026-01-01")))).toThrow(
      RangeError,
    );
  });
});
