import { calendarIds } from "../calendars/registry.ts";
import { type FestivalSet, festivalSets } from "../festivals/sets.ts";
import type { CalendarId, Settings } from "./types.ts";

export interface CalendarRow {
  id: CalendarId;
  enabled: boolean;
}

/** Every calendar once: the enabled ones in their saved order, then the rest in the fixed order. */
export function calendarRows({ calendars }: Pick<Settings, "calendars">): CalendarRow[] {
  return [
    ...calendars.map((id) => ({ id, enabled: true })),
    ...calendarIds.filter((id) => !calendars.includes(id)).map((id) => ({ id, enabled: false })),
  ];
}

/** Turning one on appends it. The last enabled calendar cannot be turned off. */
export function toggleCalendar(settings: Settings, id: CalendarId): Settings {
  if (!settings.calendars.includes(id)) {
    return { ...settings, calendars: [...settings.calendars, id] };
  }
  if (settings.calendars.length === 1) {
    return settings;
  }
  return { ...settings, calendars: settings.calendars.filter((known) => known !== id) };
}

/** Swaps an enabled calendar with its neighbour; at an edge, or when disabled, nothing moves. */
export function moveCalendar(settings: Settings, id: CalendarId, delta: -1 | 1): Settings {
  const from = settings.calendars.indexOf(id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= settings.calendars.length) {
    return settings;
  }
  const calendars = [...settings.calendars];
  [calendars[from], calendars[to]] = [calendars[to] as CalendarId, calendars[from] as CalendarId];
  return { ...settings, calendars };
}

/** Any subset is allowed, kept in the canonical order so the saved value does not depend on clicks. */
export function toggleFestivalSet(settings: Settings, set: FestivalSet): Settings {
  const on = new Set(settings.festivalSets);
  if (!on.delete(set)) {
    on.add(set);
  }
  return { ...settings, festivalSets: festivalSets.filter((known) => on.has(known)) };
}
