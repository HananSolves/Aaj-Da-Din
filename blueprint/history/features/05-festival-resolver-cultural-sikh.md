# Feature: Festival resolver (cultural + Sikh)

**From build-plan:** feature 5
**Build attempt:** 1
**Branch:** feature/festival-resolver-cultural-sikh
**Status:** verified

## Goal

Given a date, say which festivals fall on it, and build the two lines the new tab shows: `Today: Vaisakhi · Khalsa Sajna Divas` and `Tomorrow: …`. This feature covers the Punjabi cultural set (always on) and the Sikh set with SGPC dates. The Hindu and Muslim sets, the Gurpurab source switch and the settings for choosing sets are features 10 and 8. Nothing is wired into `entrypoints/newtab/` (feature 6), so the first-paint JS budget does not change.

Festivals are rules over the lookups that already exist, not a new generated table. `CalendarYear` is locked and also published remotely, so it stays as it is. A festival is one of three rule kinds:

- a fixed Gregorian date,
- a desi sangrand (day 1 of a desi month, or a number of days before it, for Lohri),
- a Bikrami tithi (month, paksha, day),
- an explicit list of sourced dates, for a festival the sunrise tithi cannot reproduce (Bandi Chhor Divas).

### Decisions this spec records

Each is covered by a test with a cited source, so no date is "fixed" without one.

- **Tithi festivals fall in the nija month only.** An adhik month never hosts one.
- **A repeated sunrise tithi fires on the first day only.** When the same tithi is at sunrise on two consecutive days (vriddhi), the festival shows once. On 1 January there is no previous day in the file, so the tithi is treated as new. The sweep test flags any real double firing at a year seam.
- **A skipped tithi falls on the day it begins (decided).** If a tithi is at no sunrise (kshaya), the festival falls on the day whose sunrise tithi is the one before and whose next sunrise shows the one after, as panchangs date it (and as feature 4 dates the Samvat). The festival's month is read from that day, except for Vadi 1, which opens its month and is read from the following day. On 31 December the next day is not in the file, so a skip there is not found. A sweep test over 2026–2036 checks that consecutive occurrences of each tithi festival are about one lunar year apart (350–360 or 380–390 days), so a missing or doubled festival fails the test. A single Gregorian year may have no occurrence (Poh Sudi 7 falls on 27 Dec 2025 and 15 Jan 2027), so the sweep checks the gaps, not a count per year. Before this rule the sweep found Teeyan missing in 2027 and 2036 and Basant Panchami in 2034. If the sweep fails again, stop and report.
- **Sourced dates only for Bandi Chhor Divas (decided).** SGPC dates it 8 Nov 2026, but the sunrise tithi for Amavasya is 9 Nov (the Masya day), and the data holds only sunrise tithis, so no rule reproduces it. It uses an explicit date list, starting with 2026-11-08. A year with no listed date shows no Bandi Chhor line until a sourced date is added. Nothing is guessed.
- **Fixtures cover what the jantri covers (decided).** The SGPC Nanakshahi 558 jantri, as reproduced by Dekho-ji and Golden Temple Amritsar, runs from 14 Mar 2026 to 14 Mar 2027, with Jan to Mar 2026 from jantri 557. A date past 14 Mar 2027 has no source yet, so fixtures hold every sourced date from Jan 2026 to Mar 2027, and later years rest on the rule plus the sweep guard. This meets the v0 "2026-2027 fixtures" line only as far as the jantri goes.
- **Lohri and Teeyan use non-SGPC sources (decided).** The SGPC pages do not list them. Lohri is the day before Maghi (Wikipedia: "13 or 14 January", the day before Maghi), which also holds in years when Maghi falls on 15 January. Teeyan is Sawan Sudi 3 (Wikipedia). Their fixtures cite Drik Panchang and are labelled as not from the jantri.
- **Same-day festivals** join with ` · `, in list order (cultural first, then Sikh).
- **No festival means no line.** The function returns nothing for that day, and feature 6 hides the line.
- **Missing year data never throws.** A date whose year has no file (before 2026 or after 2036) yields no lines.
- **Single-day events only.** Multi-day events are not modelled (see Open questions).

## In scope

