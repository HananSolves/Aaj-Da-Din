# Aaj Da Din

A Punjabi new-tab extension for Chrome, Edge and Firefox: today's date in the calendars Punjabis use, today's and tomorrow's festivals, a daily photo of Punjab and a daily fact.

**Open source (GPL-3.0) · No tracking · No accounts · Works offline**

Scope, versions and decisions live in [docs/PLAN.md](docs/PLAN.md). Current milestone: **v0**.

## Develop

Requires Node 22.18+ and pnpm.

```sh
pnpm install
pnpm dev            # Chrome, with reload
pnpm dev:firefox
pnpm check          # typecheck, lint, test, build both browsers, size budgets
```

Load unpacked from `.output/chrome-mv3` (Chrome/Edge) or `.output/firefox-mv3` (`about:debugging`).

## Licences

- Code: GPL-3.0 ([LICENSE](LICENSE))
- Facts and CSV metadata in `content/`: CC0 1.0 ([content/LICENSE](content/LICENSE)). This does not cover the photo files.
- Photos: each photo's own licence, credited on screen and in `content/photos.csv`
