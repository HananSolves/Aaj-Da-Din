# Feature: Bare new tab

**From build-plan:** feature 6
**Build attempt:** 1
**Branch:** feature/bare-new-tab
**Status:** verified

## Goal

Make the new tab show what features 1 to 5 compute: today's date in the five calendars (Gregorian, Desi, Bikrami, Nanakshahi, Hijri) and the "Today: …" / "Tomorrow: …" festival lines, on one theme with a solid background. The theme and calendar list come from the `localStorage` settings mirror, so nothing flashes the wrong theme. Photos, the fact and credit line are feature 7. The settings store is feature 8, so v0 only reads the mirror and nothing writes it yet.

The page is one `<main>` with a list of date rows and a festival block. All text goes in with `textContent`, never `innerHTML`.

### Decisions this spec records

All are reversible and are cheap to change in features 8 and 9.

- **No mirror means all five calendars.** Plan §3.2 says v0 shows "all five calendars (dev defaults hard-coded)". `defaultSettings.calendars` stays at Gregorian + Desi + Nanakshahi, because that is the skip-onboarding default (plan §3.4). The page falls back to a separate v0 constant in plan-table order: `gregorian, desi, bikrami, nanakshahi, hijri`. A valid mirror's `calendars` list, in its saved order, wins over that constant.
- **The mirror is validated, all or nothing.** `readMirror()` currently casts `JSON.parse` output to `Settings`. A malformed, wrong-`schemaVersion` or unknown-calendar value is treated as "no mirror", so the new tab always renders (coding-standards, Error Handling). Feature 8 owns real migrations and may replace this guard.
- **One render pass, after the year file loads.** The page awaits the current year's bundled file (about 1.5 KB, from the extension package, no network), then renders all rows at once. Festival lines are appended afterwards. The themed background still paints first from the mirror. If the v0 sign-off first-paint measurement in feature 7 misses 100 ms, the fix is to paint the data-free rows first. Do not build that now.
- **The page anchors to the top, not the centre.** Festival lines arrive after the rows, so a centred layout would move the dates when they appear.
- **Rows carry a small calendar name.** `Desi` ("25 Assu") and `Nanakshahi` ("27 Assu 558 NS") look alike without one. The first row is headline size and the rest are secondary. Feature 9 owns date styles.
- **A missing piece drops its own row.** No year file (outside 2026–2036) omits the Desi and Bikrami rows. A Hijri conversion that throws (no umm al-Qura data in the browser) omits the Hijri row. A year-file load that rejects is treated as "no file". Nothing blanks the page.
- **`<time datetime>` is the local date.** The scaffold uses `toISOString()`, which is the UTC date and is wrong before 05:00 in Punjab. Every row uses the local `YYYY-MM-DD`.
- **Festival sets are hard-coded to `["cultural", "sikh"]`.** Choosing sets is feature 8 and 10.

## In scope

- `src/settings/mirror.ts`: `parseMirror(raw)` validator, used by `readMirror()`.
- `src/calendars/year-data.ts`: export `localIso(date)` and make `locate()` use it.
- `src/ui/today.ts`: `todayRows(now, settings, data)` view-model.
- `src/strings/en.ts`: calendar names.
- `entrypoints/newtab/index.html`, `critical.css`, `main.ts`: markup, styles, rendering and festival lines.
- Tests for the validator, `localIso` and the view-model.
- One decision-log line in `blueprint/project-plan.md` §11 (last step).

## Out of scope

- Writing the mirror, reading `storage.sync`, migrations, any settings change (feature 8). `Settings` and `defaultSettings` do not change.
- More themes, date styles, solid-colour mode toggle (feature 9). One theme: the existing light and dark tokens following `prefers-color-scheme`.
- Hindu and Muslim festival sets, "expected" labels, Gurpurab source (feature 10).
- Photos, credit line, fact (features 7, 13 to 15), settings panel, onboarding, donation card.
- `aria-label`s on dates and the WCAG contrast pass (feature 17). This feature ships semantic HTML, `<time datetime>` and `lang="en"` only.
- Updating at midnight while a tab stays open. A new tab reads the date when it opens.
- The v0 sign-off measurements: first paint, offline run, three browsers (feature 7).
- A clock, countdown, or any new permission, background script or runtime dependency.

## Build loop

