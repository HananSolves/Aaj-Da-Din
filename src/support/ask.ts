import { localIso } from "../calendars/year-data.ts";
import { en } from "../strings/en.ts";

export interface AskMessage {
  text: string;
  action: string;
}

const DAY_MS = 86_400_000;
const firstAskAfterDays = 14;
const daysBetweenAsks = 30;
const festivalWindowDays = 3;

/** Days of mourning: never an ask moment, and no ask is shown on them. */
export const quietDays: readonly string[] = [
  "shaheediGuruArjan",
  "shaheediGuruTegBahadur",
  "ashura",
];

const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whole days since the epoch for a real YYYY-MM-DD date, else `undefined`. */
function dayNumber(iso: string): number | undefined {
  const match = isoPattern.exec(iso);
  if (!match) return undefined;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? time / DAY_MS : undefined;
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && dayNumber(value) !== undefined;
}

export type AskTiming = "reset" | "wait" | "due";

/**
 * Whether an ask is due on `today`. A missing or invalid install date, or a last-ask date that is
 * present but invalid, is "reset": the caller rewrites it and shows nothing. A date in the future
 * counts as "wait".
 */
export function askTiming(today: string, installDate: unknown, lastAskDate: unknown): AskTiming {
  const now = dayNumber(today);
  if (now === undefined) {
    throw new RangeError(`Not a YYYY-MM-DD date: ${today}`);
  }
  if (!isIsoDate(installDate) || (lastAskDate !== undefined && !isIsoDate(lastAskDate))) {
    return "reset";
  }
  const installed = dayNumber(installDate) as number;
  if (now - installed < firstAskAfterDays) return "wait";
  if (lastAskDate !== undefined) {
    const last = dayNumber(lastAskDate as string) as number;
    if (now - last < daysBetweenAsks) return "wait";
  }
  return "due";
}

const celebrations = (ids: readonly string[]) => ids.filter((id) => !quietDays.includes(id));

/**
 * A celebration today shows the ask; a quiet day never does; otherwise a celebration in the next
 * few days holds it back so it can land on the festival.
 */
export function shouldAskToday(
  todayIds: readonly string[],
  upcomingIds: readonly string[],
): boolean {
  if (todayIds.some((id) => quietDays.includes(id))) return false;
  if (celebrations(todayIds).length > 0) return true;
  return celebrations(upcomingIds).length === 0;
}

/** Vaisakhi and the Eids get their own greeting; any other day rotates the general messages. */
export function chooseMessage(todayIds: readonly string[], now: Date): AskMessage {
  const messages = en.support.messages;
  if (todayIds.includes("vaisakhi")) return messages.vaisakhi;
  if (todayIds.includes("eidAlFitr") || todayIds.includes("eidAlAdha")) return messages.eid;
  const sinceEpoch = dayNumber(localIso(now)) as number;
  const sincePlanStart = sinceEpoch - (dayNumber("2026-01-01") as number);
  const general = messages.general;
  return general[
    ((sincePlanStart % general.length) + general.length) % general.length
  ] as AskMessage;
}

/**
 * The message to show now that an ask is due, or `null` to wait or stay quiet. `idsFor` returns the
 * festival ids for one local date.
 */
export async function decideAsk(
  now: Date,
  idsFor: (date: Date) => Promise<readonly string[]>,
): Promise<AskMessage | null> {
  const ahead = Array.from({ length: festivalWindowDays }, (_, i) => {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + 1);
  });
  const [todayIds, ...upcoming] = await Promise.all([idsFor(now), ...ahead.map(idsFor)]);
  const todayList = todayIds ?? [];
  return shouldAskToday(todayList, upcoming.flat()) ? chooseMessage(todayList, now) : null;
}
