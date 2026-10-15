import { formatBikrami } from "../calendars/bikrami.ts";
import { formatDesi } from "../calendars/desi.ts";
import { formatGregorian } from "../calendars/gregorian.ts";
import { formatHijri } from "../calendars/hijri.ts";
import { formatNanakshahi } from "../calendars/nanakshahi.ts";
import type { CalendarYear } from "../calendars/year-data.ts";
import type { CalendarId, Settings } from "../settings/types.ts";
import { en } from "../strings/en.ts";

export interface DateRow {
  calendar: CalendarId;
  label: string;
  text: string;
}

/**
 * One row per enabled calendar, in the saved order. A calendar that cannot be shown is left out
 * so the rest still renders: Desi and Bikrami without the year's data, Hijri when the browser has
 * no umm al-Qura data. An invalid date is a programmer error and throws.
 */
export function todayRows(
  now: Date,
  settings: Pick<Settings, "calendars" | "hijriOffset">,
  data: CalendarYear | undefined,
): DateRow[] {
  if (Number.isNaN(now.getTime())) {
    throw new RangeError("Invalid time value");
  }

  const text = (calendar: CalendarId): string | undefined => {
    switch (calendar) {
      case "gregorian":
        return formatGregorian(now);
      case "nanakshahi":
        return formatNanakshahi(now);
      case "desi":
        return data && formatDesi(now, data);
      case "bikrami":
        return data && formatBikrami(now, data);
      case "hijri":
        try {
          return formatHijri(now, settings.hijriOffset);
        } catch {
          return undefined;
        }
    }
  };

  return settings.calendars.flatMap((calendar) => {
    const value = text(calendar);
    return value === undefined
      ? []
      : [{ calendar, label: en.calendarNames[calendar], text: value }];
  });
}