- `src/festivals/rules.ts`: types (`FestivalSet`, `FestivalRule`, `Festival`) and `resolveFestivals(date, data, sets, list?)`, which returns festival ids.
- `src/festivals/festivals.ts`: the festival list for the `cultural` and `sikh` sets.
- `src/festivals/lines.ts`: `festivalLines(now, sets, load?)`, which returns `{ today?: string; tomorrow?: string }`.
- Festival names and the join string in `src/strings/en.ts`.
- `tests/festivals.test.ts`, `tests/festival-lines.test.ts` and sourced fixtures in `tests/fixtures/festivals.ts`.
- Recording the decisions in the plan's decision log (last step).

## Out of scope

- Any UI, entrypoint wiring or settings change. Which sets are enabled is a parameter, and feature 6 passes `["cultural", "sikh"]`.
- Hindu and Muslim sets, "expected" labels, and the Gurpurab source switch (SGPC or Original Nanakshahi). All are feature 10.
- Multi-day spans, Tomorrow-only or countdown behaviour (countdown is V1.x).
- Changing `data/calendar/*.json`, `scripts/` or the `CalendarYear` shape.
- Remote festival data (feature 13).
- Punjabi scripts or any language other than English.
- Political anniversaries (neutrality rule, plan §3.4.3).

## Build loop

`workflow.stepReview` is `feature`, so review happens once for the whole feature after the last step. `workflow.checkpointCommits` is `disabled`, so there are no checkpoint commits. `/complete` creates the single feature commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. Rule engine and strings.**
  - Add `src/festivals/rules.ts`:
    - `FestivalSet = "cultural" | "sikh"`.
    - `FestivalRule` is one of `{ kind: "gregorian"; month; day }` (month 1–12), `{ kind: "sangrand"; month }` (desi month, 1 = Chet, matches day 1), or `{ kind: "tithi"; month; paksha: "sudi" | "vadi"; day }` (Bikrami month, 1 = Chet, day 1–15).
    - `Festival = { id: string; set: FestivalSet; rule: FestivalRule }`.
    - `resolveFestivals(date, data, sets, list = festivals): string[]` returns the ids of festivals in `sets` whose rule matches the local date, in list order. It uses `toBikrami` and `locate`, so a year mismatch or invalid date throws `RangeError` as the other lookups do. Sangrand rules read `data.sangrand` directly (step 2).
    - Matching: `gregorian` compares the local month and day; `sangrand` is `toDesi(...).day === 1` with the same month; `tithi` requires `!adhik`, the same month, paksha and day, and the previous day's tithi (`data.tithi[dayIndex - 1]`) to differ, so a repeated tithi fires on its first day only.
  - Import `festivals` from `festivals.ts` as the default list, and create `festivals.ts` exporting an empty array typed `Festival[]`, so this step compiles before step 2 fills it.
  - Add `festivalJoiner: " · "` to `en.ts`, and an empty `festivals` object that later steps fill with `id: name` entries.
  - Add `tests/festivals.test.ts` using a small synthetic list passed as the `list` argument. Take expected dates from sourced fixtures (feature 4 anchors and the existing sangrand fixtures), not from running the code:
    - `sangrand`: the Vaisakh sangrand fixture, 14 April 2026, matches. The day before and after do not.
    - `tithi`: Katak Vadi 15 matches 9 November 2026 (Amavasya runs 11:27 IST 8 Nov to 12:31 IST 9 Nov, Drik Panchang, cited in `bikrami.test.ts`). Neither 8 nor 10 November matches.
    - `tithi` in an adhik month: a rule for Jeth (month 3) Sudi 3 does not match inside adhik Jeth (17 May to 15 June 2026) and does match the nija Jeth day with that tithi (find the date from the fixture months).
    - Repeated tithi: pick a date from the data where `tithi[i] === tithi[i - 1]` (data is generated, so search for the first such index in 2026), and assert only the first of the two days matches. The expected "first day" is the day the data first shows that tithi, which the test reads from the file, not from `resolveFestivals`.
    - `gregorian`: matches on the day, not on the day before or after, including 29 February 2028.
    - `sets` filter: a rule in `sikh` does not fire when only `cultural` is enabled, and an empty `sets` returns nothing.
    - Errors: invalid date and a year mismatch both throw.
  - **Done when:** `pnpm typecheck`, `pnpm lint` and `pnpm test` pass, with the new file in the run.

