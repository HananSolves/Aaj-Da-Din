# Feature: Desi and Bikrami lookups

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/desi-and-bikrami-lookups
**Status:** verified

## Goal

Turn the generated `data/calendar/<year>.json` files into runtime lookups: given a date, return its Desi (solar) date and its Bikrami (lunisolar, Purnimanta) date, and format both as strings. Like `toNanakshahi` and `toHijri`, these are pure functions that take the date in. They also take the already-loaded year data, so the new tab can load one file and do no other work. This feature settles the sangrand-day and adhik-month open questions (project-plan §10) and gives the Samvat year a rule.

"Read the current year's file, next year's in late December" is met by looking each date up in the file for its own Gregorian year. Tomorrow on 31 December is a 1 January date, so it uses next year's file. No lookup ever needs two files.

Nothing is wired into `entrypoints/newtab/`. Feature 6 does that, so the first-paint JS budget is unchanged here.

### Decisions this spec records

Each is covered by a test with a cited source, so none of them is a date "fixed" without one.

- **Sangrand day.** The sangrand day is day 1 of the new desi month. Which calendar day a sankranti belongs to (sunrise to sunrise, Amritsar / IST) was already settled in feature 3 and is baked into the data.
- **Desi display.** Day and month only, for example `25 Assu`. No year (chosen by the user).
- **Bikrami display.** `Assu Vadi 1, Samvat 2083`. The Samvat year is Gregorian + 57 from Chaitra Shukla 1 ("Chet Sudi 1", about 19 March in 2026) and Gregorian + 56 before it (chosen by the user).
- **Adhik label.** A prefix, for example `Adhik Jeth Sudi 3, Samvat 2083`. The plain (nija) month has no prefix (chosen by the user).
- **Paksha and day.** Tithi 1–15 is Sudi, day = tithi. Tithi 16–30 is Vadi, day = tithi − 15, so amavasya (30) is Vadi 15 and purnima (15) is Sudi 15. Tithi is read at sunrise, as the data already holds it.

## In scope

- Shared helpers in `src/calendars/year-data.ts`: the `CalendarYear` type, an async `loadCalendarYear(year)`, and a local-date locator used by both lookups.
- `src/calendars/desi.ts`: `toDesi`, `formatDesi`.
- `src/calendars/bikrami.ts`: `toBikrami`, `formatBikrami`, including paksha, day, adhik flag and Samvat year.
- Month names shared by Nanakshahi, Desi and Bikrami, plus the new `adhik`, `sudi`, `vadi` and `samvat` strings, all in `src/strings/en.ts`.
- Tests with cited fixtures, including a continuity sweep over every day of 2026–2036.
- Recording the settled rules in the plan (last step).

## Out of scope

- Any UI, entrypoint wiring or settings change (feature 6 and later).
- Festival data and resolution (feature 5).
- Remote or refreshed calendar data and validating fetched JSON (feature 13). The bundled files are trusted, build-time-generated and already shape-tested.
- Changing generated data or `scripts/calendar-math.ts`. If a fixture disagrees with the data, stop and report it. Do not "fix" a date without a source.
- Punjabi scripts or any language other than English (V2).
- A desi year number (decided: not shown).

## Build loop

