# Coding Standards

> Tuned to this project's stack by `/onboard`. Product rules and size budgets live
> in `AGENTS.md` (Non-negotiables) and `blueprint/project-plan.md`. Edit this file when a real
> convention changes.

## Stack

- Browser extension (MV3) for Chrome, Edge and Firefox, built with WXT
- TypeScript, vanilla DOM, no UI framework, zero runtime dependencies
- pnpm, Biome (lint + format), Vitest (unit tests)
- Build commands and the Verify command are in `AGENTS.md`

## TypeScript

- Strict mode is on, plus `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters` and `erasableSyntaxOnly` (no enums, namespaces or
  parameter properties; use string-literal unions and plain objects)
- No `any` types - use proper typing or `unknown`
- Define types for settings, content records and calendar results
- Use type inference where obvious, explicit types where helpful
- Imports may include the `.ts` extension (`allowImportingTsExtensions`)

## Formatting and linting

- Biome owns formatting: 2-space indent, double quotes, 100-column lines
- Run `pnpm format` to fix, `pnpm lint` to check. Do not hand-format against Biome

## Project Structure

- `entrypoints/newtab/` - the new-tab page (HTML, `main.ts`, critical CSS, theme boot)
- `src/calendars/` - pure calendar math, one module per calendar
- `src/settings/` - settings types, defaults, `localStorage` mirror
- `src/strings/` - all user-facing strings (`en.ts`); no literals in UI code
- `src/festivals/`, `src/content/`, `src/themes/`, `src/ui/` - festival data, content
  loading, theme variables, lazy-loaded UI (settings, onboarding)
- `scripts/` - build-time tools (calendar precompute, size check), run with Node
- `data/`, `content/`, `site/` - generated calendar data, CC0 facts/CSV, hosted assets
- `tests/` - Vitest tests (`tests/*.test.ts`)

## Naming

- Files: lowercase, short (`gregorian.ts`, `en.ts`); kebab-case for multi-word names
- Functions and variables: camelCase
- Constants: camelCase for exported config objects (`defaultSettings`), SCREAMING_SNAKE_CASE
  for true primitives
- Types and interfaces: PascalCase, no prefix

## Performance (speed and size are the top priority)

- New tab loads on every open: keep first paint small and synchronous
- Lazy-load (`import()`) anything not needed for first paint
- Create `Intl.DateTimeFormat` instances once and reuse them
- Precompute calendar math at build time; ship data, not algorithms, where possible
- Check size budgets (`pnpm size`) after any change that adds code or assets
- Adding a runtime dependency needs a strong reason and an explicit user yes

## Styling

- Plain CSS with custom properties; themes are sets of CSS variables
- Inline critical CSS; system font stack only (no web fonts)
- Respect `prefers-reduced-motion` and `prefers-color-scheme`
- Keep it accessible: semantic HTML, visible focus, sufficient contrast

## Data and Storage

- Settings: `storage.sync` is the source of truth (100 KB total, 8 KB per item), with a
  `localStorage` mirror for instant paint
- Cached content goes in `storage.local`; photos in the Cache API
- Bump `Settings.schemaVersion` and add a migration when the settings shape changes
- Remote data is JSON only, never code. Treat fetched JSON as untrusted input and
  validate its shape before use
- Never add analytics, tracking, accounts or a backend

## Error Handling

- Calendar and date code is pure: return values, throw only on programmer error
- Network failures (content refresh, photo fetch) must fall back silently to bundled
  or cached content; the new tab must always render
- Never block first paint on a fetch

## Testing

Vitest is already configured (`pnpm test`, `tests/**/*.test.ts`, node environment),
so the test gate below is active for this project.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  calendar conversions, date rules, festival and daily-selection logic, settings
  migrations, content and JSON validators. These have assertable inputs and outputs
  and real edge cases (month and year boundaries, leap years, missing or malformed
  data). Calendar tests assert against SGPC jantri / panchang fixtures.
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live in `tests/`, named after the module under test (for example
  `tests/gregorian.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Use `vi.mock()` for external dependencies (extension storage, fetch) and
`vi.useFakeTimers()` or injected dates for time-dependent logic. Prefer passing the
date in as an argument so calendar functions stay pure and easy to test.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- Browser automation is separately opt-in through `/tests browser`. That setup
  reuses a compatible runner or prefers Playwright for supported projects, then
  documents the exact command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, browser chrome, or another claim the test does not observe.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, browser
  screenshots, build output, API output, or manual evidence instead.
- For this extension, manual browser evidence means loading the unpacked build
  (`.output/chrome-mv3`, or Firefox via `about:debugging`) and opening a new tab.
  Check both Chrome and Firefox builds when a change touches the manifest or
  browser APIs.
- Browser tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
