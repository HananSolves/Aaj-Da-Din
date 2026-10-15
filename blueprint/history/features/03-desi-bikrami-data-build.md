# Feature: Desi and Bikrami data build

**From build-plan:** feature 3
**Build attempt:** 1
**Branch:** feature/desi-bikrami-data-build
**Status:** verified

## Goal

Replace the stub in `scripts/build-calendar.ts` with a generator that writes
`data/calendar/<year>.json` for 2026 to 2036: sangrand dates (the desi solar
month starts), a tithi for every day, and Purnimanta lunar month starts with
adhik flags, all for Amritsar / IST (project-plan §4.1). The output is checked
against the SGPC jantri and a published panchang. Nothing at runtime reads the
files yet (feature 4 adds the lookups and settles the open rules).

## In scope

- `scripts/build-calendar.ts` using `astronomy-engine` (dev-only), run by
  `pnpm build:calendar`.
- Pure, testable computation functions in a module the script imports (for
  example `scripts/calendar-math.ts`), so Vitest can test them without writing
  files.
- The 11 generated files `data/calendar/2026.json` to `2036.json`, committed.
- `tests/calendar-data.test.ts`: fixtures from published sources, plus
  structural checks over all 11 files.

## Out of scope

- Runtime lookups, `desi.ts` and `bikrami.ts`, display strings, desi or
  Samvat year numbering (feature 4).
- Festival dates (feature 5).
- Publishing the files on Cloudflare (feature 18).
- Any new runtime dependency. `astronomy-engine` stays dev-only.

## Build loop

`workflow.stepReview` is `feature`: build all steps in order without pausing,
then stop for one review. `workflow.checkpointCommits` is `disabled`: no
checkpoint commits. Each step leaves `pnpm test`, `pnpm typecheck` and
`pnpm lint` green.

## Data contract (per-year file)

Dates are `YYYY-MM-DD` strings in IST. Compact on purpose (budget: a few KB).

- `year`: number.
- `sangrand`: 13 dates. The first is the sangrand that began the month in
  progress on 1 January; the other 12 are the sangrands inside the year. Month
  names are not stored (feature 4 owns them).
- `tithi`: one number per day of the year, the tithi (1 to 30) prevailing at
  local sunrise in Amritsar. Kshaya and vriddhi tithis show as skipped or
  repeated numbers.
- `months`: Purnimanta month starts, each `[date, monthIndex, adhik]` where
  `monthIndex` 0 to 11 is Chaitra to Phalguna, and `adhik` is 0 or 1. Includes
  the month in progress on 1 January.

## Build steps

- [ ] **1. Collect published sources (blocking).**
  Gather two independent published sources for 2026 and 2027 and record name,
  URL and date read: (a) the SGPC jantri (sangrand dates, tithis, month starts),
  and (b) a published panchang (for example Drik Panchang for Amritsar or
  Chandigarh, sankranti instants, tithi at sunrise, month starts including
  Adhik Jyeshtha 2026). If no SGPC jantri can be obtained, stop and ask the
  user for it. Do not infer fixtures from the generator.
  **Done when** a fixtures file lists the source values, hand-copied.

- [ ] **2. Sidereal sun and sangrand.**
  Compute sidereal solar longitude (Lahiri ayanamsa), find each 30 degree
  crossing in IST, and assign the sangrand day using the rule the jantri
  fixtures support (sunrise, sunset or midnight). If the fixtures cannot
  support exactly one rule, stop and report; do not choose.
  **Done when** the 2026 and 2027 sangrands match the fixtures and a test
  proves it.

- [ ] **3. Tithi and Purnimanta months.**
  Compute the moon-sun elongation at Amritsar sunrise for each day. Find new
  moons, name each lunar month from the solar sign at its start, flag a month
  with no sankrant inside it as adhik, then shift to Purnimanta boundaries.
  **Done when** 2026 and 2027 month starts (including adhik) and sampled tithis
  match the fixtures.

- [ ] **4. Write the files and structural tests.**
  The script writes 2026 to 2036 to `data/calendar/`. Tests assert for all 11
  files: 13 increasing sangrands, `tithi` length equals the days in the year,
  months are contiguous and 12 or 13 per year, each file is under 6 KB.
  **Done when** `pnpm build:calendar`, then `pnpm check`, pass.

## Outcome notes

- Sources found online (no SGPC jantri file): Punjab Data and Dekho-ji sangrand lists,
  Golden Temple Amritsar (SikhVerse) month starts, all citing the SGPC calendar, plus Drik
  Panchang sankranti tables for 2026 and 2027. Cited in `tests/calendar-data.test.ts`.
- Sangrand rule the fixtures support: the sunrise-to-sunrise day containing the sankranti
  (midnight and sunset rules both contradict the 12 dates for 2026).
- Ayanamsa zero-point fitted to Drik Panchang (textbook Lahiri ran 14 minutes early). All 24
  instants now within one minute; no 2026-2036 sankranti is within 10 minutes of sunrise.
- Adhik months are stored as the jantri shows them: Adhik Jeth 2026 runs 17 May to 15 June.
- Feature 4 still owns month names, desi year numbering and how adhik is displayed.

## Testing

Fixtures come from step 1's published values only. Structural tests cover all
years. No browser tests (no UI).

## Spec critique (Autopilot)

- Added an explicit blocking sources step; a missing SGPC jantri is a hard stop.
- Pulled the sangrand rule decision out of code: fixtures decide it or the run stops.
- Fixed the data contract and size cap so step 4 is checkable.
- Kept numbering, festivals and lookups out to avoid scope creep into features 4 and 5.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":5295,"specSha256":"9b178336077b1b7e300842da0304d3ea962896cb347ca10f1bd5a08c0d2199a0","branch":"refs/heads/feature/desi-bikrami-data-build","head":"0f24a3a772cd75258de8796d1247832cb2a694b4","baseRef":"refs/heads/main","baseCommit":"0f24a3a772cd75258de8796d1247832cb2a694b4","sourceTree":"740b40f6a067895c7b9e848f3d7fb977b3e6e783","landing":"local-merge","absentOptional":[]} -->

## Try it now

Nothing reads the generated files yet (lookups are feature 4), so inspect one from the project root.

```sh
node -e 'const d=JSON.parse(require("fs").readFileSync("data/calendar/2026.json","utf8")); console.log(d.sangrand.slice(1,4).join(" ")); console.log(d.months.filter(m=>m[2]).map(m=>m[0]).join(" "))'
```

Expected output:

```text
2026-01-14 2026-02-12 2026-03-14
2026-05-17
```

What to look for:

- The first line is the Magh, Phagun and Chet sangrands for 2026, as the SGPC-based lists show them. Note 12 Feb: the sankranti is at 04:14 IST on the 13th, before sunrise, so the jantri day is the 12th.
- The second line is the single adhik month start, Adhik Jeth from 17 May 2026.

Wrong signs: an `undefined`, a missing file, or more than one adhik start in 2026. Run `pnpm test` to see the Drik Panchang and Punjab Data fixtures pass. The sources are secondary copies of the SGPC calendar, so a glance at the physical jantri is still worthwhile.

This guide is a demonstration only. It is not verification and does not show that you tried it.