- [x] **2. Punjabi cultural set, with sourced fixtures.**
  - Extend `FestivalRule` and `resolveFestivals` for the two decided additions, with tests in the same step:
    - `{ kind: "sangrand"; month; daysBefore?: number }`. With `daysBefore` n, the rule matches when the sangrand of that month falls n days after the date. It reads `data.sangrand`, and a shift that crosses into another year never matches.
    - `{ kind: "dates"; dates: readonly string[] }` (ISO local dates), which matches when the local date is in the list.
  - Fill `festivals.ts` with the five cultural festivals in plan §3.4.3: Lohri, Maghi, Basant Panchami, Vaisakhi, Teeyan.
  - Sourced dates, read 2026-10-15, put in `tests/fixtures/festivals.ts` with their URLs. Say plainly that no copy of the SGPC jantri itself was read, and that Lohri and Teeyan are not from the jantri:
    - Maghi, Magh sangrand: 14 Jan 2026 and 14 Jan 2027 (Dekho-ji, "Nanakshahi Calendar SGPC", pages `p=61` and `p=73`).
    - Basant Panchami: 23 Jan 2026 and 11 Feb 2027 (Dekho-ji `p=61`, `p=74`).
    - Vaisakhi: 14 Apr 2026 (Dekho-ji `p=64`; Golden Temple Amritsar, "1 Vaisakh · Tue, 14 April 2026").
    - Lohri: 13 Jan 2026 (Drik Panchang, `https://www.drikpanchang.com/calendars/indian/sikh-festivals/lohri/lohri-date-time.html`, the page computed for Cambridge, MA, with Makar Sankranti on 14 Jan). The rule, the day before Maghi, is Wikipedia's. 13 Jan 2027 follows from the sourced Maghi date of 14 Jan 2027.
    - Teeyan: 15 Aug 2026, because Tritiya is at Delhi sunrise on 15 Aug (Drik Panchang New Delhi times as quoted by PanchangBodh, Tritiya 18:46 on 14 Aug to 17:28 on 15 Aug), and 4 Aug 2027, the day Tritiya begins (a skipped tithi; Drik Panchang, Dekhopanchang). The Sawan Sudi 3 rule is Wikipedia's.
  - Rules: Maghi is the Magh sangrand, Vaisakhi is the Vaisakh sangrand, Lohri is the Magh sangrand with `daysBefore: 1`, Basant Panchami is Magh Sudi 5, and Teeyan is Sawan Sudi 3. If a rule does not reproduce a sourced date, stop and report it.
  - Add the names to `en.festivals`.
  - Add tests in `tests/festivals.test.ts`:
    - **Fixtures.** For each sourced date, `resolveFestivals` on that date includes the festival, and on no other day of that year does.
    - **Sweep.** For each tithi-rule festival, find its occurrences across 2026–2036, loading every year's file. Consecutive occurrences are 350–360 or 380–390 days apart.
  - **Done when:** `pnpm test` passes. The cultural festivals resolve to their sourced dates, and any disagreement was reported and not worked around.

