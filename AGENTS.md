# AGENTS.md

Instructions for AI coding agents working in this project. Codex, Google
Antigravity, and OpenCode read `AGENTS.md`; Claude Code reads `CLAUDE.md`, which
imports this file, so there is a single source of truth.

Claude Code, Codex, and every other AI tool must not add AI attribution to
commits or pull requests, including AI `Co-Authored-By` trailers or generated-by
signatures. Preserve genuine human attribution. See
[Commit and PR attribution](blueprint/context/ai-interaction.md#commit-and-pr-attribution)
for optional tool settings.

## What this is

**Tarikh** ("date") is a new-tab browser extension for
Chrome, Edge and Firefox (MV3, built with WXT) for people from all of South Asia
(Afghanistan, Bangladesh, Bhutan, India, Maldives, Nepal, Pakistan, Sri Lanka) and
the diaspora. It shows today's date in the calendars the person follows, today's
and tomorrow's festivals for the communities they pick, a daily photo of South Asia
and a daily fact. Pitch: fast, private, open source, no tracking, works offline.
Current milestone: **v0**.

### Non-negotiables

- Speed and size come first: no runtime dependencies without a strong reason, no
  UI framework, system fonts, lazy-load anything not needed for first paint.
  Respect the size budgets in project-plan §5.3 (enforced by `pnpm size`).
- Permissions: `storage` only. No background script, no host permissions, no
  content scripts.
- No analytics, tracking, accounts or backend. No remote code (remote JSON data
  is fine).
- Calendar correctness is tested against fixtures from each calendar's published
  almanac (SGPC jantri, panchangs, official national calendars). Every calendar is
  computed for its reference place (project-plan §3.4.6). Never "fix" a date
  without a source.
- Neutral: never political or controversial content (disputed territories, wars,
  partitions, national identity disputes, maps or borders). National days are
  opt-in and limited to each country's own official days (project-plan §3.4.5).
- Do not add features the plan lists as dropped or deferred without asking.
- Photos: Wikimedia Commons / Openverse only, licences CC0, PD, CC BY, CC BY-SA.
  Facts ship only when `status = verified`.
- UI strings live in one file (`src/strings/en.ts`). The UI is English only.

## Proportional engineering

Build for established requirements, not hypothetical scale, threats, or future
flexibility. Reuse existing code, the standard library, native platform features,
and installed dependencies before adding machinery.

- Unknown scale or extensibility defaults to the smaller reversible design. Do
  not infer enterprise, multi-tenant, hostile-user, or compliance requirements.
- Derive trust and data-integrity boundaries from actual reachability: untrusted
  input, shared persisted data, destructive operations, secrets, sensitive data.
- Ask only when an unknown materially changes behavior, architecture, persisted
  data, interoperability, a real security boundary, or cost. Otherwise choose the
  simplest repository-native implementation.
- Add an abstraction, dependency, service, configuration surface, compatibility
  layer, or security mechanism only for a current requirement.
- Simplicity never removes real trust-boundary validation, data-loss prevention,
  accessibility, explicit security requirements, configured tests, or project rules.
- Stack-specific template standards apply only when the project uses that stack.

## Commands

Package manager: pnpm (Node 22.18+). Run commands from the project root.

- Dev server: `pnpm dev` (Chrome, with reload) or `pnpm dev:firefox`
- Build: `pnpm build` (Chrome/Edge, output in `.output/chrome-mv3`) and
  `pnpm build:firefox` (`.output/firefox-mv3`)
- Package for stores: `pnpm zip`, `pnpm zip:firefox`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint` (Biome); auto-fix and format with `pnpm format`
- Test: `pnpm test` (Vitest, `tests/**/*.test.ts`); watch mode `pnpm test:watch`
- Size budgets: `pnpm size` (run after both builds; fails if a build is missing)
- Manifest permissions: `pnpm check:manifest` (run after both builds; `storage` only,
  no background, host or content scripts)
- Calendar data: `pnpm build:calendar`; `pnpm check:calendar` fails if the committed
  `data/calendar/*.json` differs from the generator output
- Verify: `pnpm check` (typecheck, lint, test, calendar data check, both builds, size
  budgets, manifest check). The GitHub workflow `.github/workflows/ci.yml` runs the
  same steps individually; keep the two in sync.

There is no dev server URL: this is a browser extension. Load it unpacked from the
build output folders above (Chrome/Edge) or via `about:debugging` (Firefox).

A unit test runner is configured, so tests are a gate for logic-bearing steps (see
`blueprint/context/coding-standards.md`). Browser tests are opt-in via
`/tests browser`; none are set up yet.

## Read these when relevant

Load only what the task touches. `blueprint/project-plan.md` is the source of truth for
scope and decisions (it wins over code until deliberately changed); read the
section, not the whole file. `blueprint/context/project-overview.md` is the
generated summary of it (re-run `/overview` after plan changes).

| Task | Read |
|---|---|
| Writing or changing any code | `blueprint/context/coding-standards.md` |
| UI, styling, themes, onboarding, settings | coding-standards (Styling) and project-plan §7 |
| Calendars, dates, festivals, data pipeline | project-plan §3.4 and §4.1 |
| Photos and facts content | project-plan §4.3 to §4.5 |
| Manifest, permissions, size budgets, performance, browser differences | project-plan §5 and §4.2, and coding-standards (Performance, Data and Storage) |
| Donation or money copy | project-plan §6 |
| Versions, v0 steps, V1 scope, dropped items | project-plan §3 |
| Tests | coding-standards (Testing) |
| Commits, branches, how to talk and format output | `blueprint/context/ai-interaction.md` |
| The one feature/fix being built | `blueprint/context/current-feature.md` |
| Running or changing the Blueprint workflow (config, skills, automation, checks) | `blueprint/context/workflow.md` |
| Overview of the project plans | `blueprint/context/project-overview.md` |

## Dashboard activity

Tracked Blueprint commands record progress in `blueprint/.state/run.json` (generated,
Git-ignored). Never create or edit it directly. When `blueprint/.state/` exists, make
the first action of a tracked command a call to the first helper that exists:

```text
node .agents/skills/doctor/scripts/run-state.mjs <action> <options>
node .claude/skills/doctor/scripts/run-state.mjs <action> <options>
```

- `start --command <skill> --summary <text> --boundary <read-only|reviewed|local-only>`
- `update` at milestones or blockers (`--status blocked --resume <exact-command>`)
- `finish --status ready|completed --summary <text>`

If the helper is missing or fails, report the warning and continue the workflow. Never
put secrets, raw logs, or user content in the state. The full schema and the list of
tracked commands are in `blueprint/context/workflow.md`.