`workflow.stepReview` is `feature`, so review happens once for the whole feature after the last step, not after each step. `workflow.checkpointCommits` is `disabled`, so there are no checkpoint commits. `/complete` creates the single feature commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. Shared year-data helpers and shared month names.**
  - Add `src/calendars/year-data.ts`:
    - `CalendarYear` is a type-only import of the existing `YearData` from `scripts/calendar-math.ts`. It is erased at build, so `astronomy-engine` never reaches the extension. Redeclare the 5-line shape instead only if the import fails typecheck or pulls the dependency into a build.
    - `loadCalendarYear(year: number): Promise<CalendarYear | undefined>` lazily imports the bundled `data/calendar/<year>.json`, so only the requested year is fetched. It resolves to `undefined` for a year with no file. The new tab must still render in 2037 or 2025, and the caller hides the line.
    - `locate(date, data)` returns the local ISO date (`YYYY-MM-DD` from the local year, month and day fields) and the zero-based day index within the year. It throws `RangeError("Invalid time value")` for an invalid date and `RangeError` when `date.getFullYear() !== data.year`. Both are programmer errors, in line with `nanakshahi.ts` and `hijri.ts`.
  - Use `import.meta.glob` for the lazy import if `pnpm typecheck` accepts it. Otherwise use a literal map of eleven `() => import()` entries.
  - Rename `en.nanakshahiMonths` to `en.punjabiMonths` and update its uses. Run `grep -rn nanakshahiMonths src tests entrypoints` to find them. The 12 names are the same for all three calendars and should not be duplicated.
  - Add `adhik: "Adhik"`, `sudi: "Sudi"`, `vadi: "Vadi"` and `samvat: "Samvat"` to `en.ts`.
  - Move the cited fixture constants (`sangrand2026`, `sangrand2027First3`, `puranmashi2026`, `masya2026`, and their source comments) out of `tests/calendar-data.test.ts` into `tests/fixtures/calendar.ts`, and import them back. Vitest only picks up `*.test.ts`, so the fixtures file is not run as a test. This keeps one place for sourced dates.
  - Add `tests/year-data.test.ts`:
    - `loadCalendarYear` resolves 2026 through 2036, each deep-equal to its JSON file.
    - It resolves `undefined` for 2025 and 2037.
    - `locate` returns the right ISO string and index for 1 January, 29 February 2028 and 31 December.
    - `locate` throws on an invalid date and on a year mismatch.
  - **Done when:** `pnpm typecheck`, `pnpm lint` and `pnpm test` pass, the existing nanakshahi and calendar-data tests are unchanged apart from the renamed string and moved fixtures, and no reference to `nanakshahiMonths` remains.

- [x] **2. Desi lookup.**
  - Add `src/calendars/desi.ts`, exporting `DesiDate { day: number; month: number }`. Month is 1 to 12 where 1 is Chet, the same numbering as `NanakshahiDate`.
  - `toDesi(date, data)`:
    - Find the last `data.sangrand[i]` that is `<=` the local ISO date. ISO strings sort correctly, and `sangrand[0]` is always the previous December's Dhanu sangrand (Poh) and is on or before 1 January, so `i` always exists.
    - Month is `((9 + i) % 12) + 1`.
    - Day is the UTC day count since `sangrand[i]`, plus 1, so the sangrand day is day 1.
  - `formatDesi(date, data)` returns for example `"25 Assu"`, using `en.punjabiMonths`.
  - Add `tests/desi.test.ts`:
    - **Sangrand fixtures.** Each 2026 sangrand date from `tests/fixtures/calendar.ts` is day 1 of the expected month, in the order Magh, Phagun, Chet, Vaisakh, Jeth, Harh, Sawan, Bhadon, Assu, Katak, Maghar, Poh. The day before is the last day of the previous month, 29 to 32. Cite a source that shows the sangrand day as day 1, for example the Punjab Data or Dekho-ji pages already named in `calendar-data.test.ts`, with its read date. If a source shows otherwise, stop and report it.
    - **Year boundaries.** 31 December 2026 against the 2026 file and 1 January 2027 against the 2027 file are consecutive (Poh 16 to Poh 17, the 2026 Poh sangrand being 16 December).
    - **Continuity sweep.** Every day from 2026-01-01 to 2036-12-31, each looked up in its own year's file, gives day 1 to 32. Each day follows the previous one by exactly +1, or resets to 1 with the month advancing by one (and 12 wrapping to 1).
    - **Errors.** Invalid date, and a year mismatch, both throw.
  - **Done when:** `pnpm test` passes the new file. `formatDesi` on 17 October 2026 is `"1 Katak"`, on 16 October 2026 is `"30 Assu"` (Assu runs 17 September to 16 October, 30 days), and on 31 December 2026 is `"16 Poh"`.

