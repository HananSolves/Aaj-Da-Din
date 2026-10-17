import { type CalendarId, formatCalendar } from "../calendars/registry.ts";
import type { Settings } from "../settings/types.ts";
import { en } from "../strings/en.ts";

export interface DateRow {
  calendar: CalendarId;
  label: string;
  text: string;
}

/**
 * One row per enabled calendar, in the saved order. A calendar that cannot be shown is left out
 * so the rest still renders: Punjabi solar and Bikrami without the year's data, Hijri when the
 * browser has no umm al-Qura data. An invalid date is a programmer error and rejects.
 */
export async function todayRows(
  now: Date,
  settings: Pick<Settings, "calendars" | "hijriOffset">,
): Promise<DateRow[]> {
  if (Number.isNaN(now.getTime())) {
    throw new RangeError("Invalid time value");
  }

  const texts = await Promise.all(
    settings.calendars.map((id) => formatCalendar(id, now, settings)),
  );
  return settings.calendars.flatMap((calendar, i) => {
    const text = texts[i];
    return text === undefined ? [] : [{ calendar, label: en.calendarNames[calendar], text }];
  });
}