`workflow.stepReview` is `feature`, so review happens once for the whole feature after the last step. `workflow.checkpointCommits` is `disabled`, so there are no checkpoint commits. `/complete` creates the single feature commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. Validated mirror and local ISO date.**
  - In `src/settings/mirror.ts`, add `parseMirror(raw: string | null): Settings | null`. It returns `null` for `null`, invalid JSON, a non-object, `schemaVersion !== 1`, `calendars` that is empty, has an unknown id or has a duplicate, `hijriOffset` outside `-1 | 0 | 1`, or a non-string `theme`. Otherwise it returns the parsed object. `readMirror()` becomes `parseMirror(localStorage.getItem(KEY))` inside the existing `try`, so a throwing `localStorage` still gives `null`. `theme-boot.ts` needs no change.
  - In `src/calendars/year-data.ts`, add `export function localIso(date: Date): string` (local `YYYY-MM-DD`, zero-padded) and make `locate()` build its `iso` with it. Behaviour of `locate()` is unchanged.
  - Add `tests/mirror.test.ts` for each rejection above, a valid mirror, and a valid mirror with extra fields. Add a `localIso` case to `tests/year-data.test.ts`: `new Date(2026, 9, 15, 0, 30)` returns `2026-10-15`, and so does `new Date(2026, 9, 15, 23, 59)`, which must hold in any `TZ` because the dates are built from local fields.
  - **Done when:** `pnpm typecheck`, `pnpm lint` and `pnpm test` pass with the new and changed tests in the run, and the existing `locate` tests still pass.

- [x] **2. Date-row view-model.**
  - Add `calendarNames` to `src/strings/en.ts`: `gregorian: "Gregorian"`, `desi: "Desi"`, `bikrami: "Bikrami"`, `nanakshahi: "Nanakshahi"`, `hijri: "Hijri"`.
  - Add `src/ui/today.ts` exporting `DateRow` and `todayRows(now, settings, data)` (see Data / contracts). It returns one row per entry of `settings.calendars`, in that order, using `formatGregorian`, `formatDesi`, `formatNanakshahi`, `formatBikrami` and `formatHijri(now, settings.hijriOffset)`. Desi and Bikrami rows are omitted when `data` is `undefined`. A Hijri row is omitted when `formatHijri` throws. An invalid `now` throws `RangeError`, as the calendar modules do.
  - Add `tests/today.test.ts`. Take expected strings from the existing sourced fixtures for each calendar (cited in `tests/fixtures/calendar.ts` and the per-calendar tests), not from running `todayRows`:
    - All five, in the order given, with the expected text per calendar for one fixture date.
    - Order follows `settings.calendars`: a reversed list gives reversed rows, and a one-calendar list gives one row.
    - `data` of `undefined` omits Desi and Bikrami and keeps the other three.
    - `hijriOffset: 1` moves only the Hijri row.
    - An invalid date throws.
    - A Hijri failure (stub `Intl.DateTimeFormat` through `vi.spyOn` or make `formatHijri` throw via `vi.mock`) omits only that row.
  - **Done when:** `pnpm typecheck`, `pnpm lint` and `pnpm test` pass with the new file in the run.

