# Feature: Settings panel

**From build-plan:** feature 11
**Build attempt:** 1
**Branch:** feature/settings-panel
**Status:** verified

## Goal

Let a person change everything the new tab already supports, from the new tab itself: which calendars show and in what order, the look (theme, date style, photo or solid colour), the festival sets, the Gurpurab source, the Hijri offset, whether the Today/Tomorrow lines show, whether the daily fact shows, and an About block. A gear button opens the panel, every change applies to the page immediately and is saved to `storage.sync` straight away (no Save button), and the panel code loads only when the gear is used, so first paint and the initial bundle do not grow.

This is the first code that writes settings, so it also closes the hazard feature 8 recorded: a `null` from `loadSettings` can mean "newer schema written by another device", and saving over it would destroy it.

### Decisions this spec records

All are cheap to change before 1.0.0; nothing has been published.

- **Schema 4 adds `showFestivalLines` and `showFact` (both `boolean`).** Plan §7.3 lists both toggles and `Settings` has neither. Migration 3 to 4 sets both `true`, which is what every earlier schema displayed. `showFact` has no visible effect until feature 15 (the same precedent as `background` before feature 14): it is stored and toggleable now.
- **Changes apply live and save on every change.** No Save or Cancel button. The page behind the panel is the live preview. A failed save keeps the change on screen for this tab and says so in the panel (see error handling below).
- **Native `<dialog>` opened with `showModal()`, styled as a side sheet.** It gives focus trapping, Escape to close, an inert page behind it and focus return to the gear for free, with no library. The backdrop is transparent so the page stays visible as the preview. On narrow screens the sheet is full width.
- **Calendar order is edited with Up/Down buttons, not drag and drop.** Keyboard operable by construction (plan §7.4). Disabled calendars sit below the enabled ones in the fixed order Gregorian, Desi, Bikrami, Nanakshahi, Hijri. Turning one on appends it to the end of the enabled list. At least one calendar stays on (the validator already requires it), so the last enabled checkbox is disabled.
- **Festival sets are any subset, including none**, kept in the canonical `festivalSets` order when saved. The Gurpurab source and the Hijri offset are always shown; they only change output when the matching set or calendar is on.
- **Hijri offset control** is a three-way radio group (`-1`, `0`, `+1`) labelled with the plan's hint "Match your local mosque".
- **No settings yet = start from what the page shows.** With no mirror the page shows all five calendars and all four sets (feature 6 decision). The panel opens on that state, so the first change does not make the page jump. That first change writes a full `Settings` object. Feature 12 (onboarding) decides what first run means; this feature does not.
- **A newer-schema value in `storage.sync` is never overwritten.** `saveSettings` reads the stored value first and, if it is an object with an integer `schemaVersion` above the current one, rejects with `NewerSettingsError` without writing. The panel shows "These settings were saved by a newer version of Aaj Da Din. Update this browser's extension to change them." Garbage (anything else that fails validation) is overwritable.
- **About block, partly deferred.** Included now: version (from `browser.runtime.getManifest().version`, no permission), "Open source (GPL-3.0)" linking to the repository `https://github.com/HananSolves/Aaj-Da-Din`. Deferred because their targets do not exist yet: the privacy policy link (feature 18, hosted page) and photo credits and licences (feature 14, no photos yet). Plan §7.3's "Report a mistake / Suggest a feature" and "Support Aaj Da Din" entries belong to feature 16 and are not in this panel.

## In scope

- `src/settings/types.ts`, `migrations.ts`: schema 4, `showFestivalLines`, `showFact`, validation, migration step, `isNewerSchema`.
- `src/settings/store.ts`: `saveSettings` refuses to overwrite a newer schema (`NewerSettingsError`).
- `src/settings/edit.ts` (new): pure helpers for calendar and festival-set edits.
- `src/strings/en.ts`: every panel string (headings, labels, hints, errors, festival set names, Gurpurab source names, Hijri offset names).
- `src/ui/settings-panel.ts` and `src/ui/settings-panel.css` (new, lazy): the dialog and its controls.
- `entrypoints/newtab/main.ts`, `critical.css`: gear button, lazy `import()`, one render path used at start and on every change, hide the festival lines when `showFestivalLines` is false.
- Tests for the logic above, and one decision-log line in `blueprint/project-plan.md` §11 (last step).

