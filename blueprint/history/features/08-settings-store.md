# Feature: Settings store

**From build-plan:** feature 8
**Build attempt:** 1
**Branch:** feature/settings-store
**Status:** verified

## Goal

Give the extension a real settings store: `storage.sync` is the source of truth, versioned by `schemaVersion` with a migration path, and the `localStorage` mirror is refreshed from it so the next new tab paints instantly. The new tab reads the store once after its first paint and re-renders only if the synced settings differ from what the mirror painted.

Nothing in the UI writes settings yet (onboarding is feature 12, the panel is feature 11), so this feature ships the load and save functions, the validator and the migration runner, and wires the load into the new tab. It adds no fields to `Settings`.

### Decisions this spec records

All are reversible and cheap to change in features 9 to 12.

- **One validator, one place.** The shape check that lives in `parseMirror` moves to `parseSettings(value, steps?)` in `src/settings/migrations.ts`. The mirror and `storage.sync` both go through it, so they can never disagree about what valid means.
- **Migrations run in memory, on read.** A stored value older than the current `schemaVersion` is migrated step by step and returned. It is not written back on load. Writing back would make a device that has not updated yet see a newer schema it cannot read and lose its settings. The migrated value reaches `storage.sync` the next time the user changes a setting.
- **A newer `schemaVersion` is ignored, never overwritten.** Synced settings written by a newer release on another device are treated as "unreadable" (`null`). `loadSettings` never writes, so an older device does not destroy them by merely opening a tab. (Feature 12 must not treat `null` from a newer-schema value as "first run" and overwrite it. Recorded here so it is not forgotten.)
- **Save writes `storage.sync` first, then the mirror.** The mirror is never ahead of the source of truth. If the sync write rejects, `saveSettings` rejects and the mirror is untouched, so the caller can tell the user.
- **A failing `storage.sync` falls back to the mirror.** `loadSettings` returns `readMirror()` if the read throws. An empty or unreadable sync value returns `null` and the page keeps what it painted.
- **One storage key.** The whole `Settings` object is stored as one item under the key `settings` (far below the 8 KB per-item limit).
- **No `storage.onChanged` listener.** A new tab is short-lived and reads the store each time it opens, so a change made on another device is picked up on the next open. Add a listener only when a long-lived page (the settings panel) needs one.
- **No new fields, no new storage keys for installs.** `Settings` stays at schema 1 with `calendars`, `theme` and `hijriOffset`. Features 9 to 12 add fields, bump the version and add their own migration step.

## In scope

- `src/settings/migrations.ts` (new): `currentSchemaVersion`, the (empty) migration table, `parseSettings`.
- `src/settings/mirror.ts`: `parseMirror` becomes `JSON.parse` plus `parseSettings`.
- `src/settings/store.ts` (new): `loadSettings`, `saveSettings`.
- `entrypoints/newtab/main.ts`: render from the mirror, then load the store and re-render if it differs.
- Tests for the validator, the migration runner, and the store with a mocked `wxt/browser`.
- One decision-log line in `blueprint/project-plan.md` §11 (last step).

## Out of scope

- New `Settings` fields, themes, date styles, onboarding, panel (features 9 to 12). `types.ts` does not change.
- A `storage.onChanged` listener, `storage.local` content cache, install or ask dates.
- Handling `storage.sync` write rate limits (120 per minute). The first writers are onboarding and the panel, which save on user action. Revisit in feature 11 if the panel saves on every keystroke.
- Writing migrated settings back on load, and clearing a stale mirror when sync is empty.
- Any new permission, background script or runtime dependency.

## Build loop

