# Feature: Support and feedback

**From build-plan:** feature 16
**Build attempt:** 1
**Branch:** feature/support-and-feedback
**Status:** verified

## Goal

Give people a quiet way to support the project and to report a mistake, without ever getting in the way of the date. Two permanent links in Settings (Support Aaj Da Din, Report a mistake or suggest a feature), and a small inline Patreon ask card that follows plan §6: never a popup, first ask at least 14 days after install, at most once a month, closed with one click, never over the date, preferring a festival day when one is close, and no "I already support" button.

The card is the only part with real logic (when to show it), so that logic is pure and unit-tested; the card and the panel section are small DOM code that loads lazily, so first paint and the initial bundle stay as they are.

### Decisions this spec records

All are cheap to change before 1.0.0; nothing has been published.

- **Install date = the first new tab that finds none.** There is no background script and no `runtime.onInstalled` (plan §5.2), so `installDate` is written to `storage.local` the first time the new tab runs without one. It is a local ISO date (`YYYY-MM-DD`).
- **Once a month = 30 days.** An ask is due when today is at least 14 days after `installDate` and at least 30 days after `lastAskDate` (or there is no `lastAskDate`).
- **`lastAskDate` is written when the card is shown, not when it is closed.** The card is therefore shown at most once per 30 days even if it is ignored, and it never comes back on the next tab. If the write fails the card is not shown, so a broken `storage.local` can never turn the ask into a nag.
- **Bad stored dates reset, never ask.** An `installDate` or `lastAskDate` that is not a valid ISO date is rewritten as today and no card shows. A date in the future (clock moved back) counts as "not yet", so it holds the ask rather than firing it.
- **Festival moments (plan §6 "prefer festival moments").** When an ask is due: if today is a celebration in the person's enabled festival sets, show it today; else if a celebration falls in the next 3 days, wait for it; else show it. The wait is therefore at most 3 days. This uses the person's festival sets, Gurpurab source and Hijri offset, and does not depend on `showFestivalLines`.
- **Quiet days.** Shaheedi Purab Guru Arjan Dev Ji, Shaheedi Purab Guru Tegh Bahadur Ji and Ashura are never ask moments, and on those days no ask is shown at all (it waits for the next day). A donation ask on a day of mourning would break the "never guilt-tripping" tone rule.
- **Messages.** Four fixed messages from plan §6. Vaisakhi and the two Eids get their own greeting ("Vaisakhi mubarak!", "Eid mubarak!"); every other day uses one of the two general messages, chosen by day number. There is no generic "`<festival>` mubarak" template, because it would produce wrong greetings (a Shaheedi Purab "mubarak"). Eid is labelled "expected" elsewhere because moon sighting moves it; the greeting is the same on either day.
- **Settings link section.** One new Settings section, "Support and feedback", holds both links, placed between Fact and About.
- **Placeholder URLs, flagged as a release blocker.** The Patreon page and the feedback form do not exist yet (plan §7.3 and §10 call the form URL a placeholder). The Patreon link points to `https://www.patreon.com/` and the feedback link to the repository's GitHub issues, `https://github.com/HananSolves/Aaj-Da-Din/issues`, which works today. Both live in one file so feature 19 replaces them in one place.
- **No setting to turn the ask off.** Plan §6 and §7.3 have none, and the card is rare and one-click closable. Adding one is a product decision, so it is not added.

## In scope

- `src/support/links.ts` (new): the two URLs.
- `src/support/ask.ts` (new): pure date and decision logic.
- `src/support/state.ts` (new): reading and writing `installDate` and `lastAskDate` in `storage.local`.
- `src/ui/ask-card.ts`, `src/ui/ask-card.css` (new, lazy): the card.
- `src/ui/settings-panel.ts`: the new section.
- `src/strings/en.ts`: every new string.
- `entrypoints/newtab/main.ts`: schedule the lazy card after paint.
- Tests for the pure logic and the storage helpers, and one decision-log line in `blueprint/project-plan.md` §11 plus a §10 open item for the Patreon URL (last step).

## Out of scope