## Out of scope

- Onboarding and first-run handling (feature 12), photo layer and gradient (14), the fact itself (15), the Patreon link, the feedback link and the ask card (16), the full accessibility pass (17), the privacy page (18).
- Privacy-policy link, photo credits and licences in About (see decisions).
- Drag-and-drop ordering, a reset-to-defaults button, import/export of settings, per-calendar options, a "system" theme, translations.
- A settings page route (`options_ui`): the panel is an overlay on the new tab only.
- New permissions, a background script, a runtime dependency, or any framework.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`, so there are no checkpoint commits; `/complete` makes the single commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. Schema 4 and the newer-schema guard.**
  - `types.ts`: `schemaVersion: 4`, add `showFestivalLines: boolean` and `showFact: boolean`; `defaultSettings` has both `true`.
  - `migrations.ts`: `currentSchemaVersion = 4`; `migrations[2]` (3 to 4) adds both as `true`; `isCurrentShape` requires both to be booleans. Export `isNewerSchema(value: unknown): boolean` (true only for a non-array object whose `schemaVersion` is an integer greater than `currentSchemaVersion`).
  - `store.ts`: `saveSettings` first does `browser.storage.sync.get(KEY)`; if `isNewerSchema(stored[KEY])` it throws `NewerSettingsError` before any write. Otherwise unchanged (sync written before the mirror; a failed write rejects). Export `NewerSettingsError`.
  - Update `tests/migrations.test.ts`, `mirror.test.ts`, `store.test.ts` fixtures to schema 4. Add cases: a v3 value migrates with both flags `true` and keeps its other fields; a v1 and a v2 value reach schema 4; non-boolean flags are rejected; a schema 5 value is `null`; `isNewerSchema` for newer, current, older, `"5"`, `5.5`, `null`, an array and a plain string; `saveSettings` over a newer value rejects with `NewerSettingsError` and never calls `set` or touches the mirror; over missing, garbage and older values it writes.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

- [x] **2. Edit helpers.**
  - `src/settings/edit.ts` (new), all pure and returning new objects: `calendarRows(settings)` (all five ids with `enabled`, enabled first in saved order, then disabled in canonical order), `toggleCalendar(settings, id)` (appends when turning on; turning off the only enabled calendar returns the settings unchanged), `moveCalendar(settings, id, delta: -1 | 1)` (swaps within the enabled list; an edge or a disabled id returns the settings unchanged), `toggleFestivalSet(settings, set)` (result in canonical `festivalSets` order).
  - Add `tests/settings-edit.test.ts` covering each rule above, including the last-calendar guard, moving at both edges, turning a calendar on and off, and that the input object is not mutated.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

- [x] **3. Strings and the panel.**
  - `en.ts`: add a `settings` group with the title, the close and gear labels, the section headings (Calendars, Look, Festivals, Fact, About), control labels, "Match your local mosque", the "Original Nanakshahi (2003)" and "SGPC" source names, set names (`cultural`, `sikh`, `hindu`, `muslim`) typed as `Record<FestivalSet, string>`, the Hijri offset labels, move announcements, and the two error messages. No string literals in UI code.
  - `src/ui/settings-panel.ts` exports `openSettings({ settings, onChange })`. It builds a `<dialog>` with DOM APIs (`textContent` only, never `innerHTML`), appends it to `document.body`, calls `showModal()`, and removes it on `close`. Sections: Calendars (a row per calendar with a checkbox plus Up and Down buttons whose accessible names include the calendar name), Look (theme, date style, background as radio groups), Festivals (set checkboxes, Gurpurab source radios, Hijri offset radios, a "Show Today and Tomorrow lines" checkbox), Fact (a "Show the daily fact" checkbox), About (version, repository link with `rel="noopener noreferrer"`). Header has a visible Close button; a click on the backdrop and Escape also close.
  - Every edit builds the next `Settings` (via `edit.ts` or a simple field replace), calls `onChange(next)` immediately, then `saveSettings(next)`. A rejected save shows the matching message in a `role="status"` region (newer-schema message for `NewerSettingsError`, otherwise "Could not save your settings. They will reset when you open a new tab."); a later successful save clears it. Calendar moves also announce "<Name> moved to position N of M" in that region.
  - After a calendar edit only the Calendars list is rebuilt, and focus stays on the control that was used; if a move leaves that Up or Down button disabled at an edge, focus goes to the other direction button.
  - `settings-panel.css`: panel uses `--bg`, `--fg`, `--muted` so it follows the theme, a side sheet on wide screens and full width under 40rem, visible focus rings, transparent backdrop, and it holds up at 200% text zoom (no fixed heights; the sheet scrolls).
  - **Done when:** `pnpm typecheck` and `pnpm lint` pass and the module builds into its own lazy chunk (checked in step 4).

- [x] **4. Wire into the new tab.**
  - `main.ts`: keep one `current` settings value (the painted one, replaced by a differing synced value, then by each panel change). Replace the duplicated render calls with a single `render(settings, now)` that applies the look, renders the dates, and renders the festivals. `renderFestivals` empties the container and skips the lookup when `showFestivalLines` is false.
  - Add a gear button (`<button type="button">`, text `⚙` plus the text-presentation selector `U+FE0E`, `aria-label` from `en.settings`) fixed to the top-right so it cannot shift the dates. Click runs `import("../../src/ui/settings-panel.ts")` then `openSettings({ settings: current, onChange })`. A failed chunk load leaves the page working and the button usable for another try; it does not throw to the console.
  - `critical.css`: only the gear button's rules (a few lines); everything else is in the lazy `settings-panel.css`.
  - **Done when:** `pnpm check` passes (typecheck, lint, test, calendar check, both builds, size budgets, manifest check); the build output has a separate panel JS chunk and CSS file; the initial JS is not larger than before by more than the gear and render wiring.

- [x] **5. Browser evidence on Chrome and Firefox.**
  - On `.output/chrome-mv3` and `.output/firefox-mv3`, the same checks on each (recipes in project memory, scripts kept in the scratchpad): the gear opens the panel and the panel chunk is not requested until then; with no stored settings the panel opens on the five-calendar state and the first change saves a full schema 4 object to `storage.sync` and the mirror; toggling a calendar, moving it up and down, changing theme, date style and background, toggling each festival set, the Gurpurab source and the Hijri offset, and the Today/Tomorrow and fact toggles each change the page (or the stored value, for fact and background) immediately and persist across a reload; the last enabled calendar cannot be turned off; Escape closes and focus returns to the gear; Tab stays inside the open panel and focus survives a calendar move; a stored schema 5 value shows the newer-version message and is not overwritten; a rejected `storage.sync.set` shows the save-failed message and the page still reflects the change; a stored schema 3 value migrates and shows both new toggles on; narrow width and 200% zoom screenshots; no console errors.
  - **Done when:** each case is recorded per browser as observed or not run, with screenshot paths for the panel open on `chitta/list`, on `raat/centered`, and at narrow width.

- [x] **6. Decision log.**
  - One line in `blueprint/project-plan.md` §11: schema 4 and its flags, live-save with no Save button, native dialog side sheet, Up/Down ordering, the newer-schema save guard, and the About items deferred to features 14 and 18. The plan hash changes, so re-run the overview behaviour and record it.
  - **Done when:** `pnpm check` passes once more.

## Files / areas

- `src/settings/types.ts`, `migrations.ts`, `store.ts`, `edit.ts` (new)
- `src/strings/en.ts`
- `src/ui/settings-panel.ts` (new), `src/ui/settings-panel.css` (new)
- `entrypoints/newtab/main.ts`, `critical.css`
- `tests/migrations.test.ts`, `mirror.test.ts`, `store.test.ts`, `settings-edit.test.ts` (new)
- `blueprint/project-plan.md` (§11, one line), `blueprint/context/project-overview.md` (regenerated)
- Unchanged on purpose: `src/calendars/*`, `src/festivals/*`, `src/ui/today.ts`, `src/themes/*`, `index.html`, `theme-boot.ts`, `wxt.config.ts`, `mirror.ts`.

## Data / contracts

```ts
// src/settings/types.ts
export interface Settings {
  schemaVersion: 4;
  calendars: CalendarId[];          // enabled calendars in display order, at least one, no duplicates
  theme: ThemeId;
  dateStyle: DateStyle;
  background: Background;
  hijriOffset: -1 | 0 | 1;
  festivalSets: FestivalSet[];      // any subset, canonical order when saved by the panel
  gurpurabSource: GurpurabSource;
  showFestivalLines: boolean;       // default true
  showFact: boolean;                // default true; read by feature 15
}
// src/settings/migrations.ts
export function isNewerSchema(value: unknown): boolean;
// src/settings/store.ts
export class NewerSettingsError extends Error {}
export function saveSettings(settings: Settings): Promise<void>; // rejects NewerSettingsError, or the storage error
// src/settings/edit.ts
export interface CalendarRow { id: CalendarId; enabled: boolean }
export function calendarRows(s: Settings): CalendarRow[];
export function toggleCalendar(s: Settings, id: CalendarId): Settings;
export function moveCalendar(s: Settings, id: CalendarId, delta: -1 | 1): Settings;
export function toggleFestivalSet(s: Settings, set: FestivalSet): Settings;
// src/ui/settings-panel.ts
export function openSettings(options: { settings: Settings; onChange: (next: Settings) => void }): void;
```

- Migration 3 to 4 runs in memory on read and is not written back (feature 8). The migrated value reaches `storage.sync` the first time a person changes a setting.
- `storage.sync` key stays `settings`, mirror key `add:settings`. Every panel save writes the whole object (about 300 bytes, far under the 8 KB item limit).
- `onChange` is called before the save settles, so the page never waits on storage.
- Stored settings are untrusted on read (`parseSettings`); the panel only ever builds `Settings` from validated state plus its own typed controls, and writes text with `textContent`.

## Testing

`pnpm test` is configured, so logic ships with tests: the migration, validation, `isNewerSchema` and `saveSettings` guard (step 1) and the edit helpers (step 2). Not unit-tested, per coding-standards: the dialog, the gear, the CSS and the render wiring, which ride on `pnpm check` and the browser evidence in step 5. No browser test runner is declared, so no automated browser evidence is claimed.

## Notes for the AI

- Keep first paint untouched: nothing from `src/ui/settings-panel.*` may be reachable from `theme-boot.ts` or imported statically by `main.ts`. Check the build for a separate chunk.
- Treat stored settings as untrusted; never cast, always `parseSettings`. Never use `innerHTML`.
- Do not add Save/Cancel, drag-and-drop, a reset button, a framework, a dependency, onboarding, a Support or feedback entry, or a privacy link.
- Strings go in `src/strings/en.ts`. No em dashes (U+2014), en dashes or the ellipsis character in code, comments or docs.
- If JS or CSS budgets are at risk, stop and report. Do not drop a control to fit.
- If the lazy CSS cannot load from the dynamic chunk in the extension page, put the panel rules in `critical.css` only if the budget allows, and record the change in the packet.

## Open questions

- The repository URL is taken from `git remote origin`; confirm it is the public home before 1.0.0.
- The `showFestivalLines` and `showFact` names and the schema 4 bump are proposals for the review; they are only stored data until feature 15 reads `showFact`.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":17122,"specSha256":"90fce6fdaf0c1cd32260dc13bad67f3973040fec1f07b1ba29af2582e685f21b","branch":"refs/heads/feature/settings-panel","head":"1a581ef3a21ef7d3085334d71bf2f4b4700774ee","baseRef":"refs/heads/main","baseCommit":"1a581ef3a21ef7d3085334d71bf2f4b4700774ee","sourceTree":"faa2185842e1185728d30bdc7de10217b213fce1","landing":"local-merge","absentOptional":[]} -->


## Try it now

1. Run `pnpm build`, load `.output/chrome-mv3` unpacked (or `.output/firefox-mv3` through `about:debugging`), and open a new tab.
2. Click the gear at the top right. Expected: a Settings sheet slides in from the right and the page behind it stays visible.
3. Untick Hijri, then press the up arrow beside Desi. Expected: the date list updates at once, Desi moves up one row, and the same order is still there after a reload.