`workflow.stepReview` is `feature`, so review happens once for the whole feature after the last step. `workflow.checkpointCommits` is `disabled`, so there are no checkpoint commits. `/complete` creates the single feature commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. One validator with a migration runner.**
  - Add `src/settings/migrations.ts` exporting `currentSchemaVersion` (`1`), `migrations` (an empty array of steps) and `parseSettings(value: unknown, steps = migrations, current = currentSchemaVersion): Settings | null`.
    - A step at index `n - 1` takes the stored value at schema `n` and returns it at schema `n + 1`. The runner needs no steps while `current` is 1.
    - Returns `null` for a non-object, a `schemaVersion` that is not an integer from 1 up to `current`, or a result that fails the shape check below. A throwing step is `null`, not an exception.
    - Shape check (moved verbatim from `parseMirror`): `calendars` non-empty, known ids, no duplicates; `theme` a string; `hijriOffset` in `-1 | 0 | 1`. Extra fields are kept.
  - `src/settings/mirror.ts`: `parseMirror(raw)` is `null` for `null`/empty, `null` for invalid JSON, otherwise `parseSettings(JSON.parse(raw))`. The `calendarIds` list moves with the validator.
  - Add `tests/migrations.test.ts`: the valid case, extra fields kept, each rejection that `mirror.test.ts` already covers (including a newer `schemaVersion`), `schemaVersion` of `0`, `1.5` and `"1"`, and the runner using injected steps with `current = 3`: a v1 value passes through both steps in order, a v2 value through the second only, a step that throws gives `null`, and a step whose output fails the shape check gives `null`. Existing `tests/mirror.test.ts` must pass unchanged.
  - **Done when:** `pnpm typecheck`, `pnpm lint` and `pnpm test` pass, with the new file in the run and `mirror.test.ts` unchanged and green.

- [x] **2. The store.**
  - Add `src/settings/store.ts` using `browser` from `wxt/browser`, storage key `settings`:
    - `loadSettings(): Promise<Settings | null>`: `browser.storage.sync.get("settings")`, then `parseSettings`. A valid result is written to the mirror with `writeMirror` and returned. A missing or invalid value returns `null` and leaves the mirror alone. If the read throws, return `readMirror()`.
    - `saveSettings(settings: Settings): Promise<void>`: `await browser.storage.sync.set({ settings })`, then `writeMirror(settings)`. A rejected `set` propagates and the mirror is not written.
  - Add `tests/store.test.ts` with `vi.mock("wxt/browser")` (an in-memory fake `storage.sync`) and `vi.stubGlobal("localStorage", …)`: load returns and mirrors a valid stored value; load of nothing, of garbage and of `schemaVersion: 2` returns `null` and does not touch the mirror (migration itself is covered in step 1); a throwing `get` returns the mirror's value (and `null` when the mirror is empty); save writes sync then the mirror; a rejecting `set` rejects and leaves the mirror unwritten; a throwing `localStorage` does not make load or save fail.
  - **Done when:** `pnpm typecheck`, `pnpm lint` and `pnpm test` pass with the new file in the run.