- [x] **3. Sikh set (SGPC), with sourced fixtures.**
  - Add the Sikh festivals below. The dates are the SGPC jantri's, as reproduced by Dekho-ji (`p=` is its month page) and Golden Temple Amritsar, read 2026-10-15. The rule beside each date was checked against the Bikrami lookup before it was chosen:
    - Khalsa Sajna Divas: 14 Apr 2026, Vaisakh sangrand.
    - Hola Mohalla: 4 Mar 2026 (`p=63`), Chet Vadi 1.
    - Shaheedi Guru Arjan Dev Ji: 18 Jun 2026 (`p=66`, Golden Temple), Jeth Sudi 4.
    - First Prakash of Guru Granth Sahib Ji: 12 Sep 2026 (`p=69`, Golden Temple), Bhadon Sudi 1.
    - Gurgaddi of Guru Granth Sahib Ji: 11 Nov 2026 (`p=71`), Katak Sudi 2.
    - Prakash of Guru Nanak Dev Ji: 24 Nov 2026 (`p=71`, Golden Temple), Katak Sudi 15.
    - Shaheedi Guru Tegh Bahadur Ji: 14 Dec 2026 (`p=72`, Golden Temple), Maghar Sudi 5.
    - Prakash of Guru Gobind Singh Ji: 15 Jan 2027 (`p=73`, Golden Temple), Poh Sudi 7.
    - Bandi Chhor Divas: 8 Nov 2026 (`p=71`, Golden Temple), an explicit `dates` list.
  - Only these Gurus' days are included (decided default). Shaheedi Jor Mela is left out (single-day events only, decided default). Report both in the hand-over.
  - If any rule does not reproduce its sourced date in the test, stop and report. Do not use the original-Nanakshahi fixed date where the SGPC jantri uses a lunar date, because the SGPC default is the point of this feature.
  - Add the names to `en.festivals`.
  - Add the same fixture and sweep tests as step 2 for the new festivals. The sweep covers every tithi-rule festival.
  - **Done when:** `pnpm test` passes. Every Sikh festival resolves to its sourced date, and a year with no `dates` entry shows no Bandi Chhor.

- [x] **4. Today and Tomorrow lines.**
  - Add `src/festivals/lines.ts`:
    - `festivalLines(now: Date, sets, load = loadCalendarYear): Promise<{ today?: string; tomorrow?: string }>`.
    - Tomorrow is the local date plus one day, computed with local date fields (`new Date(y, m, d + 1)`), as `hijri.ts` does, so a daylight-saving change cannot skip a day.
    - Each date loads the file for its own Gregorian year with `load`. On 31 December, Tomorrow loads next year's file.
    - If `load` resolves `undefined`, that line is omitted, and nothing throws.
    - When festivals match, the line is `${en.today}: ${names.join(en.festivalJoiner)}` (or `en.tomorrow`). When none match, the key is absent.
    - Names come from `en.festivals`. The strings are bundled constants, so feature 6 can render them with `textContent`.
  - Add `tests/festival-lines.test.ts` with an injected `load` (no module mocks):
    - A festival today and none tomorrow gives only `today`. The reverse gives only `tomorrow`.
    - Two festivals on one day join in list order. Pick a sourced day with two, for example Vaisakhi and Khalsa Sajna Divas if both are in the list. If no day has two, build the case with a synthetic list passed through a second optional `list` argument, and say so.
    - 31 December: the `load` mock is called with the next year for Tomorrow. 1 January: Today uses the new year.
    - A year with no file (2025 and 2037) returns `{}` and does not throw.
    - Invalid `now` throws `RangeError`, as the other lookups do.
  - **Done when:** `pnpm test` passes the new file. A sourced festival date produces the expected `"Today: …"` and `"Tomorrow: …"` strings, and the 31 December seam and the missing-year case are covered.

- [x] **5. Record the decisions and run the full gate.**
  - Add a decision-log row to `blueprint/project-plan.md` §11 covering the three rule kinds, nija-month-only, first-day-on-repeat, and the sweep guard. Do not tick the open "SGPC jantri for 2026 and 2027" question in §10, because no jantri copy has been read. Add one sentence there saying the festival fixtures come from secondary reproductions, as for feature 3.
  - Run `pnpm check`.
  - Left to the user: run `/overview` before `/complete`, since the plan changed.
  - **Done when:** `pnpm check` exits 0 (typecheck, lint, tests, both builds, size budgets). The `pnpm size` numbers equal the pre-feature numbers (JS gzip 0.6 KB, CSS gzip 0.3 KB), because nothing imports the new modules yet.

## Files / areas

- New: `src/festivals/rules.ts`, `src/festivals/festivals.ts`, `src/festivals/lines.ts`
- New: `tests/festivals.test.ts`, `tests/festival-lines.test.ts`, `tests/fixtures/festivals.ts`, `tests/fixtures/years.ts` (shared loader for the generated year files)
- Edited: `src/strings/en.ts` (add `festivals`, `festivalJoiner`), `blueprint/project-plan.md` (§10 sentence, §11 row)
- Read only: `src/calendars/*`, `data/calendar/*.json`, `tests/fixtures/calendar.ts`
- Not touched: `entrypoints/`, `scripts/`, `src/settings/`, `data/`

