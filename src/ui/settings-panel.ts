import { browser } from "wxt/browser";
import { festivalSets, gurpurabSources } from "../festivals/sets.ts";
import { calendarRows, moveCalendar, toggleCalendar, toggleFestivalSet } from "../settings/edit.ts";
import { NewerSettingsError, saveSettings } from "../settings/store.ts";
import { backgrounds, type CalendarId, dateStyles, type Settings } from "../settings/types.ts";
import { en } from "../strings/en.ts";
import { feedbackUrl, supportUrl } from "../support/links.ts";
import { themeIds } from "../themes/themes.ts";
import "./settings-panel.css";

const text = en.settings;
const repositoryUrl = "https://github.com/HananSolves/Aaj-Da-Din";

export interface SettingsPanelOptions {
  settings: Settings;
  /** Called with every edit before it is saved, so the page never waits on storage. */
  onChange: (next: Settings) => void;
}

interface Choice<T> {
  value: T;
  label: string;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  content?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}

function checkbox(label: string, checked: boolean, onToggle: () => void): HTMLLabelElement {
  const input = element("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", onToggle);
  const row = element("label", "choice");
  row.append(input, element("span", undefined, label));
  return row;
}

function radioGroup<T>(
  legend: string,
  name: string,
  choices: Choice<T>[],
  current: T,
  onPick: (value: T) => void,
  hint?: string,
): HTMLFieldSetElement {
  const group = element("fieldset");
  group.append(element("legend", undefined, legend));
  if (hint) group.append(element("p", "hint", hint));
  for (const { value, label } of choices) {
    const input = element("input");
    input.type = "radio";
    input.name = name;
    input.checked = value === current;
    input.addEventListener("change", () => onPick(value));
    const row = element("label", "choice");
    row.append(input, element("span", undefined, label));
    group.append(row);
  }
  return group;
}

function section(title: string, ...children: HTMLElement[]): HTMLElement {
  const el = element("section");
  el.append(element("h2", undefined, title), ...children);
  return el;
}

function externalLink(label: string, href: string): HTMLParagraphElement {
  const link = element("a", undefined, label);
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const row = element("p");
  row.append(link);
  return row;
}

function supportSection(): HTMLElement {
  return section(
    en.support.section,
    externalLink(en.support.supportLink, supportUrl),
    externalLink(en.support.feedbackLink, feedbackUrl),
  );
}

function aboutSection(): HTMLElement {
  return section(
    text.sections.about,
    element("p", undefined, `${text.version} ${browser.runtime.getManifest().version}`),
    externalLink(text.openSource, repositoryUrl),
  );
}

/**
 * Opens the settings dialog. Every edit is applied through `onChange` at once and then saved; a
 * failed save is reported in the panel while the change stays on the page for this tab.
 */