- [x] **3. Wire the new tab.**
  - `entrypoints/newtab/main.ts`: split rendering into `render(settings)`. First pass uses `readMirror() ?? v0 default` exactly as today. After it finishes, call `loadSettings()`. If it returns settings whose `JSON.stringify` differs from the ones painted, set `document.documentElement.dataset.theme` to the new theme and render again. A rejection or `null` changes nothing and logs nothing.
  - Update the v0 comment above `v0Calendars` (it still says the store does not exist). The v0 default for "no settings anywhere" stays.
  - No change to `theme-boot.ts`, `index.html` or `critical.css`.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm build:firefox` and `pnpm size` pass, JS stays under 25 KB gzip, CSS under 8 KB, package under 100 KB, and both manifests still list only the `storage` permission.

- [x] **4. Browser evidence and decision log.**
  - Load `.output/chrome-mv3` unpacked and open a new tab. In the new tab's DevTools console run `chrome.storage.sync.set({ settings: { schemaVersion: 1, calendars: ["hijri", "gregorian"], theme: "dark", hijriOffset: 0 } })`, then reload twice. Observe: after the first reload the page renders from the old mirror then flips to the two rows (or already shows them), `localStorage["add:settings"]` equals the stored value, and the second reload paints it with no flash. Then store garbage and `schemaVersion: 2` and check the page keeps working with no console error and the mirror is unchanged. Repeat the basic set-and-reload check in Firefox if it can be driven here, otherwise mark it not run.
  - Add one line to `blueprint/project-plan.md` §11 recording the store decisions above (sync is the source of truth, migrate on read without writing back, newer schema ignored, sync written before the mirror).
  - **Done when:** the observed results are written in the hand-over, each marked as observed or not run, and `pnpm check` passes once more.

## Files / areas

- `src/settings/migrations.ts` (new), `src/settings/store.ts` (new), `src/settings/mirror.ts`
- `entrypoints/newtab/main.ts`
- `tests/migrations.test.ts` (new), `tests/store.test.ts` (new), `tests/mirror.test.ts` (unchanged)
- `blueprint/project-plan.md` (§11, one line)
- Unchanged on purpose: `src/settings/types.ts`, `entrypoints/newtab/theme-boot.ts`, `index.html`, `critical.css`, `wxt.config.ts`, `src/calendars/*`, `src/festivals/*`.

## Data / contracts

```ts
// src/settings/migrations.ts
export const currentSchemaVersion = 1;
export type MigrationStep = (stored: Record<string, unknown>) => Record<string, unknown>;
export const migrations: MigrationStep[];
export function parseSettings(
  value: unknown,
  steps?: MigrationStep[],
  current?: number,
): Settings | null;

// src/settings/store.ts
export function loadSettings(): Promise<Settings | null>;
export function saveSettings(settings: Settings): Promise<void>;
```

- Stored in `storage.sync` under the single key `settings`: a `Settings` object. The mirror key stays `add:settings`.
- `loadSettings` never writes to `storage.sync`. Only `saveSettings` does.
- The new tab never throws to the console for a missing, invalid, newer or unreachable store.

## Testing

`pnpm test` is configured, so logic steps ship tests with them:

- Validator and migration runner (`parseSettings`): every rejection, extra fields kept, runner order, throwing step, bad step output.
- Store (`loadSettings`, `saveSettings`) against a mocked `wxt/browser` and a stubbed `localStorage`: the paths listed in step 2.
- Not unit-tested, per coding-standards: the DOM re-render in `main.ts`. It rides on the build, `pnpm size` and the browser evidence in step 4.
- No browser test runner is declared, so no automated browser evidence is claimed.

## Notes for the AI

- Do not add `Settings` fields, a `storage.onChanged` listener, a write-back on load, or a dependency.
- `storage.sync` content is untrusted input (any device, any release can write it). Always go through `parseSettings`, never cast.
- Keep first paint synchronous and unchanged: the store is read only after the first render.
- No `innerHTML`. Strings, if any, go in `src/strings/en.ts`. No em dashes in code, comments or docs.
- If the JS budget is at risk after step 3, stop and report. Do not trim data.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":11507,"specSha256":"4308b95c5dbbedbf364536d8e2168e6ebbe97f4a8008498bcc7087fd6d7f0d9a","branch":"refs/heads/feature/settings-store","head":"36cac7dec49de3a12809920087f1d86c62daafb2","baseRef":"refs/heads/main","baseCommit":"36cac7dec49de3a12809920087f1d86c62daafb2","sourceTree":"f06db8006e3a5710b9d06be2fbcc2e8be9690ce1","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

1. `pnpm build`
2. In Chrome or Edge open `chrome://extensions`, turn on Developer mode, choose Load unpacked and pick `.output/chrome-mv3`.
3. Open a new tab and open its DevTools console.
4. Run `chrome.storage.sync.set({ settings: { schemaVersion: 1, calendars: ["hijri", "gregorian"], theme: "dark", hijriOffset: 0 } })`.
5. Reload the tab twice.

Expected:

After the first reload the page shows only the Hijri and Gregorian rows on the dark theme. After the second reload it paints that way immediately, and `localStorage["add:settings"]` holds the same settings. Setting `settings` to a string, or to a value with `schemaVersion: 2`, leaves the page and the mirror unchanged.

This proves:

`storage.sync` is read after first paint and refreshes the mirror, and unreadable or newer-schema values are ignored without breaking the page. It does not show a settings migration, because schema 1 has none yet.
