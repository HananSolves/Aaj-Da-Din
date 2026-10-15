# Feature: Hijri calendar

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/hijri-calendar
**Status:** verified

## Goal

Add the Hijri calendar as a pure, offline function: given a `Date` and the user's
−1/0/+1 day offset, return its Hijri day, month and year, and a display string such
as `29 Rabi al-Thani 1448 AH`. Nothing in the UI uses it yet (feature 6 wires it in).
The calendar comes from the platform's umm al-Qura data via `Intl`, so no table is
shipped. The point of this feature is a wrapper whose dates are provably the
published umm al-Qura dates, and an offset that behaves exactly.

## In scope

- `src/calendars/hijri.ts`: `toHijri(date, offset)` using
  `Intl.DateTimeFormat` with `calendar: "islamic-umalqura"`, and `formatHijri(date, offset)`.
- English Hijri month names and the era suffix in `src/strings/en.ts` (UI strings
  live in one file).
- `tests/hijri.test.ts`: boundary tests, an offset test set, a multi-year sweep
  that proves day and month continuity, and fixtures cross-checked against a
  published umm al-Qura source.

## Out of scope

- Muslim festival dates (Ramadan begins, Eid and so on) and "expected" labels
  (features 5 and 10).
- The Hijri offset setting, its control and its "Match your local mosque" label
  (features 8 and 11). `hijriOffset` already exists in `Settings`; this feature
  only accepts the value as an argument.
- Any calendar registry or dispatcher keyed by `CalendarId`, any new-tab UI, any
  change to settings, defaults or the `localStorage` mirror.
- Sunset-based day changes (plan §3.4.4: Hijri shows the civil-day date).
- Converting a Hijri date back to Gregorian. Nothing needs it yet.
- Arabic or other-script month names (English only in V1).

## Build loop

`workflow.stepReview` is `feature`: build all steps in order without pausing for
approval between them, then stop for one review of the whole diff.
`workflow.checkpointCommits` is `disabled`: make no checkpoint commits.
`/complete` creates the single final feature commit. Each step must leave
`pnpm test`, `pnpm typecheck` and `pnpm lint` green.

## Build steps

- [x] **1. Converter, offset and tests.**
  Create `src/calendars/hijri.ts` exporting `HijriDate` (`day`, `month` as 1 to 12
  starting at Muharram, `year`), `HijriOffset` (`-1 | 0 | 1`) and
  `toHijri(date: Date, offset: HijriOffset = 0)`. Create one
  `Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" })`
  at module level and read `day`, `month` and `year` from `formatToParts`, so
  nothing depends on locale month names or era text. Apply the offset by building
  `new Date(y, m, d + offset)` from the local getters (never add milliseconds, so
  daylight-saving changes cannot skip or repeat a day), then format that date;
  the formatter uses the local time zone, so the day changes at local midnight
  (§3.4.4). An Invalid Date throws `RangeError`, as `Intl` already does. Before
  relying on the parts, confirm in the first test run that `formatToParts`
  returns numeric `day`, `month` and `year` parts in this Node; if the year part
  carries an era or a related-year form, handle that in the wrapper. Create
  `tests/hijri.test.ts` with:
  - consecutive days at a month end and the next month start for several months
    (Intl-derived, not hand-typed), including a year rollover from Dhu al-Hijjah
    to Muharram;
  - offset behaviour: `+1` on a date equals offset `0` on the next day, `-1`
    equals offset `0` on the previous day, and the offset rolls across month and
    year boundaries;
  - a sweep of every day from 1 January 2026 to 31 December 2036 stepping with
    `new Date(y, m, d + 1)`: each day is either the previous day plus one in the
    same month, or day 1 of the next month; month is 1 to 12; month length is 29
    or 30; the year rises only from month 12 to month 1; a DST transition day in
    a zone that has one does not skip or repeat a day (run the sweep under
    whatever zone the test host has, and assert only continuity).
  **Done when** `pnpm test` passes with these cases and `pnpm typecheck` and
  `pnpm lint` are clean.

- [x] **2. Published-source fixtures.**
  Find a published umm al-Qura source that gives Gregorian-to-Hijri dates (for
  example the official Umm al-Qura calendar from the Saudi authority or KACST,
  or a reputable reproduction of it). Record its name, URL and the date it was
  read in a comment above the fixture block. Add a `describe` block of fixtures
  taken from that source: the first day of each Hijri month for the span the
  source covers within 2026 to 2027, including a Hijri year changeover. Use real
  values from the source, not values computed from `toHijri`. If no usable source
  can be found, or any fixture disagrees with `Intl`, stop and report to the
  user. Do not special-case or patch a date without a source (AGENTS.md: never
  "fix" a date without one).
  **Done when** `pnpm test` passes with the source cited in the test file.

- [x] **3. Display formatter and strings.**
  Add `hijriMonths` (12 names in order: Muharram, Safar, Rabi al-Awwal,
  Rabi al-Thani, Jumada al-Awwal, Jumada al-Thani, Rajab, Shaban, Ramadan,
  Shawwal, Dhu al-Qadah, Dhu al-Hijjah) and `hijriEra: "AH"` to
  `src/strings/en.ts`. Export `formatHijri(date: Date, offset: HijriOffset = 0): string`
  from `hijri.ts`, returning `"<day> <Month> <year> AH"`, built from `toHijri` and
  the strings. Add formatter tests, including that all 12 names appear in order
  and that the offset is applied.
  **Done when** `pnpm check` (typecheck, lint, test, both builds, size budgets)
  passes and the formatter returns the source-verified string for 11 October 2026.

