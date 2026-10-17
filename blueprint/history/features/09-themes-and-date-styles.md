# Feature: Themes and date styles

**From build-plan:** feature 9
**Build attempt:** 1
**Branch:** feature/themes-and-date-styles
**Status:** verified

## Goal

Give the new tab six colour themes, three date styles and a stored photo-or-solid choice. The look is applied before first paint from the `localStorage` mirror, so there is no flash of the wrong theme or layout, and `prefers-color-scheme` picks the theme when no setting exists.

Nothing in the UI writes these settings yet (onboarding is feature 12, the panel is feature 11), so the look is exercised by writing `storage.sync` or the mirror directly. The photo layer does not exist until feature 14: the `background` setting is stored and exposed as `data-background` on `<html>` now, and has no visible effect until then. Every page is a solid colour today.

### Decisions this spec records

All are cheap to change before 1.0.0; nothing has been published.

- **Date styles (confirmed by the user):** `list` (today's layout: left-aligned, label beside the date, first row large), `centered` (everything centred, label above the date), `compact` (all calendars on one wrapping line, smaller). They change layout only. The DOM and the date strings are identical in all three, so the work is CSS plus one `data-date-style` attribute.
- **Themes:** six, using the plan's candidate names as ids: `chitta` (white, light), `raat` (night, dark), `sarson` (mustard), `phulkari` (deep pink), `mitti` (earth brown), `neela` (blue). The plan marks names and palettes as not final (§10), so the palette values are a proposal for the human review; ids are what is stored, labels live in `en.ts`.
- **Palettes are CSS, the id list is TypeScript.** Themes stay as CSS custom property blocks in `critical.css` (plan §5.2), so first paint needs no JS. `src/themes/themes.ts` lists the ids for validation. A test reads `critical.css` and fails if the two disagree or a palette misses 4.5:1 contrast, so they cannot drift.
- **Default theme without settings:** `:root` is `chitta`, and `prefers-color-scheme: dark` makes it `raat`. A stored theme always wins (`data-theme` is more specific). What onboarding stores for someone who skips is decided in feature 12.
- **Schema 2.** `Settings` gains `dateStyle` and `background`; `theme` becomes a validated `ThemeId`. Migration 1 to 2 maps `dark` to `raat`, any other theme (including `light`) to `chitta`, and adds `dateStyle: "list"` and `background: "photo"` (the plan's skip-onboarding default is photo on). A stored theme that is not a known id fails validation, like any other bad field.
- **`data-background` is set, not styled.** Feature 14 reads it. No placeholder CSS is added for it.

## In scope

- `src/themes/themes.ts` (new): `themeIds`, `ThemeId`.
- `src/settings/types.ts` and `migrations.ts`: schema 2, new fields, validation, migration step.
- `src/themes/look.ts` (new): `applyLook(settings)` sets `data-theme`, `data-date-style`, `data-background` on `<html>`.
- `entrypoints/newtab/theme-boot.ts`, `main.ts`: use `applyLook` (boot from the mirror, main after a differing sync).
- `entrypoints/newtab/critical.css`: six theme blocks with `color-scheme`, and the three date-style layouts.
- `src/strings/en.ts`: `themeNames`, `dateStyleNames` (typed so a missing id fails typecheck).
- Tests, and one decision-log line in `blueprint/project-plan.md` §11 (last step).

## Out of scope

- Any UI to change the settings (features 11, 12), a photo layer or gradient (14), the WCAG pass over every state (17).
- A "system" theme option, user-defined colours, per-calendar styling, web fonts, animation.
- Writing migrated settings back on load (feature 8 decided this).
- New permissions, background script or runtime dependency.

## Build loop

`workflow.stepReview` is `feature`; `workflow.checkpointCommits` is `disabled`, so no checkpoint commits and `/complete` makes the single commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. Settings schema 2.**
  - Add `src/themes/themes.ts` with `themeIds` (`chitta`, `raat`, `sarson`, `phulkari`, `mitti`, `neela`) as a const tuple and `ThemeId`.
  - `types.ts`: add `DateStyle` (`list | centered | compact`) and `Background` (`photo | solid`) with their id tuples; `Settings.schemaVersion` becomes `2`, `theme: ThemeId`, plus `dateStyle` and `background`. `defaultSettings`: `chitta`, `list`, `photo`.
  - `migrations.ts`: `currentSchemaVersion = 2`; `migrations[0]` as decided above; `isCurrentShape` also requires a known `theme`, `dateStyle` and `background`.
  - The existing runner tests inject steps that rewrite `theme` into non-ids (`dark-v2`); the final shape check would now reject those, so they must tag a field that is still free-form (an extra field) instead.
  - Update `tests/migrations.test.ts`, `mirror.test.ts`, `store.test.ts` fixtures to schema 2. Add cases: v1 `light`, `dark`, an unknown theme and a non-string theme migrate to the right ids with the new defaults added; other v1 fields survive; each invalid new field is rejected; a schema 3 value is `null`.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

- [x] **2. Palettes, date styles and wiring.**
  - `critical.css`: replace the `light`/`dark` blocks with `:root` (= `chitta`), the dark media query (= `raat`) and one `:root[data-theme="<id>"]` block per theme with `--bg`, `--fg`, `--muted` and `color-scheme`. Add `[data-date-style="centered"]` and `[data-date-style="compact"]` rules for `#dates`, its rows and `#festivals` (festival lines follow the date alignment). The default is the current `list` layout. The page stays anchored to the top so late festival lines cannot move the dates.
  - `look.ts` as above; `theme-boot.ts` calls it for the mirror; `main.ts` calls it for a differing synced value instead of setting the theme by hand.
  - `en.ts`: `themeNames` and `dateStyleNames`, typed `Record<ThemeId, string>` / `Record<DateStyle, string>`.
  - Add `tests/themes.test.ts`: reads `critical.css`; every id in `themeIds` has exactly one `data-theme` block and no block exists for an unknown id; each block (and the default `:root`) has `--fg` and `--muted` at least 4.5:1 against `--bg`; each declares `color-scheme`; `themeNames` and `dateStyleNames` have no empty string.
  - **Done when:** `pnpm check` passes (typecheck, lint, test, calendar check, both builds, size, manifest), JS under 25 KB gzip and CSS under 8 KB gzip.

- [x] **3. Browser evidence on Chrome and Firefox.**
  - On `.output/chrome-mv3` and `.output/firefox-mv3`, same checks on each: with no settings, the page follows the OS colour scheme (light and dark emulated); write schema 2 settings to `storage.sync` for each of the six themes and three date styles and observe the computed `--bg`, `data-theme`, `data-date-style`, `data-background` and a screenshot; with the mirror set, `data-theme` is on `<html>` before first paint (paint timeline, no wrong-theme frame); a schema 1 value (`theme: "dark"`) in `storage.sync` migrates in memory and paints `raat`; garbage in storage leaves a working page; no console errors. Follow the recipes in the project memory (CDP for Chrome, Marionette for Firefox, scripts kept in the scratchpad).
  - **Done when:** each case is recorded per browser as observed or not run, with screenshot paths for at least `chitta/list`, `raat/centered` and `sarson/compact`.

- [x] **4. Decision log.**
  - One line in `blueprint/project-plan.md` §11: six themes with ids, the three date styles, schema 2 with the 1 to 2 mapping, `background` stored before the photo layer exists. Re-run the overview behaviour if the plan hash changes and the overview becomes stale.
  - **Done when:** `pnpm check` passes once more.

## Files / areas

- `src/themes/themes.ts` (new), `src/themes/look.ts` (new)
- `src/settings/types.ts`, `src/settings/migrations.ts`
- `entrypoints/newtab/critical.css`, `theme-boot.ts`, `main.ts`
- `src/strings/en.ts`
- `tests/migrations.test.ts`, `mirror.test.ts`, `store.test.ts`, `themes.test.ts` (new)
- `blueprint/project-plan.md` (§11, one line)
- Unchanged on purpose: `src/calendars/*`, `src/festivals/*`, `src/ui/today.ts`, `index.html`, `wxt.config.ts`, `store.ts`, `mirror.ts`.

## Data / contracts

```ts
// src/settings/types.ts
export interface Settings {
  schemaVersion: 2;
  calendars: CalendarId[];
  theme: ThemeId;
  dateStyle: "list" | "centered" | "compact";
  background: "photo" | "solid";
  hijriOffset: -1 | 0 | 1;
}
// src/themes/look.ts
export function applyLook(settings: Pick<Settings, "theme" | "dateStyle" | "background">): void;
```

- `<html>` attributes: `data-theme="<ThemeId>"`, `data-date-style="<DateStyle>"`, `data-background="photo|solid"`. Absent attributes mean the CSS defaults (OS-scheme theme, `list`).
- `storage.sync` key stays `settings`, mirror key `tarikh:settings`. A v1 value migrates in memory on read and is not written back.

## Testing

`pnpm test` is configured, so logic ships with tests: the migration step and validation (step 1) and the theme contract against `critical.css` (step 2). Not unit-tested, per coding-standards: `applyLook` and the CSS layouts, which ride on the build, `pnpm size` and the browser evidence in step 3. No browser test runner is declared, so no automated browser evidence is claimed.

## Notes for the AI

- Keep first paint synchronous: `theme-boot.ts` stays tiny and imports only the mirror reader and `applyLook`.
- Treat stored settings as untrusted: never cast, always `parseSettings`. Never put a stored string into a selector or `innerHTML`; `applyLook` only runs on validated settings.
- Do not add a UI, a photo layer, a gradient, a runtime dependency or a "system" theme.
- Strings go in `src/strings/en.ts`. No em dashes in code, comments or docs.
- If CSS or JS budgets are at risk, stop and report. Do not drop a theme to fit.

## Open questions

- Final theme names and palettes (plan §10) are not decided. The six here are a proposal for review.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9995,"specSha256":"46f6a734eb3ddff38cbecb874370b5dffeee1dca839103664a93aac1a60c6a74","branch":"refs/heads/feature/themes-and-date-styles","head":"75414b160d129999d5faf3493816095f8aab4f44","baseRef":"refs/heads/main","baseCommit":"75414b160d129999d5faf3493816095f8aab4f44","sourceTree":"7cb053dfcb0f59da17a300997952b32621b1710d","landing":"local-merge","absentOptional":[]} -->
