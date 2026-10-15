# Feature: Nanakshahi calendar

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/nanakshahi-calendar
**Status:** verified

## Goal

Add the original 2003 Nanakshahi calendar as a pure, offline function: given a
`Date`, return its Nanakshahi day, month and year, and a display string such as
`27 Assu 558 NS`. Nothing in the UI uses it yet (feature 6 wires it in). The
point of this feature is a converter that is provably correct against a
published source, because the whole product rests on correct dates.

## In scope

- `src/calendars/nanakshahi.ts`: the fixed month-start table from
  project-plan §3.4.2, a numeric converter, and a display formatter.
- English month names and the era suffix in `src/strings/en.ts` (UI strings live
  in one file).
- `tests/nanakshahi.test.ts`: table-derived boundary tests, a full-year sweep
  that proves the table is self-consistent, and fixtures cross-checked against a
  published Nanakshahi source.

## Out of scope

- Hijri, Desi, Bikrami (features 2 to 4); festival dates and the SGPC vs
  Original Nanakshahi Gurpurab switch (features 5 and 10).
- Any calendar registry or dispatcher keyed by `CalendarId`, any new-tab UI,
  any change to settings, defaults or the `localStorage` mirror. `"nanakshahi"`
  already exists in `CalendarId` and in `defaultSettings.calendars`.
- The amended (2010) Nanakshahi calendar. Only the original 2003 rules apply.
- Punjabi-script month names (English only in V1).
- Converting a Nanakshahi date back to Gregorian. Nothing needs it yet.

## Build loop

`workflow.stepReview` is `feature`: build all steps in order without pausing
for approval between them, then stop for one review of the whole diff.
`workflow.checkpointCommits` is `disabled`: make no checkpoint commits.
`/complete` creates the single final feature commit. Each step must leave
`pnpm test`, `pnpm typecheck` and `pnpm lint` green.

## Build steps

- [x] **1. Month table, converter and boundary tests.**
  Create `src/calendars/nanakshahi.ts` exporting a type for the result
  (`day`, `month` as 1 to 12 starting at Chet, `year`) and
  `toNanakshahi(date: Date)`. Use the plan's start table (Chet 14 Mar through
  Phagun 12 Feb). Read the date from the local getters (`getFullYear`,
  `getMonth`, `getDate`) so the day changes at local midnight (§3.4.4). Do not
  add or subtract milliseconds in local time. Phagun's 31st day in a Gregorian
  leap year must fall out of the real length of February, not a hard-coded
  year list. Year is Gregorian year minus 1468 on or after 14 March, minus 1469
  before it. An Invalid Date throws `RangeError` (programmer error, as
  `Intl.DateTimeFormat` already does for `formatGregorian`). Create
  `tests/nanakshahi.test.ts` with:
  - the first and last day of all 12 months in a non-leap year (2026 to 2027);
  - 13 and 14 March (year rollover), 31 December and 1 January;
  - leap year 2028: 29 February and 13 March are Phagun day 18 and 31, while
    13 March 2027 is Phagun 30;
  - `new Date(2026, 9, 11)` is 27 Assu 558, and `new Date(2026, 9, 15)` is
    1 Katak 558;
  - a sweep of every day from 1 January 2026 to 31 December 2036, stepping with
    `new Date(y, m, d + 1)`: each day is either the previous day plus one in
    the same month, or day 1 of the next month; day never exceeds its month's
    length (31 or 30; Phagun 31 only in leap years); per-year month lengths are
    right; the year number rises only on 1 Chet.
  **Done when** `pnpm test` passes with these cases and `pnpm typecheck` and
  `pnpm lint` are clean.

- [x] **2. Published-source fixtures.**
  Find a published source for the original 2003 Nanakshahi calendar that gives
  Gregorian-to-Nanakshahi dates (for example Pal Singh Purewal's published
  calendar, or the SGPC 2003 notification as reproduced by a reputable page).
  Record its name, URL and the date it was read in a comment above the fixture
  block. Add a `describe` block of fixtures taken from that source: all 12
  month starts for one year, and the year changeover. Use real values from the
  source, not values computed from the converter. If no usable source can be
  found, or any fixture disagrees with the table, stop and report to the user.
  Do not change the table without a source (AGENTS.md: never "fix" a date
  without one).
  **Done when** `pnpm test` passes with the source cited in the test file.

- [x] **3. Display formatter and strings.**
  Add `nanakshahiMonths` (12 names in order: Chet, Vaisakh, Jeth, Harh, Sawan,
  Bhadon, Assu, Katak, Maghar, Poh, Magh, Phagun) and `nanakshahiEra: "NS"` to
  `src/strings/en.ts`. Export `formatNanakshahi(date: Date): string` from
  `nanakshahi.ts`, returning `"<day> <Month> <year> NS"`, built from
  `toNanakshahi` and the strings above. Add formatter tests, including that all 12 names appear in table order.
  **Done when** `pnpm check` (typecheck, lint, test, both builds, size budgets)
  passes and the formatter returns `27 Assu 558 NS` for 11 October 2026.

