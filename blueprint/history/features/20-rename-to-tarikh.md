# Feature: Rename to Tarikh

**From build-plan:** feature 20
**Build attempt:** 1
**Branch:** feature/rename-to-tarikh
**Status:** verified

## Goal

Move the code, manifests, strings and docs from the previous name to "Tarikh" and widen the Punjabi-only copy to the South Asia audience, so the build the stores will see already carries the final name. Nothing is published, so this is a plain rename with no data migration.

### Audit of the old name (read from the code)

| Where | Today | Action |
|---|---|---|
| `package.json` | old package name, "Punjabi new-tab extension" description | `tarikh`, South Asia description |
| `wxt.config.ts` | old manifest name, Punjabi description, old Firefox id | "Tarikh", new description, `tarikh@example.org` (still a placeholder, see Out of scope) |
| `entrypoints/newtab/index.html` | `<title>New Tab</title>` | `Tarikh` (static HTML cannot import `en.ts`) |
| `src/strings/en.ts` | old name in 4 strings, "Built by a Punjabi developer for Punjabis everywhere." | Tarikh; ask-card copy from plan §6 ("Built by one developer for South Asians everywhere.") |
| `src/settings/mirror.ts` | old `localStorage` mirror key | `tarikh:settings` |
| `tests/store.test.ts` | old `MIRROR_KEY` | follow the key |
| `README.md`, `AGENTS.md` | "the code is renamed in item 20" notes | remove the stale notes, no mention of the old name |
| `project-plan.md`, `project-overview.md`, `build-plan.md`, archived specs | mention the old name, id and mirror key | update the facts; refresh the overview source hash |

### Decisions this spec records

- **No migration for the mirror key.** The mirror is a cache of `storage.sync`; a missing mirror already means "use defaults, then refresh". Only unpublished dev profiles hold the old key.
- **Only the mirror key carries the prefix.** `storage.sync` `settings` and `storage.local` `installDate` / `lastAskDate` are already scoped to the extension, so renaming them would only force a migration for nothing.
- **GitHub URLs and repository.** Renamed to `HananSolves/Tarikh` in a follow-up at the user's request; GitHub redirects the old URL.
- **Theme display names stay.** The Punjabi theme names are a separate open item in plan §10.

## In scope

- `package.json`, `wxt.config.ts`, `entrypoints/newtab/index.html`, `src/strings/en.ts`, `src/settings/mirror.ts`, `tests/store.test.ts`, `README.md`, `AGENTS.md`, `blueprint/project-plan.md`, `blueprint/context/project-overview.md`.

## Out of scope

- The real Firefox add-on ID (plan §10, before the first AMO upload), icons and store listings (feature 19).
- Theme names, other languages, new settings, new strings beyond the changed copy.
- Archived specs under `blueprint/history/` (they record what was true then).

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`, so there are no checkpoint commits; `/complete` makes the single commit.

## Testing

No new logic. `tests/store.test.ts` keeps pinning the mirror key and fails if `mirror.ts` and the test disagree. A repository-wide search proves no trace of the old name is left.

## Build steps

- [x] **1. Code, manifest and strings.**
  - `package.json`, `wxt.config.ts`, `index.html` title, `en.ts`, `mirror.ts` and `tests/store.test.ts` per the table above.
  - **Done when:** `pnpm typecheck`, `pnpm lint` and `pnpm test` pass, and a case-insensitive search for the old name (spaced, hyphenated, run together) finds nothing outside `node_modules` and `.output`.

- [x] **2. Docs.**
  - `README.md` and `AGENTS.md`: drop the "renamed in item 20" notes. `project-plan.md` §8.2 and §10: state the Tarikh placeholder id as done (the real-ID and repo-rename items stay open). `project-overview.md`: the mirror key; recompute the `source-hash` per the overview skill.
  - **Done when:** the docs read correctly with no stale "will be renamed" claims and the overview hash matches the current plans.

- [x] **3. Build evidence, Chrome and Firefox.**
  - `pnpm build` and `pnpm build:firefox`; read both built `manifest.json` files for name, description, `gecko.id`. Load each in the browser, open a new tab, check the tab title, that the date renders, and that the settings and ask-card copy say Tarikh (force the card as in the earlier features). Report each case per browser as observed or not run.
  - **Done when:** the cases are observed on both browsers, or a case is named as not run with the reason.

- [x] **4. Self-review and full gate.**
  - Re-read the diff against this spec and `coding-standards.md`: no stray literals, no em dashes.
  - **Done when:** `pnpm check` passes.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":4624,"specSha256":"ff945c436d4e19a78da04f28d30d1274c8a39dcfb735b8fbd54aef92c3f0a991","branch":"refs/heads/feature/rename-to-tarikh","head":"37107d34c0f7a00504b490174089030905e5ce57","baseRef":"refs/heads/main","baseCommit":"37107d34c0f7a00504b490174089030905e5ce57","sourceTree":"a881d37f43ebb8d329ba2927b1e0b63fdab5ac74","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Run `pnpm build`, load `.output/chrome-mv3` unpacked and open a new tab.
2. The tab title should read "Tarikh" and `chrome://extensions` should list "Tarikh".
3. Open Settings (the gear): the Support link should read "Support Tarikh".
