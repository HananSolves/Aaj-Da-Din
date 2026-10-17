import { localIso } from "../../src/calendars/year-data.ts";
import type { FestivalLines } from "../../src/festivals/lines.ts";
import { festivalSets } from "../../src/festivals/sets.ts";
import { readMirror } from "../../src/settings/mirror.ts";
import { loadSettings } from "../../src/settings/store.ts";
import { type CalendarId, defaultSettings, type Settings } from "../../src/settings/types.ts";
import { en } from "../../src/strings/en.ts";
import { applyLook } from "../../src/themes/look.ts";
import { todayRows } from "../../src/ui/today.ts";

// With no settings anywhere, the page shows every calendar and festival set until onboarding exists
// (build-plan 12).
const v0Calendars: CalendarId[] = ["gregorian", "punjabi-solar", "bikrami", "nanakshahi", "hijri"];

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

async function renderDates(
  dates: HTMLElement,
  settings: Settings,
  now: Date,
  isCurrent: () => boolean,
): Promise<void> {
  // A year with no bundled file, or a chunk that fails to load, just leaves out that calendar.
  const rows = await todayRows(now, settings);
  if (!isCurrent()) return;

  const iso = localIso(now);
  dates.replaceChildren(
    ...rows.map((row) => {
      const li = document.createElement("li");
      const time = element("time", row.text);
      time.dateTime = iso;
      li.append(element("span", row.label, "label"), time);
      return li;
    }),
  );
}

async function renderFestivals(
  festivals: HTMLElement,
  settings: Settings,
  now: Date,
  isCurrent: () => boolean,
): Promise<void> {
  // Loaded only when the lines are on, so their rules and the calendars they read stay out of the
  // first paint.
  const lines: FestivalLines = settings.showFestivalLines
    ? await import("../../src/festivals/lines.ts")
        .then(({ festivalLines }) =>
          festivalLines(now, {
            sets: settings.festivalSets,
            source: settings.gurpurabSource,
            hijriOffset: settings.hijriOffset,
          }),
        )
        .catch(() => ({}))
    : {};
  if (!isCurrent()) return;

  const { today, tomorrow } = lines;
  festivals.replaceChildren(
    ...(today ? [element("p", today, "today")] : []),
    ...(tomorrow ? [element("p", tomorrow, "tomorrow")] : []),
  );
}

function openSettingsButton(onOpen: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = "settings-open";
  button.type = "button";
  // The text-presentation selector keeps the gear a monochrome glyph instead of a colour emoji.
  button.textContent = "⚙︎";
  button.setAttribute("aria-label", en.settings.open);
  button.addEventListener("click", onOpen);
  return button;
}

async function start(dates: HTMLElement, festivals: HTMLElement): Promise<void> {
  const now = new Date();
  // With nothing stored the page follows the OS colour scheme, so the panel starts from that theme.
  const osTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "raat" : "chitta";
  const fromMirror = readMirror();
  let current: Settings = fromMirror ?? {
    ...defaultSettings,
    theme: osTheme,
    calendars: v0Calendars,
    festivalSets: [...festivalSets],
  };
  let generation = 0;
  let edited = false;

  const render = async (settings: Settings): Promise<void> => {
    const mine = ++generation;
    const isCurrent = () => mine === generation;
    await renderDates(dates, settings, now, isCurrent);
    // Lines arrive after the dates, which stay put because the layout is anchored to the top.
    await renderFestivals(festivals, settings, now, isCurrent);
  };

  document.body.append(
    openSettingsButton(async () => {
      const panel = await import("../../src/ui/settings-panel.ts").catch(() => undefined);
      panel?.openSettings({
        settings: current,
        onChange: (next) => {
          edited = true;
          current = next;
          applyLook(next);
          void render(next);
        },
      });
    }),
  );

  await render(current);

  const app = festivals.parentElement;
  if (app) {
    // After the first frame, then idle: a fast page can have idle time before it has painted.
    // `current` is read when it runs so it sees the synced settings.
    requestAnimationFrame(() =>
      requestIdleCallback(
        () => {
          void import("../../src/ui/ask-card.ts")
            .then((card) => card.maybeShowAsk({ now, settings: current, parent: app }))
            .catch(() => {});
        },
        { timeout: 2000 },
      ),
    );
  }

  // storage.sync is the source of truth; the mirror may be a visit behind a change from another device.
  const synced = await loadSettings();
  if (synced && !edited && JSON.stringify(synced) !== JSON.stringify(current)) {
    current = synced;
    applyLook(synced);
    await render(synced);
  }
}

const dates = document.getElementById("dates");
const festivals = document.getElementById("festivals");
if (dates && festivals) {
  void start(dates, festivals);
}