- [x] **3. Render the page.**
  - `entrypoints/newtab/index.html`: replace `<time id="date">` with `<ul id="dates"></ul>` and `<div id="festivals"></div>` inside `<main id="app">`. Keep the `theme-boot.ts` script before the stylesheet and `main.ts` at the end of `<body>`.
  - `entrypoints/newtab/main.ts`:
    - `settings = readMirror() ?? { ...defaultSettings, calendars: v0Calendars }`, where `v0Calendars` is the five-calendar constant from the decisions above.
    - `data = await loadCalendarYear(now.getFullYear())` inside `try`/`catch`, resolving to `undefined` on a rejection.
    - Render each `todayRows` row as `<li><span class="label">…</span> <time datetime="{localIso(now)}">…</time></li>`, using `createElement` and `textContent`.
    - Then `festivalLines(now, ["cultural", "sikh"])` inside `try`/`catch`. Add one `<p>` for each key that exists and nothing for a key that does not. A rejection means no lines.
    - A failure anywhere leaves the themed page standing, with no uncaught error in the console.
  - `entrypoints/newtab/critical.css`: top-anchored layout with `padding-top` (not `place-items: center`), a list without bullets, the first row at the existing `clamp(2rem, 6vw, 4rem)` size, other rows and labels smaller, the Tomorrow line quieter than Today. Reuse `--bg` and `--fg`. Add colour tokens only if a new tint is needed, with both the light and dark values, and keep it out of colour-alone cues.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm build:firefox` and `pnpm size` pass, and the output is still under the 25 KB JS, 8 KB CSS and 100 KB package budgets. The year-data chunks and the new page code are inside the JS number, so read it. The permissions in both manifests are still `storage` only.

- [x] **4. Browser evidence and decision log.**
  - Load `.output/chrome-mv3` unpacked in Chrome, open a new tab, and check: all five rows show in the right order with today's date, the console has no errors, and the themed background paints with no wrong-theme flash. Set `localStorage["tarikh:settings"]` by hand in DevTools to a valid mirror with `theme: "dark"` and a shorter `calendars` list, reload, and check the theme and rows follow it. Then set it to garbage (and to a mirror with `schemaVersion: 2`) and check the page falls back to the five-calendar default.
  - Load `.output/firefox-mv3` through `about:debugging` and repeat the first check.
  - Festival lines show only on a festival day or the day before, and the date will not be one today, so do not claim to have seen a line in the browser unless one appeared. Their text and dates are covered by feature 5's tests.
  - Add one line to `blueprint/project-plan.md` §11 (match the existing entries) recording that v0 falls back to all five calendars when no mirror exists, while `defaultSettings` keeps the three-calendar skip-onboarding default.
  - **Done when:** the observed results above are written in the hand-over, each marked as observed or not run. `pnpm check` passes once more.

## Files / areas

- `src/settings/mirror.ts`, `src/calendars/year-data.ts`, `src/ui/today.ts` (new), `src/strings/en.ts`
- `entrypoints/newtab/index.html`, `entrypoints/newtab/critical.css`, `entrypoints/newtab/main.ts`
- `tests/mirror.test.ts` (new), `tests/today.test.ts` (new), `tests/year-data.test.ts`
- `blueprint/project-plan.md` (§11, one line)
- Unchanged on purpose: `src/settings/types.ts`, `src/festivals/*`, `data/calendar/*`, `scripts/*`, `wxt.config.ts`, `theme-boot.ts`.

## Data / contracts

```ts
// src/settings/mirror.ts
export function parseMirror(raw: string | null): Settings | null;

// src/calendars/year-data.ts
export function localIso(date: Date): string; // local date, "YYYY-MM-DD"

// src/ui/today.ts
export interface DateRow {
  calendar: CalendarId;
  label: string; // en.calendarNames[calendar]
  text: string;  // for example "15 October 2026"
}
export function todayRows(
  now: Date,
  settings: Pick<Settings, "calendars" | "hijriOffset">,
  data: CalendarYear | undefined,
): DateRow[];
```

- No stored field is added or changed. The mirror key stays `tarikh:settings` and its shape stays `Settings` v1.
- Rows never carry markup. The page sets text with `textContent`.
- The page never throws to the console for a missing year file, a bad mirror, or missing Hijri data.

## Testing

`pnpm test` is configured, so logic steps ship tests with them:

- `parseMirror` (every rejection plus the valid case), `localIso` (local date near midnight, any `TZ`), `todayRows` (order, omission, offset, errors). Expected dates and strings come from the sourced calendar fixtures.
- Not unit-tested, per coding-standards: the DOM, CSS and layout. They ride on the build, `pnpm size` and the manual browser evidence in step 4.
- No browser test runner is declared, so no automated browser evidence is claimed. Festival lines in the browser are not claimed unless seen.

## Notes for the AI

- Never "fix" a date without a source. If a calendar's output looks wrong on screen, stop and report it. Do not adjust it here.
- Use the local date everywhere (`getFullYear()` and friends, `localIso`). Never `toISOString()` for a date shown to the user.
- No `innerHTML`, no new dependencies, no new permissions, no background script.
- Do not widen `Settings` or `defaultSettings`. Do not add themes, date styles or settings code.
- Add UI strings to `src/strings/en.ts` only. The calendar names go there, and nothing is hard-coded in `main.ts` or `index.html`.
- Check `pnpm size` after step 3. If the JS budget is at risk, stop and report. Do not trim data.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":13012,"specSha256":"7577f83071477902a2ea944f6d48b48ec0e8453fa324a36f70f6d1604ac441da","branch":"refs/heads/feature/bare-new-tab","head":"a3551315fe2908e11035d8ef672b8d78e1277368","baseRef":"refs/heads/main","baseCommit":"a3551315fe2908e11035d8ef672b8d78e1277368","sourceTree":"65d507e9ddcb73d99de2ecd4b64442d3c20d16e6","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

1. `pnpm build`
2. In Chrome or Edge open `chrome://extensions`, turn on Developer mode, choose Load unpacked and pick `.output/chrome-mv3`.
3. Open a new tab.

Expected:

A page with a large Gregorian date on top (for example `15 October 2026`) and four smaller rows under it, each with a small calendar name: Desi (`29 Assu`), Bikrami (`Assu Sudi 5, Samvat 2083`), Nanakshahi (`1 Katak 558 NS`) and Hijri (`4 Jumada al-Awwal 1448 AH`). The values shown are for 15 October 2026; on another day they move with the date. A "Today: …" or "Tomorrow: …" line appears under them only on a festival day or the day before (for example Tomorrow: Vaisakhi · Khalsa Sajna Divas on 13 April 2026); on other days there is no line. The background is the light theme, or the dark theme when the system prefers dark.

This proves:

The new tab renders all five calendars from the bundled data and the festival lines without any network, and an installed build opens on the new tab. It does not show the settings-mirror cases or a festival line on an ordinary day.