- A real Patreon URL and the real feedback form (feature 19 / plan §10), the privacy link (18), the accessibility pass (17).
- A sponsor tile, Patreon Shop items, a countdown, an "I already support" button, a setting to hide the ask, A/B testing, any tracking of whether the card was seen or clicked.
- Onboarding (12) and photos (14); the card does not depend on either.
- New permissions (`storage` already covers `storage.local`), a background script, an alarm, a runtime dependency, or a framework.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`, so there are no checkpoint commits; `/complete` makes the single commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. Links, strings and the pure ask logic.**
  - `src/support/links.ts`: export `supportUrl` and `feedbackUrl` (values above) with a one-line comment that both are placeholders for feature 19.
  - `src/strings/en.ts`: add a `support` group: section heading, the two link labels, the card's accessible name and Dismiss label, and the messages as `{ text, action }` pairs (`vaisakhi`, `eid`, and a two-item `general` array), taken word for word from plan §6.
  - `src/support/ask.ts` (new, no browser imports): `askTiming(today, installDate, lastAskDate): "reset" | "wait" | "due"` (strings are `YYYY-MM-DD`; anything unparsable or not a real calendar date is "reset"; day differences use UTC date arithmetic so daylight saving cannot shift them), `quietDays`, `shouldAskToday(todayIds, upcomingIds): boolean` as described above, `chooseMessage(todayIds, now)`, and `decideAsk(now, idsFor): Promise<AskMessage | null>` which is called only once an ask is due: `idsFor(date)` is injected and returns the festival ids for that local date, `decideAsk` asks it for today and the next 3 days and returns the message or `null` when the card should wait or stay quiet.
  - Tests in `tests/ask.test.ts`: 13 vs 14 days since install, 29 vs 30 days since the last ask, no `lastAskDate`, garbage and missing and non-string values, impossible dates (`2026-02-30`), future dates, month and year boundaries, a leap day; the `shouldAskToday` matrix (celebration today, celebration on day 1, 3 and 4 ahead, quiet day today, quiet day only ahead, nothing near); `chooseMessage` for Vaisakhi, both Eids, a day with two festivals, a quiet-only day, and the general rotation on consecutive days; `decideAsk` end to end with a fake `idsFor`, including the year boundary in late December.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

- [x] **2. Ask state in `storage.local`.**
  - `src/support/state.ts`: `loadAskState(): Promise<{ installDate?: unknown; lastAskDate?: unknown }>` (a failing read resolves to `{}`, which the caller treats as "do nothing this time"), `saveInstallDate(date)`, `saveLastAskDate(date)` (a failed write rejects). Keys `installDate` and `lastAskDate`, per plan §4.2 and §6.
  - A read failure must not write an install date (it would re-baseline someone who already has one); `loadAskState` therefore reports failure distinctly: it returns `null` on a read error and the caller stops.
  - Tests in `tests/ask-state.test.ts` with `vi.mock("wxt/browser")`, as `store.test.ts` does: reads the two keys, a read error is `null`, writes use the right keys, a write error rejects.
  - **Done when:** `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

- [x] **3. Support and feedback section in Settings.**
  - `settings-panel.ts`: a section with two links built with DOM APIs, `target="_blank"`, `rel="noopener noreferrer"`, placed between Fact and About, reading `supportUrl` and `feedbackUrl` and the labels from `en.support`.
  - **Done when:** `pnpm typecheck` and `pnpm lint` pass; the section is visible in the browser evidence (step 6).

- [x] **4. The ask card and its lazy wiring.**
  - `src/ui/ask-card.ts` exports `maybeShowAsk({ now, settings, parent })`. Order: `loadAskState` (null: stop); `askTiming`; on `reset` write today to the missing or invalid key(s) and stop; on `wait` stop; on `due` run `decideAsk` (a `null` result stops) with an `idsFor` that loads the year file for that date and calls `resolveFestivals` with the person's sets, source and offset (a missing year file or a failure gives no ids); on a message, write `lastAskDate` and only then render. Every failure path ends quietly: the page must never throw or log because of the card.
  - The card is an `<aside>` with `aria-label`, the message as text, an `<a>` (the action text, `target="_blank"`, `rel="noopener noreferrer"`) and a `<button type="button">` (Dismiss, accessible name from `en.support`) that removes the card. Built with `textContent`, never `innerHTML`. It does not take focus. It is appended inside `#app` after `#festivals`, in the normal flow, so it cannot cover the dates.
  - `ask-card.css` (lazy, imported by `ask-card.ts`): uses `--bg`, `--fg`, `--muted`, a visible focus ring, a Dismiss target of at least 2.75rem like the gear, and wraps at 200% text zoom.
  - `main.ts`: after the first render and the sync reconcile, `requestIdleCallback(() => import("../../src/ui/ask-card.ts").then((m) => m.maybeShowAsk(...)).catch(() => {}))`, once per page load, wrapped in a `requestAnimationFrame` so it starts after the first frame (added after evidence showed idle time can come before the first paint). No `setTimeout` fallback: Chrome, Edge and Firefox all have `requestIdleCallback`. Nothing from the card is imported statically.
  - **Done when:** `pnpm check` passes (typecheck, lint, test, calendar check, both builds, size budgets, manifest check); the build output has a separate card chunk and the initial JS grew by only the idle scheduling lines.

- [x] **5. Self-review.**
  - Re-read the diff against this spec and `coding-standards.md`: no `innerHTML`, no unused code, comments only for the why, no em dashes, strings only in `en.ts`.
  - **Done when:** `pnpm check` passes once more.

