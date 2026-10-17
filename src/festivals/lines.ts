import { loadFestivalYear } from "../calendars/year-data.ts";
import { en } from "../strings/en.ts";
import { festivals } from "./festivals.ts";
import { type Festival, type FestivalQuery, resolveFestivals } from "./rules.ts";

export interface FestivalLines {
  today?: string;
  tomorrow?: string;
}

const names: Readonly<Record<string, string | undefined>> = en.festivals;

/**
 * Builds the "Today: ..." and "Tomorrow: ..." lines for the local date of `now`. A day with no
 * festival, or whose year has no calendar file, gets no line. Hijri festivals are marked expected,
 * because moon sighting decides the day, and a Gurpurab that the Original Nanakshahi calendar
 * moves names its source.
 */
export async function festivalLines(
  now: Date,
  query: FestivalQuery,
  load = loadFestivalYear,
  list: readonly Festival[] = festivals,
): Promise<FestivalLines> {
  if (Number.isNaN(now.getTime())) {
    throw new RangeError("Invalid time value");
  }
  // Local date fields, not milliseconds, so a daylight-saving change cannot skip a day.
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const label = (id: string): string => {
    const name = names[id] ?? id;
    const festival = list.find((f) => f.id === id);
    if (festival?.rule.kind === "hijri") {
      return `${name} (${en.expected})`;
    }
    return query.source === "nanakshahi" && festival?.original
      ? `${name} (${en.originalNanakshahi})`
      : name;
  };

  const line = async (prefix: string, date: Date): Promise<string | undefined> => {
    const data = await load(date.getFullYear());
    if (!data) {
      return undefined;
    }
    const ids = resolveFestivals(date, data, query, list);
    return ids.length > 0 ? `${prefix}: ${ids.map(label).join(en.festivalJoiner)}` : undefined;
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