export function openSettings({ settings, onChange }: SettingsPanelOptions): void {
  if (document.querySelector("dialog.settings")) return;

  let state = settings;
  let saves = 0;
  const error = element("p", "error");
  error.setAttribute("role", "status");
  const note = element("p", "note");
  note.setAttribute("role", "status");
  const calendarList = element("ul", "calendars");

  const commit = (next: Settings): void => {
    state = next;
    onChange(next);
    const mine = ++saves;
    saveSettings(next).then(
      () => {
        if (mine === saves) error.textContent = "";
      },
      (failure: unknown) => {
        if (mine === saves) {
          error.textContent =
            failure instanceof NewerSettingsError ? text.newerVersion : text.saveFailed;
        }
      },
    );
  };

  const focusOn = (key: string, fallback = key): void => {
    const find = (k: string) =>
      calendarList.querySelector<HTMLElement>(`[data-focus="${k}"]:not(:disabled)`);
    (find(key) ?? find(fallback))?.focus();
  };

  const renderCalendars = (focus?: [string, string?]): void => {
    const rows = calendarRows(state);
    const enabled = rows.filter((row) => row.enabled);
    calendarList.replaceChildren(
      ...rows.map(({ id, enabled: on }) => {
        const name = en.calendarNames[id];
        const item = element("li");
        const toggle = checkbox(name, on, () => {
          commit(toggleCalendar(state, id));
          renderCalendars([`toggle:${id}`]);
        });
        const input = toggle.querySelector("input");
        if (input) {
          input.dataset.focus = `toggle:${id}`;
          input.disabled = on && enabled.length === 1;
        }
        item.append(toggle);
        if (on) {
          const position = enabled.findIndex((row) => row.id === id);
          item.append(
            moveButton(id, "up", "↑", text.moveUp(name), position === 0),
            moveButton(id, "down", "↓", text.moveDown(name), position === enabled.length - 1),
          );
        }
        return item;
      }),
    );
    if (focus) focusOn(...focus);
  };

  const moveButton = (
    id: CalendarId,
    direction: "up" | "down",
    glyph: string,
    label: string,
    atEdge: boolean,
  ): HTMLButtonElement => {
    const button = element("button", "move", glyph);
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.dataset.focus = `${direction}:${id}`;
    button.disabled = atEdge;
    button.addEventListener("click", () => {
      commit(moveCalendar(state, id, direction === "up" ? -1 : 1));
      const position = state.calendars.indexOf(id) + 1;
      note.textContent = text.moved(en.calendarNames[id], position, state.calendars.length);
      renderCalendars([`${direction}:${id}`, `${direction === "up" ? "down" : "up"}:${id}`]);
    });
    return button;
  };

  const choices = <T extends string>(ids: readonly T[], names: Record<T, string>): Choice<T>[] =>
    ids.map((value) => ({ value, label: names[value] }));

  const dialog = element("dialog", "settings");
  dialog.setAttribute("aria-labelledby", "settings-title");
  const header = element("header");
  const title = element("h1", undefined, text.title);
  title.id = "settings-title";
  const close = element("button", "close", text.close);
  close.type = "button";
  close.addEventListener("click", () => dialog.close());
  header.append(title, close);

  const body = element("div", "body");
  body.append(
    error,
    note,
    section(text.sections.calendars, calendarList),
    section(
      text.sections.look,
      radioGroup(text.theme, "theme", choices(themeIds, en.themeNames), state.theme, (theme) =>
        commit({ ...state, theme }),
      ),
      radioGroup(
        text.dateStyle,
        "dateStyle",
        choices(dateStyles, en.dateStyleNames),
        state.dateStyle,
        (dateStyle) => commit({ ...state, dateStyle }),
      ),
      radioGroup(
        text.background,
        "background",
        choices(backgrounds, text.backgroundNames),
        state.background,
        (background) => commit({ ...state, background }),
      ),
    ),
    section(
      text.sections.festivals,
      festivalSetGroup(),
      radioGroup(
        text.gurpurabSource,
        "gurpurabSource",
        choices(gurpurabSources, text.gurpurabSourceNames),
        state.gurpurabSource,
        (gurpurabSource) => commit({ ...state, gurpurabSource }),
      ),
      radioGroup<-1 | 0 | 1>(
        text.hijriOffset,
        "hijriOffset",
        [
          { value: -1, label: text.hijriOffsetNames.earlier },
          { value: 0, label: text.hijriOffsetNames.calculated },
          { value: 1, label: text.hijriOffsetNames.later },
        ],
        state.hijriOffset,
        (hijriOffset) => commit({ ...state, hijriOffset }),
        text.hijriOffsetHint,
      ),
      checkbox(text.showFestivalLines, state.showFestivalLines, () =>
        commit({ ...state, showFestivalLines: !state.showFestivalLines }),
      ),
    ),
    section(
      text.sections.fact,
      checkbox(text.showFact, state.showFact, () =>
        commit({ ...state, showFact: !state.showFact }),
      ),
    ),
    supportSection(),
    aboutSection(),
  );

  function festivalSetGroup(): HTMLFieldSetElement {
    const group = element("fieldset");
    group.append(element("legend", undefined, text.festivalSets));
    for (const set of festivalSets) {
      group.append(
        checkbox(text.festivalSetNames[set], state.festivalSets.includes(set), () =>
          commit(toggleFestivalSet(state, set)),
        ),
      );
    }
    return group;
  }

  dialog.append(header, body);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => dialog.remove());
  renderCalendars();
  document.body.append(dialog);
  dialog.showModal();
}