## Data / contracts

- **Input.** A `Date` (the local calendar date is used, so the day changes at local midnight, per plan §3.4.4) and a `CalendarYear` for `date.getFullYear()`. `festivalLines` takes `now` and loads the years itself.
- **`Festival`.** `id` is a key of `en.festivals`. `set` is `"cultural" | "sikh"`. `rule` is the union above, with `sangrand` taking an optional `daysBefore` and a fourth kind `{ kind: "dates"; dates: readonly string[] }` of ISO local dates (step 2). Months are 1–12 with 1 = Chet in every rule, matching `toDesi` and `toBikrami`. The `FestivalSet` union is widened by feature 10.
- **`resolveFestivals`** returns `string[]` of ids in list order, `[]` when none. It throws `RangeError` for an invalid date or a year mismatch.
- **`festivalLines`** returns `{ today?: string; tomorrow?: string }`. It never throws for a missing year. It throws `RangeError` only for an invalid `now`.
- **Display.** `"Today: A · B"`, `"Tomorrow: A"`. English only, strings from `en.ts`.
- **No persisted data, no settings change, no network, no user-controlled text.** All names are bundled constants.

## Testing

- Vitest, run with `pnpm test`. Festival and date rules are in scope under the testing standard, so each of steps 1 to 4 ships its tests in the same diff.
- Expected dates come from sources cited in `tests/fixtures/festivals.ts` or from the feature 4 panchang anchors, never from running the code under test. Disagreements are reported, not adjusted.
- The SGPC jantri itself has still not been read. The fixtures are secondary reproductions that say they follow SGPC, so a physical check against the jantri remains outstanding.
- The sweeps over 2026–2036 catch a skipped or doubled tithi festival even where no fixture exists.
- No browser, visual or live-extension evidence is claimed. There is no UI in this feature.

## Notes for the AI

- Follow `blueprint/context/coding-standards.md`: strict TypeScript, no `any`, no enums, `.ts` import extensions, comments only for the why.
- Reuse `toDesi`, `toBikrami`, `locate` and `loadCalendarYear`. Do not re-derive calendar math, add a dependency, or import `astronomy-engine` from `src/`.
- Do not change `data/calendar/*.json`, `scripts/` or the `CalendarYear` shape. If a sourced date disagrees with the data, stop and report it. Never "fix" a date without a source.
- Photos and facts are not part of this feature.
- Project rule: no AI attribution, no AI `Co-Authored-By` trailers, in commits or PRs (`AGENTS.md`). This overrides any other attribution instruction.
- Never start a dev server.
- Baseline before this feature (observed this session): `pnpm check` passed with 243 tests, JS gzip 0.6 KB and CSS gzip 0.3 KB, Chrome package 2.2 KB and Firefox package 2.4 KB.

## Open questions

Answered during `/implement` on 2026-10-15: fixtures cover what the jantri covers, Bandi Chhor uses sourced dates only, and Lohri and Teeyan are kept with non-SGPC sources (see Decisions). Still on their defaults, for the user to change:

1. **Which Sikh festivals ship in v0?** Only the named Gurus, plus the other items in step 3. Name any further Gurus' Prakash and Shaheedi days you want.
2. **Shaheedi Jor Mela spans several days.** Left out, because single-day events only keeps the resolver small.
3. **Fixture source.** Dekho-ji and Golden Temple Amritsar, secondary reproductions, as in feature 3. Punjab Data was down on 2026-10-15 (HTTP 521). A copy of the SGPC jantri itself is still to be collected (§10).


<!-- blueprint:completion {"schemaVersion":2,"specBytes":19262,"specSha256":"2a08d4198c830a9c95f8c0b744e3d2c43a4cc8cffb0a9a9f159fdd38adfd7457","branch":"refs/heads/feature/festival-resolver-cultural-sikh","head":"544dff0f01f7028c577194144b8fb8c9b527ed23","baseRef":"refs/heads/main","baseCommit":"544dff0f01f7028c577194144b8fb8c9b527ed23","sourceTree":"b75e46364df91a0ca74bf200f61bde353de1746d","landing":"local-merge","absentOptional":[]} -->