## Files / areas

- New: `src/calendars/nanakshahi.ts`, `tests/nanakshahi.test.ts`
- Edit: `src/strings/en.ts`
- Style reference: `src/calendars/gregorian.ts`, `tests/gregorian.test.ts`
- Nothing under `entrypoints/`, `src/settings/` or `wxt.config.ts` changes.

## Data / contracts

- `toNanakshahi(date: Date)` returns `{ day: number; month: number; year: number }`
  with `month` 1 to 12 (1 is Chet). Pure, synchronous, no I/O, no module-level
  mutable state.
- `formatNanakshahi(date: Date): string` returns `<day> <Month name> <year> NS`,
  with day and year unpadded.
- Input is a local-time `Date`. Only its local calendar date is used; time of
  day is ignored. Output is the published (fixed-arithmetic) date wherever the
  user is: no geolocation, no sunset rule.
- Month starts: Chet 14 Mar, Vaisakh 14 Apr, Jeth 15 May, Harh 15 Jun,
  Sawan 16 Jul, Bhadon 16 Aug, Assu 15 Sep, Katak 15 Oct, Maghar 14 Nov,
  Poh 14 Dec, Magh 13 Jan, Phagun 12 Feb. Lengths: 31 for Chet to Sawan, 30 for
  Bhadon to Magh, Phagun 30 (31 in a Gregorian leap year).
- No settings shape change, so no `schemaVersion` bump and no migration.

## Testing

- Vitest, `tests/nanakshahi.test.ts`, local-time `new Date(y, m, d)` inputs like
  `tests/gregorian.test.ts`. No mocks or fake timers needed: the converter takes
  the date as an argument.
- Three layers: table-derived boundaries (catch off-by-one and leap-year
  errors), a sweep over 2026 to 2036 (catches a typo in the table without any
  external source), and published-source fixtures (the correctness claim).
- No browser or UI test; nothing renders yet. Do not claim visual or in-browser
  evidence for this feature.
- Verify at the end: `pnpm check`. Baseline before this feature: the same
  command was run during planning (output tail seen: tests 1 passed, both
  builds and size budgets ok; earlier typecheck and lint lines were not
  inspected).

## Notes for the AI

- Read `blueprint/context/coding-standards.md` TypeScript and Naming sections
  first. Strict TS with `noUncheckedIndexedAccess`: table lookups return
  `T | undefined`, so handle them without `any` or non-null shortcuts that
  hide a bad table.
- Keep it small: one file of pure functions and a constant table. No classes,
  no dependency, no `Intl` calendar (Nanakshahi is not an `Intl` calendar).
- The plan's `27 Assu 558 NS` example is stated as illustrative, so it is only
  trusted here because step 1 derives it from the table and step 2 checks the
  table against a published source.
- Do not add AI attribution to commits (AGENTS.md).
- Do not touch festival logic. If a step seems to need it, stop and ask.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7639,"specSha256":"d0a662e7e1eb95fc35f02415ece1f6454fed311a8c2eaea80057a0c56900c96c","branch":"refs/heads/feature/nanakshahi-calendar","head":"69d263205ac949d4d27140af8817501dca8897c6","baseRef":"refs/heads/main","baseCommit":"69d263205ac949d4d27140af8817501dca8897c6","sourceTree":"e3ff920aff0b689e6e7e3ba31d96a64565a9cc7a","landing":"local-merge","absentOptional":[]} -->

## Try it now

Nothing renders this calendar yet (the new tab is feature 6), so try the function directly from the project root.

```sh
node -e 'import("./src/calendars/nanakshahi.ts").then(m => {
  for (const [y, mo, d] of [[2026, 9, 11], [2026, 9, 15], [2027, 2, 13], [2027, 2, 14], [2028, 2, 13]])
    console.log(new Date(y, mo, d).toDateString(), "->", m.formatNanakshahi(new Date(y, mo, d)));
})'
```

Expected output:

```text
Sun Oct 11 2026 -> 27 Assu 558 NS
Thu Oct 15 2026 -> 1 Katak 558 NS
Sat Mar 13 2027 -> 30 Phagun 558 NS
Sun Mar 14 2027 -> 1 Chet 559 NS
Mon Mar 13 2028 -> 31 Phagun 559 NS
```

What to look for:

- 11 Oct 2026 is day 27 of Assu, and 15 Oct 2026 starts Katak (the plan's example and the Wikipedia example).
- The Nanakshahi year rises from 558 to 559 on 14 March, not on 1 January.
- Phagun ends on day 30 in 2027 but day 31 in the leap year 2028.

Wrong signs: a day number off by one at any month start, a year that changes on 1 January, or an `undefined` month name. Run `pnpm test` to see the published-source fixtures (70 tests) pass.

This guide is a demonstration only. It is not verification and does not show that you tried it.
