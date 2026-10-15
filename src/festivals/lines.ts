import { loadCalendarYear } from "../calendars/year-data.ts";
import { en } from "../strings/en.ts";
import { festivals } from "./festivals.ts";
import { type Festival, type FestivalSet, resolveFestivals } from "./rules.ts";

export interface FestivalLines {
  today?: string;
  tomorrow?: string;
}

const names: Readonly<Record<string, string | undefined>> = en.festivals;

/**
 * Builds the "Today: ..." and "Tomorrow: ..." lines for the local date of `now`. A day with no
 * festival, or whose year has no calendar file, gets no line.
 */
export async function festivalLines(
  now: Date,
  sets: readonly FestivalSet[],
  load = loadCalendarYear,
  list: readonly Festival[] = festivals,
): Promise<FestivalLines> {
  if (Number.isNaN(now.getTime())) {
    throw new RangeError("Invalid time value");
  }
  // Local date fields, not milliseconds, so a daylight-saving change cannot skip a day.
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const line = async (label: string, date: Date): Promise<string | undefined> => {
    const data = await load(date.getFullYear());
    if (!data) {
      return undefined;
    }
    const ids = resolveFestivals(date, data, sets, list);
    return ids.length > 0
      ? `${label}: ${ids.map((id) => names[id] ?? id).join(en.festivalJoiner)}`
      : undefined;
  };

  const [todayLine, tomorrowLine] = await Promise.all([
    line(en.today, now),
    line(en.tomorrow, tomorrow),
  ]);
  return {
    ...(todayLine && { today: todayLine }),
    ...(tomorrowLine && { tomorrow: tomorrowLine }),
  };
}
