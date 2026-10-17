# Feature: Hindu and Muslim festival sets

**From build-plan:** feature 10
**Build attempt:** 1
**Branch:** feature/hindu-and-muslim-festival-sets
**Status:** verified

## Goal

Add the Hindu and Muslim festival sets to the "Today:" / "Tomorrow:" lines, label Muslim dates "expected", and add the Gurpurab source switch (SGPC jantri by default, Original Nanakshahi optional). Which sets show, the source, and the Hijri offset now come from settings (schema 3) instead of being hard-coded in `main.ts`.

Nothing in the UI writes these settings yet (settings panel is feature 11, onboarding feature 12), so the sets and the source are exercised by writing `storage.sync` or the mirror directly.

### Decisions this spec records

All are cheap to change before 1.0.0; nothing has been published. Items marked **review** are product calls the plan does not settle.

- **Hindu dates are sourced, not approximated.** The calendar data holds only the sunrise tithi, but several Hindu festivals are dated by another time of day (Dussehra by the afternoon tithi, Maha Shivratri by the midnight one, Diwali by the evening one). A probe of the sunrise rule against Drik Panchang (New Delhi) for 2026 and 2027 was a day off for Maha Shivratri, Holi (2027), Dussehra, Karva Chauth (2027) and Diwali (2026). So each Hindu festival gets a sourced-dates fixture scraped from Drik Panchang's monthly Hindu festival pages for New Delhi, and uses a `dates` rule (the existing escape hatch from the plan's decision log). **Coverage is 2026 to 2030, not 2026 to 2036:** Drik began returning 403 before 2031 to 2036 could be read, Dekho Panchang's pages carry dates only to 2030, Vedic Panchang is behind a Cloudflare block, and no other source covered all eight festivals for one city. A `tithi` rule cannot be validated against five years, so none is used: a year with no listed date shows no Hindu line rather than a guessed one. Adding 2031 to 2036 is tracked in project memory.
- **Smarta over ISKCON (review).** Where Drik lists two dates for one festival (Rama Navami 2026: 26 Mar Smarta, 27 Mar ISKCON), the Smarta date is used. Drik labels the tradition on the entry.
- **Muslim set from `toHijri`.** A new `hijri` rule kind matches a Hijri month and day on the date moved by the user's `hijriOffset`, so "Match your local mosque" also moves the festival lines and they always agree with the Hijri row. Five festivals: Ramadan begins (1 Ramadan), Eid al-Fitr (1 Shawwal), Eid al-Adha (10 Dhu al-Hijjah), Islamic New Year (1 Muharram), Ashura (10 Muharram). If the browser has no umm al-Qura data the rule never matches and the page still renders. Mawlid and Shab-e-Barat stay out (plan §10 question is open).
- **"expected" label.** Every festival with a `hijri` rule is shown as `Eid al-Fitr (expected)`, because moon sighting decides the real day. It follows the rule kind, so a new Hijri festival cannot forget it.
- **Original Nanakshahi (2003) switch.** A `Festival` may carry `original?: FestivalRule`, used instead of `rule` when `gurpurabSource` is `nanakshahi`. The Wikipedia article on the Nanakshahi calendar (fixed-date table citing Purewal's `gurpurbs_fixed_dates.pdf`) gives fixed Gregorian dates for five of our Sikh festivals: Shaheedi Guru Arjan Dev Ji 16 Jun (2 Harh), First Prakash of Guru Granth Sahib Ji 1 Sep (17 Bhadon), Gurgaddi Guru Granth Sahib Ji 20 Oct (6 Katak), Shaheedi Guru Tegh Bahadur Ji 24 Nov (11 Maghar), Prakash Guru Gobind Singh Ji 5 Jan (23 Poh). Khalsa Sajna Divas is 14 Apr in both. Hola Mohalla, Bandi Chhor Divas and Guru Nanak's Prakash were kept movable (Bikrami) in the 2003 version, so they follow the same rule under both sources and have no `original`. Fixed dates use the existing `gregorian` rule, which holds in every year.
- **Source label (review).** When the source is `nanakshahi`, a festival that has an `original` date gets the suffix `(Original Nanakshahi)` so a date that differs from the jantri is not mistaken for it. Under the SGPC default no suffix is added. The settings panel (feature 11) labels the switch itself.
- **Schema 3.** `Settings` gains `festivalSets: FestivalSet[]` (any subset, including empty, no duplicates) and `gurpurabSource: "sgpc" | "nanakshahi"`. Migration 2 to 3 adds `["cultural", "sikh"]` and `"sgpc"`, which is exactly what a v2 install showed. `defaultSettings` uses the same values (Nanakshahi is on by default, so Sikh is on). The "show Today/Tomorrow lines" toggle is left to feature 11.
- **No settings anywhere (review).** The v0 fallback already shows all five calendars until onboarding exists; it now also enables all four festival sets, so the page shows every festival the calendars imply. This changes the plan §11 decision-log line for the v0 fallback (updated in the last step).
- **Order on a shared day.** List order is cultural, Hindu, Sikh, Muslim, so Diwali and Bandi Chhor Divas on 8 Nov 2026 read `Diwali · Bandi Chhor Divas`, as in plan §3.3.

### Sources

- Original Nanakshahi fixed dates and the 2003 movable-date note: https://en.wikipedia.org/wiki/Nanakshahi_calendar (raw table read directly; it cites Purewal's `gurpurbs_fixed_dates.pdf` and `gurpurbs_movable_dates.pdf` on purewal.biz, which were not read, so this is a secondary source).
- Hindu dates (2026 to 2030): Drik Panchang monthly Hindu festivals, `https://www.drikpanchang.com/festivals/month/festivals-<month>.html?year=<year>&geoname-id=1261481` (New Delhi, IST).
- Muslim dates: Makkah Live "Key Islamic dates in 1448 AH" (https://makkahlive.net/en/tools/islamic-calendar, "per the Umm al-Qura calendar of Saudi Arabia"), covering June 2026 to May 2028. 1 Ramadan, Eid al-Fitr and Eid al-Adha 2026 come from the Islamic prayer-times and Islam Channel 2026 calendars (secondary); the umm al-Qura values from `Intl` agree with every date found.

## In scope

- `src/festivals/sets.ts` (new): `festivalSets`, `FestivalSet`, `gurpurabSources`, `GurpurabSource`. A tiny module so the settings validator (which the boot script bundles) does not pull in festival data.
- `src/settings/types.ts`, `migrations.ts`: schema 3, new fields, validation, migration step.
- `src/festivals/rules.ts`: `hijri` rule kind, optional `original` rule, `FestivalQuery` options (`sets`, `source`, `hijriOffset`).
- `src/festivals/festivals.ts`: Hindu and Muslim festivals, `original` on five Sikh festivals, list order.
- `src/festivals/lines.ts`: options object, "expected" and source labels.
- `src/strings/en.ts`: festival names, `expected`, source label.
- `entrypoints/newtab/main.ts`: lines driven by settings, re-rendered after a differing sync, fallback sets.
- Tests and fixtures; one decision-log edit in `blueprint/project-plan.md` §11 and a regenerated `project-overview.md` (last step).

## Out of scope

- Any UI to change the new settings (features 11, 12), the show-lines toggle, Mawlid, Shab-e-Barat, a tithi line, countdowns.
- Changing the calendar data shape (`data/calendar/*.json` is locked) or adding sunset or noon tithis.
- The festival strings of other languages, new permissions, a background script or a runtime dependency.
- Writing migrated settings back on load (feature 8 decided this).

## Build loop

`workflow.stepReview` is `feature`; `workflow.checkpointCommits` is `disabled`, so no checkpoint commits and `/complete` makes the single commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. Set ids and settings schema 3.**
  - `src/festivals/sets.ts`: `festivalSets = ["cultural", "hindu", "sikh", "muslim"] as const`, `FestivalSet`, `gurpurabSources = ["sgpc", "nanakshahi"] as const`, `GurpurabSource`. `rules.ts` imports `FestivalSet` from it.
  - `types.ts`: `schemaVersion: 3`, `festivalSets`, `gurpurabSource`; `defaultSettings` gets `["cultural", "sikh"]` and `"sgpc"`.
  - `migrations.ts`: `currentSchemaVersion = 3`; `migrations[1]` adds the two fields; `isCurrentShape` requires a duplicate-free array of known set ids (empty allowed) and a known source.
  - Update `tests/migrations.test.ts`, `mirror.test.ts`, `store.test.ts` fixtures to schema 3. Add cases: v2 migrates with the new fields and keeps its others; v1 migrates through both steps; unknown set, duplicate set, non-array and unknown source are rejected; an empty `festivalSets` is accepted; a schema 4 value is `null`.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

- [x] **2. Rule engine: `hijri` rule, `original` alternate, query options, labels.**
  - `rules.ts`: `FestivalRule` gains `{ kind: "hijri"; month: number; day: number }`, matched against `toHijri(date, hijriOffset)` (a thrown error means no match). `Festival` gains `original?: FestivalRule`. `resolveFestivals(date, data, query, list)` takes a `FestivalQuery` (`sets`, optional `source` defaulting to `sgpc`, optional `hijriOffset` defaulting to `0`) in place of the bare `sets` array; the active rule is `source === "nanakshahi" && original ? original : rule`.
  - `lines.ts`: `festivalLines(now, query, load, list)`; a name gets `en.expected` in brackets when the festival's `rule.kind` is `hijri`, and `en.originalNanakshahi` in brackets when the source is `nanakshahi` and the festival has `original`.
  - Update the existing calls in `tests/festivals.test.ts` and `tests/festival-lines.test.ts` to the options object (mechanical).
  - New tests on synthetic festivals (not real data): `hijri` matches the Hijri day and moves with `hijriOffset` -1, 0, 1; a `hijri` rule with unavailable umm al-Qura data (mock `toHijri` to throw) never matches; `original` is used only under `nanakshahi`; a festival without `original` is unchanged by the switch; the two labels appear only where specified.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

- [x] **3. Muslim set.**
  - `festivals.ts`: `ramadanBegins` (9/1), `eidAlFitr` (10/1), `eidAlAdha` (12/10), `islamicNewYear` (1/1), `ashura` (1/10), all `set: "muslim"` with `hijri` rules. `en.ts`: names and `expected`.
  - `tests/fixtures/festivals.ts`: `sourcedMuslim` with the Gregorian dates for 1 Ramadan, Eid al-Fitr, Eid al-Adha, Islamic New Year and Ashura from February 2026 to June 2028 (sources above), each with the citation in a comment.
  - Tests: each festival falls on its sourced dates and no other day of those years; a sweep over 2026 to 2036 finds each festival at gaps of 354 or 355 days; the lines for the eve of Eid al-Fitr 2027 read `Tomorrow: Eid al-Fitr (expected)`.
  - **Done when:** `pnpm test` passes with the sourced Muslim dates matching the `Intl` output.

- [x] **4. Original Nanakshahi alternates.**
  - `festivals.ts`: add `original` (`gregorian` rule) to `shaheediGuruArjan` (6/16), `prakashGuruGranthSahib` (9/1), `gurgaddiGuruGranthSahib` (10/20), `shaheediGuruTegBahadur` (11/24), `prakashGuruGobindSingh` (1/5).
  - `fixtures/festivals.ts`: `sourcedOriginalNanakshahi` with those five fixed dates (month and day, cited to the Wikipedia table and Purewal's PDF).
  - Tests: under `nanakshahi` each of the five falls on its fixed date in every year 2026 to 2036 and on none of the SGPC days; under `sgpc` they are unchanged; Hola Mohalla, Bandi Chhor Divas, Guru Nanak's Prakash and Khalsa Sajna Divas give the same days under both sources; a line under `nanakshahi` carries `(Original Nanakshahi)` only on the five.
  - **Done when:** `pnpm test` passes and the existing sourced-SGPC tests still pass unchanged.

- [x] **5. Hindu set.**
  - Scrape the eight festivals from Drik Panchang (script in the scratchpad, not the repo) into `sourcedHindu` in `tests/fixtures/festivals.ts` for 2026 to 2030, with the URL pattern, the location (New Delhi), the Smarta choice and the missing years in a comment.
  - `festivals.ts`: `mahaShivratri`, `holi`, `ramNavami`, `rakshaBandhan`, `janmashtami`, `dussehra`, `karvaChauth`, `diwali` (`set: "hindu"`, placed between cultural and Sikh), each a `dates` rule with the fixture dates.
  - Tests: every Hindu festival falls on its sourced dates and no other day of those years (the existing sourced-dates test extended with `sourcedHindu`); the lines for 8 Nov 2026 read `Today: Diwali · Bandi Chhor Divas`; a year with no sourced date shows no Hindu line.
  - Never fill dates from memory or from a search snippet; years without a source stay empty.
  - **Done when:** `pnpm test` passes and every Hindu festival matches Drik for 2026 to 2030.

- [x] **6. Wire the new tab.**
  - `main.ts`: `renderFestivals(festivals, settings, now)` passes `settings.festivalSets`, `gurpurabSource` and `hijriOffset`; after a differing sync it re-renders the lines as well as the dates; the no-settings fallback sets `festivalSets` to all four sets. Keep first paint unchanged (dates first, lines after).
  - Any new strings in `en.ts`; no literals in UI code.
  - **Done when:** `pnpm check` passes (typecheck, lint, test, calendar check, both builds, size, manifest), JS under 25 KB gzip and CSS under 8 KB gzip. If the budget is at risk, stop and report.

- [x] **7. Browser evidence on Chrome and Firefox.**
  - On `.output/chrome-mv3` and `.output/firefox-mv3`, same checks on each, with `Date` overridden in the page (a preload script in Chrome, an extra first script in a copy of the Firefox build, as in the project memory) so a chosen day is "today": Diwali and Bandi Chhor Divas (8 Nov 2026) joined with the Hindu and Sikh sets on; the same day with only `["cultural", "sikh"]` shows only Bandi Chhor Divas; the eve of Eid al-Fitr 2027 shows `(expected)`, and `hijriOffset` 1 moves it a day; a Gurpurab under `nanakshahi` (for example 20 Oct 2026, Gurgaddi) shows the label and the SGPC day (11 Nov 2026) shows nothing; schema 2 settings in `storage.sync` migrate in memory and still show cultural and Sikh only; no settings anywhere shows all four sets; garbage in storage leaves a working page; no console errors. Probe the console capture first, as the memory says.
  - **Done when:** each case is recorded per browser as observed or not run, with screenshot paths for the Diwali day and the Eid eve.

- [x] **8. Decision log and overview.**
  - `blueprint/project-plan.md` §11: replace the v0 fallback line (all four sets now) and add one line for this feature (Hindu dates sourced from Drik with a `dates` fallback, `hijri` rule and "expected" label, the `original` alternate and which five Gurpurabs move, schema 3). §3.4.3 and §10 untouched. Re-run the `/overview` behaviour because the plan hash changes.
  - **Done when:** `pnpm check` passes once more.

## Files / areas

- `src/festivals/sets.ts` (new), `rules.ts`, `festivals.ts`, `lines.ts`
- `src/settings/types.ts`, `migrations.ts`
- `src/strings/en.ts`
- `entrypoints/newtab/main.ts`
- `tests/migrations.test.ts`, `mirror.test.ts`, `store.test.ts`, `festivals.test.ts`, `festival-lines.test.ts`, `fixtures/festivals.ts`
- `blueprint/project-plan.md` (§11), `blueprint/context/project-overview.md` (regenerated)
- Unchanged on purpose: `src/calendars/*`, `data/calendar/*`, `src/ui/today.ts`, `critical.css`, `index.html`, `wxt.config.ts`, `store.ts`, `mirror.ts`.

## Data / contracts

```ts
// src/festivals/sets.ts
export const festivalSets = ["cultural", "hindu", "sikh", "muslim"] as const;
export type FestivalSet = (typeof festivalSets)[number];
export const gurpurabSources = ["sgpc", "nanakshahi"] as const;
export type GurpurabSource = (typeof gurpurabSources)[number];

// src/settings/types.ts
export interface Settings {
  schemaVersion: 3;
  calendars: CalendarId[];
  theme: ThemeId;
  dateStyle: DateStyle;
  background: Background;
  hijriOffset: -1 | 0 | 1;
  festivalSets: FestivalSet[];
  gurpurabSource: GurpurabSource;
}

// src/festivals/rules.ts
export type FestivalRule =
  | { kind: "gregorian"; month: number; day: number }
  | { kind: "sangrand"; month: number; daysBefore?: number }
  | { kind: "tithi"; month: number; paksha: "sudi" | "vadi"; day: number }
  | { kind: "dates"; dates: readonly string[] }
  | { kind: "hijri"; month: number; day: number };
export interface Festival { id: string; set: FestivalSet; rule: FestivalRule; original?: FestivalRule }
export interface FestivalQuery { sets: readonly FestivalSet[]; source?: GurpurabSource; hijriOffset?: HijriOffset }
```

- `storage.sync` key stays `settings`, mirror key `tarikh:settings`. A v1 or v2 value migrates in memory on read and is not written back.
- Hijri festivals still need the year's calendar file (the page loads it anyway), so a year with no file shows no lines.

## Testing

`pnpm test` is configured, so logic ships with tests: the migration and validator (step 1), the rule engine (step 2), and the sourced-date fixtures for Muslim, Original Nanakshahi and Hindu dates (steps 3 to 5), which is where a wrong date would show. Not unit-tested, per coding-standards: `main.ts` wiring and rendering, which ride on the build, `pnpm size` and the browser evidence in step 7. No browser test runner is declared, so no automated browser evidence is claimed.

## Notes for the AI

- Never fill a festival date from memory or a search snippet. Dates come from the cited sources; if one cannot be read, stop and report.
- Keep first paint synchronous and the boot script small: `sets.ts` must not import festival data. Treat stored settings as untrusted and validate with `parseSettings`; never cast.
- Do not add a UI, a toggle, a new calendar data field, a runtime dependency or a festival outside the plan's list.
- Strings go in `src/strings/en.ts`. No em dashes in code, comments or docs.
- If the JS budget is at risk, stop and report. Do not drop a festival to fit.

## Open questions

- Guru Nanak's Prakash: Purewal's fixed table lists 1 Vaisakh (14 Apr), but the 2003 SGPC version kept it movable. This spec follows the 2003 version (no `original`) because the plan names "Original Nanakshahi (2003)". Confirm.
- Smarta versus ISKCON dates where Drik lists both, and the `(Original Nanakshahi)` suffix, are recorded above as **review** items.
- Mawlid and Shab-e-Barat (plan §10) are not added.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":18015,"specSha256":"542f76fb5076751d89db988487c4a29ddf709ad0ab5a93e108d81ebbe3cbbba3","branch":"refs/heads/feature/hindu-and-muslim-festival-sets","head":"8a1585087251ccfb16ed99892582a3be91845b28","baseRef":"refs/heads/main","baseCommit":"8a1585087251ccfb16ed99892582a3be91845b28","sourceTree":"574442f7c7e87747886bf7bf7fdef2cd29653e5c","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run `pnpm vitest run tests/festival-lines.test.ts`. The "Hindu festival lines", "Muslim festival lines" and "Gurpurab source lines" groups should pass.

In the browser, load `.output/chrome-mv3` unpacked (after `pnpm build`) and open DevTools on a new tab. Run `chrome.storage.sync.set({settings: {schemaVersion: 3, calendars: ["gregorian","hijri"], theme: "chitta", dateStyle: "list", background: "photo", hijriOffset: 0, festivalSets: ["cultural","hindu","sikh","muslim"], gurpurabSource: "sgpc"}})` and reload. On 19 Oct 2026 the page should show "Tomorrow: Dussehra", and on 20 Oct "Today: Dussehra". Hindu lines appear only for 2026 to 2030. This is a review aid, not proof.
