import { loadCalendarYear, localIso } from "../../src/calendars/year-data.ts";
import { type FestivalLines, festivalLines } from "../../src/festivals/lines.ts";
import { readMirror } from "../../src/settings/mirror.ts";
import { type CalendarId, defaultSettings } from "../../src/settings/types.ts";
import { todayRows } from "../../src/ui/today.ts";

// v0 shows every calendar and both festival sets until the settings store exists (build-plan 8).
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

async function render(dates: HTMLElement, festivals: HTMLElement): Promise<void> {
  const now = new Date();
  const settings = readMirror() ?? { ...defaultSettings, calendars: v0Calendars };
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

  // Lines arrive after the dates, which stay put because the layout is anchored to the top.
  const lines: FestivalLines = await festivalLines(now, ["cultural", "sikh"]).catch(() => ({}));
  const { today, tomorrow } = lines;
  festivals.replaceChildren(
    ...(today ? [element("p", today, "today")] : []),
    ...(tomorrow ? [element("p", tomorrow, "tomorrow")] : []),
  );
}

const dates = document.getElementById("dates");
const festivals = document.getElementById("festivals");
if (dates && festivals) {
  void render(dates, festivals);
}
