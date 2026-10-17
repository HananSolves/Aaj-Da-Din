# Current Feature

> **Generated file.** Holds the one feature, fix, or rollback being built in this checkout. Run
> `/feature <number-or-name>` to spec a build-plan feature, or `/fix "<bug>"` for
> an ad-hoc fix. Use `/rollback <completed-feature>` to plan a safe reversal.
> Build one thing at a time in this checkout; `/complete` archives it under
> `blueprint/history/` and resets this file.

# Feature 21: Calendar registry and per-calendar data

**Type:** Feature
**Branch:** `feature/calendar-registry`
**Status:** verified
**Source:** build-plan item 21; project-plan §3.4.1, §3.4.6, §4.1, §4.2, §5.2, §5.3

## Goal

Make the calendar engine ready for ~20 calendars without slowing the new tab. Each calendar that
needs generated data declares its reference place and rules in one build-time definition and gets
its own JSON file per year. The page loads the code and data of the enabled calendars only. The
package budget rises to 300 KB. "Desi" becomes "Punjabi solar".

## Current state (what changes)

- `scripts/calendar-math.ts` hard-codes Amritsar and IST and emits one `YearData`
  (`sangrand`, `tithi`, `months`) per year to `data/calendar/<year>.json`.
- `src/calendars/year-data.ts` loads that one file per year. `today.ts` statically imports every
  calendar formatter, and `main.ts` always loads the year file.
- Calendar ids are listed three times (`settings/types.ts`, `settings/migrations.ts`,
  `settings/edit.ts`). `desi` is the stored id of the solar calendar.

## Decisions

- **Data calendars after this item:** `punjabi-solar` (`sangrand`) and `bikrami` (`tithi`,
  `months`), both for Amritsar / IST. Gregorian, Hijri and Nanakshahi ship no data.
- **Rename the stored id** `desi` to `punjabi-solar` (module `punjabi-solar.ts`, `toPunjabiSolar`,
  `formatPunjabiSolar`) so the id, the data folder and the plan agree. Settings `schemaVersion`
  goes 4 to 5 with a migration that renames the id in `calendars`. The label is "Punjabi solar".
  Festival set names (`cultural`, `sikh`, ...) and `en.punjabiMonths` do not change.
- **Reference place and rules live in a build-time definition list** (`scripts/calendars.ts`):
  `{ id, place, generate }` per data calendar. `place` is name, latitude, longitude, elevation and
  UTC offset; `generate(year, place)` is the calendar's rule. Later items add entries here. No
  rule-kind enums or options with a single member.
- **Runtime registry** (`src/calendars/registry.ts`) is the one list of calendar ids and, per id,
  a lazy formatter (`import()` of the calendar module plus its data file when it has one).
  `settings/types.ts`, `migrations.ts` and `edit.ts` take the id list from it.
- **Festival data stays merged.** Festival rules read sangrand and tithi data together, so
  `loadFestivalYear(year)` loads both files and merges them into the existing `CalendarYear`.
  Narrowing festival data by enabled set is left to items 30 to 34, when the sets are reworked.
  The festival module itself loads lazily from `main.ts` (only when festival lines are on), so the
  Bikrami and Hijri code the registry loads on demand is not pulled into the first chunk.