- [x] **3. Bikrami lookup.**
  - Add `src/calendars/bikrami.ts`, exporting `BikramiDate { month: number; adhik: boolean; paksha: "sudi" | "vadi"; day: number; samvat: number }`. Month is 1 to 12 where 1 is Chet, so data `monthIndex + 1`.
  - `toBikrami(date, data)`:
    - Find the last `data.months` entry whose start is `<=` the local ISO date. It gives month and adhik.
    - Read the tithi from `data.tithi[dayIndex]`. Derive paksha and day per the rule above.
    - Samvat is Gregorian + 57 on or after Chaitra Shukla 1 of the date's Gregorian year, and Gregorian + 56 before. Derive Chaitra Shukla 1 from the data. It is the first day on or after the start of that year's Chaitra entry (month index 0, adhik 0) whose sunrise tithi is 1 to 15. If that tithi is greater than 1, Pratipada began and ended between two sunrises, so use the day before, the civil day on which Pratipada begins. (Revised during implementation: in 2026 Pratipada runs 06:52 IST on 19 March to 04:52 IST on 20 March, so the sunrise tithis are Amavasya, then Dwitiya. Taking the first bright-fortnight sunrise would put the new year on 20 March, against the 19 March every Indian source gives.)
  - `formatBikrami(date, data)` returns for example `"Assu Vadi 1, Samvat 2083"` and `"Adhik Jeth Sudi 3, Samvat 2083"`.
  - Add `tests/bikrami.test.ts`. Read every expected value from a published panchang or the sourced fixtures, never from the code's own output:
    - **Month and adhik.** Each 2026 month-start entry gives the matching month, adhik flag and Vadi 1 or Sudi 1. Adhik Jeth is 17 May to 15 June 2026, as the existing Purnimanta test records.
    - **Tithi fixtures.** Each `masya2026` date is Vadi 15 and each `puranmashi2026` date is Sudi 15, or Vadi 14 or Sudi 14 where the existing "purnima begins during that day" rule applies. Reuse that rule from `calendar-data.test.ts` instead of restating it.
    - **Panchang anchors.** The lookup reports the tithi at sunrise, which is not always the festival day's tithi. Take the expected sunrise tithi from the published tithi begin and end times (converted to IST), not from the festival date. Cite the Drik Panchang URLs and the read date as `calendar-data.test.ts` does. Anchors: Dussehra (Dashami runs 12:50 IST 20 Oct to 14:11 IST 21 Oct 2026, so 20 Oct is Sudi 9 and 21 Oct is Sudi 10), Diwali (Amavasya runs 11:27 IST 8 Nov to 12:31 IST 9 Nov 2026, so 8 Nov is Vadi 14 and 9 Nov is Vadi 15), Gudi Padwa (see Samvat). If no panchang can be read, stop and report it instead of guessing.
    - **Samvat.** Drik Panchang's new-year page lists "Vikrama Samvata 2083 Begins" at Chaitra Shukla Pratipada, which runs 06:52 IST 19 March to 04:52 IST 20 March 2026 (page computed for Hanoi, UTC+7). So 18 March 2026 is Samvat 2082 and 19 March 2026 is Samvat 2083.
    - **Guards.** Samvat increases by exactly 1 once per Gregorian year across 2026–2036, in March or April. (Revised during implementation: the generated data does have one adhik Chaitra, in 2029, 16 March to 13 April. Drik Panchang dates "Vikrama Samvata 2086 Begins" to 14 April 2029, the nija month's Pratipada, so the Samvat change uses the last non-adhik Chaitra entry. The 2029 case has its own sourced test.)
    - **Continuity sweep.** Every day from 2026-01-01 to 2036-12-31: the tithi-derived day never jumps by more than 2 and the paksha only changes at Sudi 15 to Vadi 1 or Vadi 15 to Sudi 1 (allowing skipped or repeated tithis). The month only repeats around an adhik month and otherwise advances by one. Day 31 December to 1 January is continuous across two files.
    - **Errors.** Invalid date, and a year mismatch, both throw.
  - **Done when:** `pnpm test` passes the new file. `formatBikrami` returns the cited expected strings for the chosen festival anchors and `"Adhik Jeth …, Samvat 2083"` for a date inside 17 May to 15 June 2026.

- [x] **4. Record the settled rules and run the full gate.**
  - Update `blueprint/project-plan.md` §10: tick the "Desi (solar) rules" and "Bikrami lunisolar" questions and write the decided rules in place. Those are sangrand = day 1; desi shows no year; Bikrami Samvat changes on Chet Sudi 1; adhik uses an "Adhik" prefix; paksha and day follow tithi 1–15 and 16–30.
  - Add a matching entry to §11 (the decision log).
  - The stale "exact JSON shape is decided in feature 3" TODO exists only in the generated `project-overview.md`, not in the plan, so the next step fixes it.
  - Run `/overview` to refresh `project-overview.md`, because its Open questions block mirrors §10. Left to the user: run `/overview` before `/complete`. The skill could not be invoked from this session.
  - Run `pnpm check`.
  - **Done when:** `pnpm check` exits 0 (typecheck, lint, tests, both builds, size budgets). The `pnpm size` numbers equal the pre-feature numbers (JS gzip 0.6 KB, CSS gzip 0.3 KB), because nothing imports the new modules yet. §10 shows those two questions ticked, with the rules stated.

## Files / areas

- New: `src/calendars/year-data.ts`, `src/calendars/desi.ts`, `src/calendars/bikrami.ts`
- New: `tests/year-data.test.ts`, `tests/desi.test.ts`, `tests/bikrami.test.ts`, `tests/fixtures/calendar.ts`
- Edited: `src/strings/en.ts` (rename `nanakshahiMonths`, add four strings), `src/calendars/nanakshahi.ts` (renamed string reference), `tests/nanakshahi.test.ts` (only if it references the renamed key), `tests/calendar-data.test.ts` (fixtures moved out), `blueprint/project-plan.md` §10, §11 and the §4.1 TODO
- Read only: `data/calendar/*.json`, `scripts/calendar-math.ts`
- Not touched: `entrypoints/`, `scripts/`, `src/settings/`, `data/`

## Data / contracts

- **Input.** `Date` (the local calendar date is used, so the day changes at local midnight, per project-plan §3.4.4) and a `CalendarYear` for `date.getFullYear()`.
- **`CalendarYear` shape (existing).**
  - `year: number`
  - `sangrand`: 13 ISO dates, sorted. Index 0 is the previous December's Dhanu sangrand (Poh), indices 1 to 12 are this year's.
  - `tithi`: one value 1–30 per day of the year (tithi at sunrise).
  - `months`: `[startISO, monthIndex (Chaitra = 0), adhik 0 | 1]` entries. The first is the month in progress on 1 January.
- **Desi.** `{ day: 1..32, month: 1..12 }` with 1 = Chet. The format is `"<day> <Month>"`.
- **Bikrami.** `{ month: 1..12, adhik: boolean, paksha: "sudi" | "vadi", day: 1..15, samvat: number }` with month 1 = Chet. The format is `"[Adhik ]<Month> <Sudi|Vadi> <day>, Samvat <year>"`.
- **Errors.** Invalid date or year mismatch throws `RangeError`. `loadCalendarYear` never throws for a missing year and resolves to `undefined`. The caller decides what to hide.
- **No persisted data, no settings change, no network.** Nothing is validated at runtime because the data is bundled and generated at build time. Feature 13 owns validation of fetched JSON.

## Testing

- Vitest, run with `pnpm test`. Calendar logic is in scope under the testing standard, so each of steps 1 to 3 ships its tests in the same diff.
- Fixtures come from the sourced constants already in `tests/calendar-data.test.ts` (Punjab Data, Dekho-ji, Golden Temple Amritsar, Drik Panchang) plus panchang pages cited in the new tests.
- The existing note stays true. No copy of the SGPC jantri itself has been read, so a physical check against it is still outstanding. The Bikrami fixtures here come from panchangs, not the SGPC jantri.
- The continuity sweeps cover every day of 2026–2036, so a bad month boundary or year seam fails even where no fixture exists.
- No browser or visual evidence is claimed. There is no UI in this feature.

## Notes for the AI

- Follow `blueprint/context/coding-standards.md`: strict TypeScript, no `any`, no enums, `.ts` import extensions, comments only for the why.
- Month numbering is 1 to 12 with 1 = Chet in every public result. The data's `monthIndex` is 0-based, so convert once, in `bikrami.ts`.
- Do not add a runtime dependency, and do not import `astronomy-engine` from `src/`.
- Do not compute expected test values by running the code under test. Take them from a cited source, and stop and report any disagreement instead of adjusting data or fixtures.
- Project rule: no AI attribution, no AI `Co-Authored-By` trailers, in commits or PRs (`AGENTS.md`).
- Never start a dev server.
- Baseline before this feature (observed this session): `pnpm check` passes with 142 tests, JS gzip 0.6 KB and CSS gzip 0.3 KB.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":16225,"specSha256":"de803956fde49f0d3e97c6d4bc4b04928838c50f5229695305201729ed4a8a65","branch":"refs/heads/feature/desi-and-bikrami-lookups","head":"49da376d2ae971eb2785ff2b7087cd69ac1f9768","baseRef":"refs/heads/main","baseCommit":"49da376d2ae971eb2785ff2b7087cd69ac1f9768","sourceTree":"0e7cf1d7d0bc6f3aa09c6ee709dcfd446e784f07","landing":"local-merge","absentOptional":[]} -->