- [x] **6. Browser evidence on Chrome and Firefox.**
  - On `.output/chrome-mv3` and `.output/firefox-mv3`, the same checks on each (recipes in project memory, scripts kept in the scratchpad), seeding `storage.local` and `storage.sync` from the page:
    1. First open with nothing stored: no card, `installDate` is written as today.
    2. `installDate` 13 days ago: no card. 15 days ago, with only the cultural set on (no celebration within 3 days of today): the card appears below the dates, `lastAskDate` is written, and a reload shows no card.
    3. Same, with all four sets on: today is 3 days before Dussehra (2026-10-20), so the card waits. If the date has moved on, record which festival decided the result instead.
    4. `lastAskDate` 29 days ago: no card; 31 days ago: card.
    5. Dismiss removes the card with one click, by mouse and by keyboard (Tab to it, Enter), and the page keeps working; the card never overlaps the dates in `list`, `centered` and `compact` styles, and at narrow width and 200% zoom.
    6. Garbage `installDate` is rewritten and shows no card.
    7. A `storage.local` write failure (stub `set` to reject before load) shows no card and no console error.
    8. Settings shows the Support and feedback section with both links opening in a new tab with `noopener`.
    9. The card chunk is not requested until the idle callback runs; no console errors; first paint timeline unchanged within noise.
  - **Done when:** each case is recorded per browser as observed or not run, with screenshot paths for the card on `chitta/list`, on `raat/centered`, and at narrow width.

- [x] **7. Decision log.**
  - One line in `blueprint/project-plan.md` §11 (install date rule, 30-day month, write-at-show, bad dates reset, 3-day festival window, quiet days, fixed greetings, placeholder URLs, no opt-out), and a §10 open item for the Patreon URL next to the feedback form item. The plan hash changes, so re-run the overview behaviour and record it.
  - **Done when:** `pnpm check` passes once more.

## Files / areas

- `src/support/links.ts`, `ask.ts`, `state.ts` (new)
- `src/ui/ask-card.ts`, `ask-card.css` (new), `src/ui/settings-panel.ts`
- `src/strings/en.ts`
- `entrypoints/newtab/main.ts`
- `tests/ask.test.ts`, `tests/ask-state.test.ts` (new)
- `blueprint/project-plan.md` (§10, §11), `blueprint/context/project-overview.md` (regenerated)
- Unchanged on purpose: `src/settings/*` (no schema change), `src/calendars/*`, `src/festivals/*`, `src/themes/*`, `index.html`, `theme-boot.ts`, `critical.css`, `wxt.config.ts`.

## Data / contracts

```ts
// src/support/ask.ts
export type AskTiming = "reset" | "wait" | "due";
export function askTiming(today: string, installDate: unknown, lastAskDate: unknown): AskTiming;
export const quietDays: readonly string[]; // festival ids: shaheediGuruArjan, shaheediGuruTegBahadur, ashura
export interface AskMessage { text: string; action: string }
export function shouldAskToday(todayIds: readonly string[], upcomingIds: readonly string[]): boolean;
export function chooseMessage(todayIds: readonly string[], now: Date): AskMessage;
export function decideAsk(
  now: Date,
  idsFor: (date: Date) => Promise<readonly string[]>,
): Promise<AskMessage | null>;

// src/support/state.ts
export function loadAskState(): Promise<{ installDate?: unknown; lastAskDate?: unknown } | null>;
export function saveInstallDate(date: string): Promise<void>;
export function saveLastAskDate(date: string): Promise<void>;

// src/ui/ask-card.ts
export function maybeShowAsk(options: { now: Date; settings: Settings; parent: HTMLElement }): Promise<void>;
```

- `storage.local` keys `installDate` and `lastAskDate`, each a local `YYYY-MM-DD` string, written only by this feature. They are never synced (`storage.sync` holds settings only) and never leave the browser.
- Stored values are untrusted: `askTiming` takes `unknown` and accepts only a real calendar date in that exact format.
- Not part of the `Settings` schema, so no `schemaVersion` bump or migration.

## Testing

`pnpm test` is configured, so logic ships with tests: the timing rules, the festival-moment matrix, quiet days, message choice and `decideAsk` (step 1), and the `storage.local` helpers (step 2). Not unit-tested, per coding-standards: the card, the Settings section, the CSS and the idle wiring, which ride on `pnpm check` and the browser evidence in step 6. No browser test runner is declared, so no automated browser evidence is claimed. Evidence that depends on today's date (the Dussehra wait) is recorded with the date it was run.

## Notes for the AI

