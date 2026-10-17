import { formatGregorian } from "./gregorian.ts";
import type { HijriOffset } from "./hijri.ts";
import { loadCalendarYear } from "./year-data.ts";

export const calendarIds = [
  "gregorian",
  "punjabi-solar",
  "bikrami",
  "nanakshahi",
  "hijri",
] as const;
export type CalendarId = (typeof calendarIds)[number];

interface FormatOptions {
  hijriOffset: HijriOffset;
}

type Formatter = (now: Date, options: FormatOptions) => Promise<string | undefined>;

const unavailable = (): undefined => undefined;

// Each calendar loads its own code and data on demand, so a person who follows three calendars
// never downloads the other ones. A module or data file that cannot be loaded gives `undefined`,
// which leaves that calendar out. Errors from the calendar math itself are not caught.
const formatters: Record<CalendarId, Formatter> = {
  gregorian: async (now) => formatGregorian(now),
  "punjabi-solar": async (now) => {
    const [calendar, data] = await Promise.all([
      import("./punjabi-solar.ts").catch(unavailable),
      loadCalendarYear("punjabi-solar", now.getFullYear()).catch(unavailable),
    ]);
    return calendar && data ? calendar.formatPunjabiSolar(now, data) : undefined;
  },
  bikrami: async (now) => {
    const [calendar, data] = await Promise.all([
      import("./bikrami.ts").catch(unavailable),
      loadCalendarYear("bikrami", now.getFullYear()).catch(unavailable),
    ]);
    return calendar && data ? calendar.formatBikrami(now, data) : undefined;
  },
  nanakshahi: async (now) => {
    const calendar = await import("./nanakshahi.ts").catch(unavailable);
    return calendar?.formatNanakshahi(now);
  },
  hijri: async (now, { hijriOffset }) => {
    const calendar = await import("./hijri.ts").catch(unavailable);
    try {
      return calendar?.formatHijri(now, hijriOffset);
    } catch {
      // No umm al-Qura data in this browser: only this calendar is left out.
      return undefined;
    }
  },
};

/** The calendar's date text for the local date of `now`, or `undefined` when it cannot be shown. */
export function formatCalendar(
  id: CalendarId,
  now: Date,
  options: FormatOptions,
): Promise<string | undefined> {
  return formatters[id](now, options);
}