- **File layout:** `data/calendar/<id>/<year>.json`, 2026 to 2036, content identical to today's
  keys (`year` plus the calendar's own keys).
- **Out of scope:** new calendars (22 onward), the remote JSON refresh (item 13), the content site
  and its `site/data/` copy (item 18), per-city dates, narrowing festival data.

## Build steps

- [x] 1. **Rename Desi to Punjabi solar.** Id `punjabi-solar`, module and symbols, label in
  `en.ts`, defaults and `v0Calendars`, schema 5 and its migration, `isCurrentShape`. Update the
  existing tests for the new names and add a 4 to 5 migration test.
  Done when: `pnpm typecheck`, `pnpm lint` and `pnpm test` pass; a stored `["desi"]` at schema 4
  (from `storage.sync` and from the mirror) reads back as `["punjabi-solar"]` at schema 5; an
  unknown id still fails validation.
- [x] 2. **Per-calendar data files and loader.** `calendar-math.ts` takes a `Place` (no Amritsar or
  IST constants) and exports `generateSolarYear` and `generateLunisolarYear`;
  `scripts/calendars.ts` lists the two definitions; `build-calendar.ts` writes
  `data/calendar/<id>/<year>.json` and `--check` compares them; old `data/calendar/<year>.json`
  files are removed. `year-data.ts` gets `loadCalendarYear(calendar, year)` and
  `loadFestivalYear(year)`; `lines.ts` and `ask-card.ts` use the merged loader. Update test
  fixtures and tests to the new paths.
  Done when: for all 11 years the merged new files deep-equal the old files (checked once before
  deleting them); `pnpm check:calendar` and `pnpm test` pass with every existing sourced fixture
  unchanged; a test confirms the data folders equal the definition ids, every year 2026 to 2036
  loads for each, and 2025 and 2037 load as `undefined`.
- [x] 3. **Registry and lazy loading.** `registry.ts` with `calendarIds` and one lazy formatter per
  calendar; `todayRows` becomes async and takes no data argument; `main.ts` and the settings
  helpers use the registry. A calendar whose data is missing or whose chunk fails to load is left
  out, as today.
  Done when: `todayRows` tests pass for the same expected texts as today (all five calendars,
  order, Hijri offset, Hijri unsupported, missing year, invalid date); in a browser, with festival
  lines off and only Gregorian enabled no calendar data chunk is requested, and with Punjabi solar
  enabled only its own data chunk is requested (festival lines load both files, by decision).
- [x] 4. **Budget and docs.** `check-size.ts` package budget to 300 KB. Refresh the CalendarYear
  section of `blueprint/context/project-overview.md` and the calendar notes that name the old id.
  Done when: `pnpm check` passes, sizes are reported against the budgets, and browser evidence
  (Chrome and Firefox builds) shows the new tab renders all calendars, the settings panel toggles
  Punjabi solar, and the console is clean.

## Testing

Pure logic with assertable output, so tests gate steps 1 to 3:

- Migration 4 to 5: rename, order kept, other ids untouched, both entry points (`parseSettings`
  and the mirror reader), unknown ids still rejected.
- Generator: existing sourced fixtures (SGPC jantri sangrands, Drik Panchang sankrantis, tithi and
  month fixtures) keep passing against the new files. Equality of the new files with the old ones
  is checked once in step 2.
- Loader: per-calendar load, `undefined` outside 2026 to 2036, merged festival year.
- Registry: one formatter per id, `todayRows` texts unchanged, failure cases leave rows out.
- UI and request behavior: browser evidence only (Chrome and Firefox), not unit tests.

## Risks and unhappy paths

- A renamed id in old stored settings: handled by the migration; the mirror goes through the same
  `parseSettings`.
- A data file missing, or a chunk failing to load: that calendar's row and festival lines are left
  out; the rest of the page renders.
- Festival rules must keep resolving identically: their sourced fixtures run unchanged against the
  merged data.
- The sunrise cache must stay keyed by place so a second place later cannot read Amritsar's
  sunrises.
- Extra chunks per calendar add files to the package (size budget) but not to first paint.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7306,"specSha256":"6d7cc6f00c8a542cc125c2997d5d5bbb9f693e8462242963477e08b6810a177d","branch":"refs/heads/feature/calendar-registry","head":"7ad7fdf77db51141395a9b6f4243aa92710ca9a5","baseRef":"refs/heads/main","baseCommit":"7ad7fdf77db51141395a9b6f4243aa92710ca9a5","sourceTree":"bc0e2bd94f768092d655ecac7509032f7c32afeb","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Run `pnpm build`, load `.output/chrome-mv3` unpacked and open a new tab. The rows read, in order, Gregorian, Punjabi solar, Bikrami, Nanakshahi and Hijri (with no saved settings).
2. Open Settings (the gear). The calendar list shows "Punjabi solar" where "Desi" used to be. Turn it off and on: its row leaves and returns on the page.
3. In the browser's network tools, turn Punjabi solar and Bikrami off and reload with Festival lines off: no `chunks/2026-*.js` file is requested. Turn only Punjabi solar on: one small `2026-*.js` file is requested.