- First paint is untouched: `main.ts` may only add the idle scheduling and a dynamic `import()`; nothing from `src/ui/ask-card.*` or `src/support/*` may be imported statically by `main.ts` or `theme-boot.ts`.
- The card must never block, delay or cover anything, never take focus, and never log or throw. When anything about storage or the festival lookup fails, show nothing.
- Never use `innerHTML`. Strings go in `src/strings/en.ts`. No em dashes (U+2014), en dashes or the ellipsis character in code, comments or docs. Use the plain arrow `→` only inside the plan's message text.
- Do not add a setting for the ask, a dismissal counter, analytics, a dependency or a permission. Do not invent a Patreon or form URL beyond the two placeholders above.
- Commits carry no AI attribution (AGENTS.md); checkpoint commits are disabled anyway.
- If a size budget is at risk, stop and report rather than dropping a requirement.

## Open questions

- The real Patreon URL and the feedback form URL are still to be created (plan §10); the two placeholders must be replaced before the first store upload.
- Whether Ramadan's start should count as an ask moment. It does today (only the three quiet days are excluded); say so in the review if you want it quiet too.


## Build record

**Evidence (2026-10-17), same scenarios on both builds.** Scripts are throwaway, in the session scratchpad (`chrome.mjs` over CDP, `firefox.mjs` over Marionette, shared `scenarios.mjs`). Screenshots: `scratchpad/shots/{chrome,firefox}-{chitta-list,raat-centered,sarson-compact,narrow-chitta-list,zoom200-phulkari-centered,settings-support}.png`.

| Case | Chrome 155 (`chrome-mv3`) | Firefox (`firefox-mv3`) |
|---|---|---|
| 1 first open stores `installDate`, no card | observed | observed |
| 2 install 13 days: none; 15 days, cultural only: card below dates, `lastAskDate` written, link `_blank` + `noopener`, accessible name, reload shows none | observed | observed |
| 3 all four sets on 2026-10-17: waits (Dussehra 2026-10-20 is 3 days ahead) | observed | observed |
| 4 last ask 29 days: none; 31 days: card | observed | observed |
| 5 dismiss by mouse and by keyboard (Tab, Tab, Enter), 44 px target | observed | observed |
| 6 layout in list, centered, compact, 360 px, 640 px: card below dates, no horizontal scroll | observed | observed (narrowest window Firefox allows was 500 px, not 360) |
| 7 garbage `installDate`, impossible `lastAskDate`, future `installDate` | observed | observed |
| 8 `storage.local.set` rejecting: stub hit, no card, no throw, no `lastAskDate` | observed (stub injected into the loaded page, then `maybeShowAsk` called) | observed (same method) |
| 9 Settings section between Fact and About, two `_blank` + `noopener` links | observed | observed |
| 10 card chunk requested after `load`, panel chunk not requested | observed by CDP network log: request 14 to 20 ms after `load`, within 3 to 4 ms of the FCP stamp (Chrome stamps FCP at presentation, so "after the frame" cannot be resolved finer) | observed on a copy of the build with a timeline script in `<head>` (only that script differs): dates added 64 ms, FCP 70 ms, card chunk requested 75 ms, card inserted 91 ms; panel CSS never loaded |
| 11 no console errors or exceptions | observed, collector probe confirmed first | observed, probe confirmed first; Firefox's own UI prints `Hydration completed but contains mismatches.` at headless startup (also with no scenarios run, and not in our code), excluded |

Not observed: a real mouse or keyboard session on a headed browser, Edge itself (Chromium build only), and any date other than 2026-10-17 for the festival wait (the other festival and quiet-day rules are covered by unit tests, not the browser).

**Deviations from the spec text:** no `setTimeout` fallback (see step 4); the card's strings add a few hundred bytes to the first-paint chunk because `en.ts` is one object that `main.ts` already imports.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":18918,"specSha256":"83bad61d6327bf5c44be5123dbf9923f0f9ecde476f80a3eb9f2311b7728b158","branch":"refs/heads/feature/support-and-feedback","head":"a7c7f97a717cb1294b74ece580d8b88a42ff400d","baseRef":"refs/heads/main","baseCommit":"a7c7f97a717cb1294b74ece580d8b88a42ff400d","sourceTree":"b01873ff120061d1ba62a71b63afa43d747ce77d","landing":"local-merge","absentOptional":[]} -->


## Try it now

1. Run `pnpm build`, load `.output/chrome-mv3` unpacked (or `.output/firefox-mv3` through `about:debugging`), and open a new tab. Expected: the dates show and there is no card, because the install is new.
2. Open DevTools on that tab and run `chrome.storage.local.set({ installDate: "2026-09-01" })` (`browser.storage.local.set(...)` in Firefox), then reload. Expected: a small bordered card appears under the dates with a Support link and a × button. If a festival from your enabled sets falls on or within 3 days of today, it waits for that day instead; in that case run `chrome.storage.local.set({ installDate: "2026-09-01" })` again after the festival.
3. Reload again. Expected: no card, because the ask is written when it is shown and repeats at most every 30 days. Click the gear: the Settings sheet ends with "Support and feedback" (two links) above About.