## Files / areas

- New: `src/calendars/hijri.ts`, `tests/hijri.test.ts`
- Edit: `src/strings/en.ts`
- Style reference: `src/calendars/nanakshahi.ts`, `tests/nanakshahi.test.ts`,
  `src/calendars/gregorian.ts`
- Nothing under `entrypoints/`, `src/settings/` or `wxt.config.ts` changes.

## Data / contracts

- `toHijri(date: Date, offset: HijriOffset = 0)` returns
  `{ day: number; month: number; year: number }` with `month` 1 to 12 (1 is
  Muharram). Pure, synchronous, no I/O; the only module-level state is the
  immutable formatter.
- `formatHijri(date, offset?)` returns `<day> <Month name> <year> AH`, with day and
  year unpadded.
- Input is a local-time `Date`; only its local calendar date is used. The offset
  shifts the civil date by whole days before conversion. Output is the civil-day
  umm al-Qura date: no geolocation, no sunset rule, no moon-sighting logic.
- The offset type is the existing `Settings["hijriOffset"]` union; no runtime
  range check, since only typed settings code will pass it.
- Dates outside the range ICU supports for umm al-Qura are not handled; the app
  only asks for dates near today.
- No settings shape change, so no `schemaVersion` bump and no migration.

## Testing

- Vitest, `tests/hijri.test.ts`, local-time `new Date(y, m, d)` inputs like
  `tests/nanakshahi.test.ts`. No mocks or fake timers: the date and offset are
  arguments.
- Three layers: `Intl` continuity sweep over 2026 to 2036 (catches wrapper bugs,
  parts mix-ups and DST drift), offset tests (the feature's own logic), and
  published-source fixtures (the correctness claim).
- The result depends on the ICU data bundled with the runtime. Node 22 ships full
  ICU; if the host lacks umm al-Qura, step 1 fails loudly rather than returning
  wrong dates.
- No browser or UI test; nothing renders yet. Do not claim in-browser evidence
  for this feature. Chrome, Edge and Firefox ICU data is not exercised here; the
  v0 sign-off checks (feature 7) cover the three browsers.
- Verify at the end: `pnpm check`. Baseline before this feature: `pnpm check`
  was run during planning (output tail seen: both builds and size budgets ok;
  earlier typecheck, lint and test lines were not inspected).

## Notes for the AI

- Read `blueprint/context/coding-standards.md` TypeScript and Naming sections
  first. Strict TS with `noUncheckedIndexedAccess`: handle missing `formatToParts`
  entries and `hijriMonths` lookups without `any` or non-null shortcuts that hide
  a bad result.
- Keep it small: one file of two pure functions and one formatter. No classes, no
  dependency, no date table. Create the `Intl.DateTimeFormat` once (coding
  standards, Performance).
- The plan's `29 Rabi al-Thani 1448` for 11 October 2026 is stated as
  illustrative, so it is trusted only after step 2 confirms it against a source.
  If `Intl` and the source differ from the plan's example, the source wins and
  the plan example is left to the user to update.
- Write month names the way the plan does ("Rabi al-Thani"); do not copy ICU's
  `Rabiʻ II` forms.
- Do not touch festival logic or settings. If a step seems to need it, stop and
  ask.
- Do not add AI attribution to commits (AGENTS.md). No em dashes in generated
  text (coding standards, Writing).

## Open questions

- None blocking. Whether `Intl` (ICU umm al-Qura) matches the published tables
  for every month of 2026 to 2027 is exactly what step 2 tests. A disagreement
  stops the run for a decision, not a patch.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9190,"specSha256":"29fb43af1e4765ca4e9e423bd0d829b1d577624c43191f2d6534d8cb9fe7b6b9","branch":"refs/heads/feature/hijri-calendar","head":"0eb23e6a9b8ef942a6d1b4d3c6f5a791b577bd19","baseRef":"refs/heads/main","baseCommit":"0eb23e6a9b8ef942a6d1b4d3c6f5a791b577bd19","sourceTree":"751d260e4dd8a7fd43f6b301dadc5359d698582b","landing":"local-merge","absentOptional":[]} -->

## Try it now

Nothing renders this calendar yet (the new tab is feature 6), so try the function directly from the project root.

```sh
node -e 'import("./src/calendars/hijri.ts").then(m => { const d = new Date(2026, 9, 11); for (const o of [-1, 0, 1]) console.log(o, m.formatHijri(d, o)) })'
```

Expected output:

```text
-1 29 Rabi al-Thani 1448 AH
0 30 Rabi al-Thani 1448 AH
1 1 Jumada al-Awwal 1448 AH
```

What to look for:

- 11 Oct 2026 is 30 Rabi al-Thani, not the 29 the plan's illustrative example shows: Jumada I 1448 starts on 12 Oct 2026 in the published tables.
- Offset -1 gives the previous day and +1 the next day, rolling into Jumada al-Awwal.

Wrong signs: an `undefined` month name, an offset that skips or repeats a day, or a day number above 30. Run `pnpm test` to see the published-source fixtures pass.

This guide is a demonstration only. It is not verification and does not show that you tried it.
