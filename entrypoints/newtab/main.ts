import { loadCalendarYear, localIso } from "../../src/calendars/year-data.ts";
import { type FestivalLines, festivalLines } from "../../src/festivals/lines.ts";
import { readMirror } from "../../src/settings/mirror.ts";
import { loadSettings } from "../../src/settings/store.ts";
import { type CalendarId, defaultSettings, type Settings } from "../../src/settings/types.ts";
import { applyLook } from "../../src/themes/look.ts";
import { todayRows } from "../../src/ui/today.ts";

// With no settings anywhere, the page shows every calendar until onboarding exists (build-plan 12).
const v0Calendars: CalendarId[] = ["gregorian", "desi", "bikrami", "nanakshahi", "hijri"];

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

async function renderDates(dates: HTMLElement, settings: Settings, now: Date): Promise<void> {
  // A year with no bundled file, or a chunk that fails to load, just leaves out Desi and Bikrami.
  const data = await loadCalendarYear(now.getFullYear()).catch(() => undefined);

  const iso = localIso(now);
  dates.replaceChildren(
    ...todayRows(now, settings, data).map((row) => {
      const li = document.createElement("li");
      const time = element("time", row.text);
      time.dateTime = iso;
      li.append(element("span", row.label, "label"), time);
      return li;
    }),
  );
}

async function renderFestivals(festivals: HTMLElement, now: Date): Promise<void> {
  const lines: FestivalLines = await festivalLines(now, ["cultural", "sikh"]).catch(() => ({}));
  const { today, tomorrow } = lines;
  festivals.replaceChildren(
    ...(today ? [element("p", today, "today")] : []),
    ...(tomorrow ? [element("p", tomorrow, "tomorrow")] : []),
  );
}

async function start(dates: HTMLElement, festivals: HTMLElement): Promise<void> {
  const now = new Date();
  const painted = readMirror() ?? { ...defaultSettings, calendars: v0Calendars };
  await renderDates(dates, painted, now);
  // Lines arrive after the dates, which stay put because the layout is anchored to the top.
  await renderFestivals(festivals, now);

  // storage.sync is the source of truth; the mirror may be a visit behind a change from another device.
  const synced = await loadSettings();
  if (synced && JSON.stringify(synced) !== JSON.stringify(painted)) {
    applyLook(synced);
    await renderDates(dates, synced, now);
  }
}

const dates = document.getElementById("dates");
const festivals = document.getElementById("festivals");
if (dates && festivals) {
  void start(dates, festivals);
}
