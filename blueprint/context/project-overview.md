# Aaj Da Din - Project Overview

<!-- blueprint:source-hash f0871e19678ccb2a7919b1c932a86f778fb4af29aad86b503b39089ecf662ffe -->

> A Punjabi new-tab browser extension (Chrome, Edge, Firefox): today's date in the calendars Punjabis use, today's and tomorrow's festivals, a daily photo of Punjab and a daily fact. Fast, private, open source, works offline.

_Generated from `blueprint/project-plan.md` and `blueprint/build-plan.md`. Do not hand-edit; change the plans and re-run `/overview`. Section references like "plan §4.4" point into `project-plan.md`._

## Problem

Punjabis, East and West, Sikh, Hindu and Muslim, follow several calendars at once, and a browser's new tab shows none of the Punjabi ones. Aaj Da Din replaces the new tab with today's date in those calendars, nearby festivals, a Punjab photo and a fact. The new tab opens constantly, so it must also be fast, small and trustworthy: no tracking, minimum permissions, open source.

> TODO: the plan states the product and principles but no explicit problem statement; this paragraph is a distillation. Confirm or sharpen it in plan §1.

Guiding principles, in priority order: (1) fast and small, (2) private and trustworthy, (3) correct (a wrong date or fact costs more trust than a missing feature), (4) neutral and inclusive (East/West Punjab, all three faiths, no politics), (5) works offline from bundled data.

## Users

- **Punjabi diaspora on desktop** (Canada, UK, US, Australia, Gulf), ages ~25-55, from India and Pakistan Punjab. Primary audience.
- **Urban Punjab users** and **community institutions**.
- Browsers: Chrome, Edge, Firefox. Other Chromium browsers (Brave, Vivaldi) install from the Chrome Web Store. Not supported: Opera (blocks new-tab override), Safari, Samsung Internet.
- No accounts or user tiers.

## Usage model

- Client-side extension that renders fully offline from bundled data. Network use is limited to fetching public static JSON and photos from Cloudflare Pages after first paint.
- Collects nothing: no analytics, telemetry, accounts or backend; no server-side user data.
- Non-requirements: no accounts, no backend, no terms-and-conditions screen or accept step. No expected user count is set; the sponsor tile waits for real numbers (~10k weekly users).

## Features

Current milestone: **v0**. Scaffold, CI, size check and the Gregorian formatter already exist and are not features. Order follows `build-plan.md`; the headline feature is correct multi-calendar dates (items 1-4).

**v0 - internal prototype**

1. **Nanakshahi calendar** - original 2003 fixed-month arithmetic.
2. **Hijri calendar** - umm al-Qura via `Intl`, user offset -1/0/+1.
3. **Desi and Bikrami data build** - `scripts/build-calendar.ts` (astronomy-engine, dev-only) emits per-year JSON for 2026-2036, checked against the SGPC jantri and a panchang.
4. **Desi and Bikrami lookups** - read the current year's file (next year's in late December); resolves the sangrand-day and adhik-month questions.
5. **Festival resolver (cultural + Sikh)** - festival rules over the calendar lookups, and "Today:" / "Tomorrow:" lines using SGPC dates.
6. **Bare new tab** - five calendars, festival lines, one theme, solid background, instant paint from the settings mirror.
7. **Bundled photos and placeholder fact** - 2-3 photos with credit, one fact, daily selection, v0 sign-off checks.

**V1 - public launch**

8. **Settings store** - `storage.sync`, `schemaVersion`, migrations, `localStorage` mirror.
9. **Themes and date styles** - 6-8 themes, 3 date styles, solid-colour mode.
10. **Hindu and Muslim sets** - joined lines ("Today: Diwali · Bandi Chhor Divas"), "expected" labels for Muslim dates, Gurpurab source switch.
11. **Settings panel** - lazy-loaded.
12. **Onboarding** - three skippable screens; default sets follow chosen calendars.
13. **Content pipeline** - CSVs, build and optimise scripts, verified-only filter, post-paint remote refresh.
14. **Daily photo** - 60 photos, 6-8 bundled, tomorrow's prefetched.
15. **Daily fact** - 120 verified facts.
16. **Support and feedback** - Patreon ask card, Support link, Report a mistake link.
17. **Accessibility pass** - WCAG 2.2 AA.
18. **Content site and privacy policy** - Cloudflare Pages.
19. **Store release 1.0.0** - listings for the three stores.

**v0 is done when:** loads unpacked in Chrome, Edge and Firefox with no console errors; calendar tests pass against verified 2026-2027 fixtures; first paint under 100 ms with no wrong-theme flash; size budgets enforced in CI; fully works offline.

**Explicitly not in V1:** countdown, sponsor tile, analytics, Roman Punjabi/Gurmukhi/Shahmukhi, Patreon Shop items, web fonts, search box, Rust/WASM, Opera. Deferred: V1.x (more content, tithi line, countdown, custom yearly events, Shop items), V2 (Punjabi scripts, sponsor tile), V3 (motion, music, Opera revisit). Never: analytics, accounts, a backend, donation popups, remote code, Pexels/Pixabay/Unsplash photos. Do not add deferred or dropped items without asking.

### Calendar and festival rules

| Calendar | Source at runtime | For |
|---|---|---|
| Gregorian | `Intl` | everyone |
| Desi (solar) | generated table | sangrand; both sides of Punjab |
| Bikrami (lunisolar, Purnimanta) | generated table | Punjabi Hindus, festival dating |
| Nanakshahi (2003) | arithmetic | Sikhs |
| Hijri | `Intl` umalqura + offset | Punjabi Muslims |

- **Nanakshahi months (fixed):** Chet 14 Mar/31, Vaisakh 14 Apr/31, Jeth 15 May/31, Harh 15 Jun/31, Sawan 16 Jul/31, Bhadon 16 Aug/30, Assu 15 Sep/30, Katak 15 Oct/30, Maghar 14 Nov/30, Poh 14 Dec/30, Magh 13 Jan/30, Phagun 12 Feb/30 (31 in Gregorian leap years). NS year = Gregorian − 1468 on/after 14 March, − 1469 before.
- **Desi (solar):** a sankranti belongs to the sunrise-to-sunrise day (Amritsar / IST) that contains it, and the sangrand day is day 1 of the new month. Shown as day and month only (`25 Assu`), no year.
- **Bikrami (lunisolar, Purnimanta):** Punjabi month names, then paksha and day, then Samvat (`Assu Vadi 1, Samvat 2083`). Tithi is read at sunrise: 1-15 is Sudi, 16-30 is Vadi (day = tithi - 15). An adhik month takes an `Adhik` prefix (`Adhik Jeth Sudi 3`). Samvat = Gregorian + 57 from Chaitra Shukla 1 (the day Pratipada begins, 19 March 2026), + 56 before; in an adhik-Chaitra year (2029) it turns in the nija month, as Drik Panchang dates it.
- **Date rules:** published (jantri/IST) date used wherever the user is; day changes at local midnight; no geolocation; Hijri shows the civil-day date, not sunset-based.
- **Festival sets:** Punjabi cultural (always on: Lohri, Maghi, Basant Panchami, Vaisakhi, Teeyan); Sikh (Prakash/Shaheedi Purabs, Khalsa Sajna Divas, Bandi Chhor Divas, Hola Mohalla, Gurgaddi days, Shaheedi Jor Mela); Hindu (Maha Shivratri, Holi, Ram Navami, Raksha Bandhan, Janmashtami, Dussehra, Karva Chauth, Diwali); Muslim (Ramadan begins, Eid al-Fitr, Eid al-Adha, Islamic New Year, Ashura; labelled "expected"). Neutrality: celebrated or observed days only, no political anniversaries. Gurpurab dates default to the SGPC jantri, switchable to Original Nanakshahi, source labelled.
- **Festival dating:** each festival is a rule over the lookups: a fixed date, a sangrand (Lohri is the day before Maghi), a Bikrami tithi in the nija month, or a list of sourced dates where the sunrise tithi cannot give the SGPC date (Bandi Chhor Divas, so it shows only for sourced years). A tithi at two sunrises counts on the first day, and one at no sunrise on the day it begins. A sweep over 2026-2036 guards the gaps.
- **Defaults from onboarding calendars:** Nanakshahi -> Sikh, Bikrami -> Hindu, Hijri -> Muslim. Skipping onboarding applies Gregorian + Desi + Nanakshahi, default theme, photo on.
- **Correctness:** tested against SGPC jantri / panchang fixtures. Never "fix" a date without a source.

## Data model

No backend or database: bundled static data, a remote copy of it, and the user's settings in their browser.

### Settings (`storage.sync`, mirrored to `localStorage` key `add:settings`)

Existing in `src/settings/types.ts` (v1): 

- `schemaVersion` (1) - bump on shape change and add a migration in `migrations.ts`
- `calendars` (`CalendarId[]`) - enabled calendars in display order; `CalendarId` = `gregorian | desi | bikrami | nanakshahi | hijri`
- `theme` (string) - theme id
- `hijriOffset` (-1 | 0 | 1) - labelled "Match your local mosque"

Planned from plan §7.3 (exact names decided when built, items 8-12): date style, photo-or-solid mode, enabled festival sets, Gurpurab source (`sgpc | nanakshahi`), show Today/Tomorrow lines, show fact.

> Locked: `storage.sync` holds settings only (100 KB total, 8 KB per item). Once published, users' synced settings outlive releases, so `schemaVersion` and its migration path must keep working.

### Local state (`storage.local`, 10 MB)

- Content cache (manifest and content JSON, refreshed after paint if over 24 h old)
- `installDate` - for the first donation ask (at least 14 days later)
- `lastAskDate` - at most one ask per month
- Photos are cached with the Cache API (needs no permission)

### CalendarYear (`data/calendar/<year>.json`, generated, 2026-2036)

One file per year, bundled and also published at `/data/calendar/<year>.json`. Holds sangrand dates, tithis and Purnimanta month starts (Amritsar / IST). A date is looked up in the file for its own Gregorian year, so only the current year is loaded, plus next year's when Tomorrow falls on 1 January.

- `year` (number)
- `sangrand` (13 sorted ISO dates) - index 0 is the previous December's sangrand (starts Poh), indices 1-12 are this year's; entry `i` starts desi month `((9 + i) % 12) + 1`, Chet = 1
- `tithi` (number[], 1-30, one per day of the year) - tithi at sunrise
- `months` (`[startISO, monthIndex, adhik 0|1][]`, 13-15 entries) - `monthIndex` 0 = Chaitra; the first entry is the month in progress on 1 January

> Locked: this shape is read by `src/calendars/desi.ts` and `bikrami.ts`, and is also published remotely, so a change needs both updated together. The loader resolves `undefined` for a year with no file; the page must still render.

### Photo (`content/photos.csv`; source of truth)

`id`, `title`, `location`, `author`, `author_url`, `source_url`, `license`, `license_url`, `retrieved_on`, `archive_url`, `changes`, `season_month`, `bundled`.

- Licences allowed: CC0, PD, CC BY, CC BY-SA only; sources: Wikimedia Commons and Openverse only (confirm the licence on the original source page).
- `archive_url` is a web.archive.org snapshot, the proof of licence. `changes` e.g. "resized, converted to AVIF".
- Originals in gitignored `photos-src/<id>.<ext>` (edited ones in `photos-src/edited/`); `scripts/optimise-photos.ts` re-fetches missing originals. Output: AVIF 1920 px (~120-200 KB) and 2560 px (~200-300 KB), hashed names, immutable cache.
- Credit line bottom-right: `Title · Author · CC BY-SA 4.0`, linked to the source.

### Fact (`content/facts.csv`; CC0)

`id`, `category`, `text_en`, `source_1`, `source_2`, `region`, `festival_tag`, `month_tag`, `status` (`draft | verified`), `added_on`, `verified_on`, `notes`.

- **Only `status = verified` ships**; the build script filters on it. 120-220 characters, 1-2 sentences, two reliable sources (Wikipedia is not one). Balanced across East Punjab, West Punjab and diaspora. Avoid religious-doctrine comparison, Partition blame, 1984, separatism, caste, India-Pakistan politics, living politicians, unverifiable "first/biggest/oldest".

### Daily selection (same for everyone, no server)

- `dayNumber` = days since 2026-01-01 (local date).
- Fact: one tagged for today's festival or desi month if any, else `facts[dayNumber % facts.length]`.
- Photo: pool = photos tagged with the current desi month plus untagged, then `pool[dayNumber % pool.length]`.

### Hosted content (`site/`, Cloudflare Pages)

`/data/manifest.json` (short cache), `/data/calendar/<year>.json`, `/data/facts.json`, `/data/photos.json`, `/photos/<hash>-1920.avif` and `-2560.avif` (immutable). `Access-Control-Allow-Origin: *` on `/data/*`. If the network fails the extension falls back to bundled data and photos.

## Tech stack

- **TypeScript** (strict) - compiles away, no runtime cost
- **WXT** - per-browser manifests, store zips, dev reload; MV3 forced on every browser (WXT defaults Firefox to MV2)
- **Vanilla DOM** - no UI framework, system font stack, critical CSS inlined, themes as CSS custom properties
- **Biome** (lint + format), **Vitest** (`tests/**/*.test.ts`), **astronomy-engine** and an image optimiser (sharp or avifenc) - dev-only
- **pnpm**, Node 22.18+; **GitHub Actions** runs typecheck, lint, test, build, size
- **Runtime dependencies: zero.** Add one only when truly needed.
- **Permissions: `storage` only.** No background script, no host permissions, no content scripts, no `alarms`. First run is detected in the new-tab page (no settings -> onboarding).
- Firefox manifest: `gecko.id`, `data_collection_permissions: { required: ["none"] }`, `strict_min_version: "140.0"`.
- Performance: instant paint from the `localStorage` mirror; onboarding, settings and the donation card are `import()`-lazy; reuse one `Intl.DateTimeFormat` per format; theme colour paints first, then the photo fades in (no fade under `prefers-reduced-motion`); pick 1920 or 2560 px by screen; prefetch tomorrow's photo into the Cache API; refresh content after paint via `requestIdleCallback` when the cache is over 24 h old.
- **Size budgets (`pnpm size`, CI):** initial JS < 25 KB gzip, CSS < 8 KB gzip, package excluding photos < 100 KB, bundled photos ~1 MB, current-year calendar data a few KB.
- Layout: `entrypoints/newtab/`, `src/{calendars,festivals,content,settings,ui,themes,strings}`, `data/calendar/`, `content/`, `scripts/`, `public/`, `site/`, `tests/`. All UI strings in `src/strings/en.ts` (English only in V1).
- Licences: code GPL-3.0; facts and CSV metadata CC0 (`content/LICENSE`, not the photo files); photos keep their own licence; name and logo not licensed.

## Monetization

V1: **Patreon monthly membership only** (confirm Pakistan bank payout at signup). No sponsor tile, Shop items or Stripe. Ask rules:

- Never a popup, modal or anything that blocks or delays the page
- First ask at least 14 days after install; at most once a month
- Small inline card, closed with one click, never covering the date
- Prefer festival moments ("Vaisakhi mubarak! Aaj Da Din is made by one person. Support it →")
- No "I already support" button; a quiet permanent "Support" link in Settings
- Tone: warm, short, never guilt-tripping

## UI/UX

Single page: the new tab (`entrypoints/newtab/`). Everything else is a lazy panel on it.

- **New tab** - date in the enabled calendars, Today/Tomorrow festival lines, daily photo with credit (bottom-right), daily fact, gradient behind text over photos
- **Onboarding** (when no settings exist) - 1) welcome + calendar choice with live preview, 2) look (theme, date style, photo or solid) with live preview, 3) done: "You can change anything later in Settings ⚙". Skippable. Must show value immediately (Chrome/Edge show a "Change back?" prompt on the first new tab).
- **Settings** - calendars on/off and order; look; festivals (sets, Gurpurab source, Hijri offset, Today/Tomorrow lines); fact on/off; Report a mistake / Suggest a feature (external form, URL placeholder); Support (Patreon); About (version, GPL-3.0 repo link, privacy policy, licences and photo credits, dates disclaimer)
- **Look** - 6-8 themes (candidates: Sarson, Phulkari, Mitti, Neela, Raat, Chitta), 3 date styles, solid-colour mode; `prefers-color-scheme` sets the default theme
- **Accessibility (V1 requirement)** - WCAG 2.2 AA contrast on every theme; `<time datetime>` and full-text `aria-label`s on dates; keyboard-operable onboarding and settings with visible focus; `prefers-reduced-motion`; holds at 200% zoom; never colour alone; `lang` attributes set now for V2

## Deployment

- **Extension:** `pnpm build` -> `.output/chrome-mv3` (Chrome/Edge); `pnpm build:firefox` -> `.output/firefox-mv3`; store zips via `pnpm zip` / `pnpm zip:firefox`. `pnpm check` runs everything including `pnpm size`.
- **Site:** `site/` deploys to Cloudflare Pages (free, static; no env vars, database, workers or cron). `_headers`: CORS `*` on `/data/*`, long `immutable` cache on `/photos/*`. Also hosts `privacy.html` and optionally a landing page. Domain: TODO.
- **Versions:** `package.json` `version` is the single source (`0.0.x` prototype, `1.0.0` first release, then SemVer). `CHANGELOG.md` (Keep a Changelog) starts at `1.0.0`.
- **Stores:** Chrome Web Store ($5 once; privacy practices tab, single-purpose statement, `storage` justification "Saves your display preferences"), Edge Add-ons (free, same assets), Firefox AMO (free; `gecko.id`, upload the source zip). Shared: icons 16/32/48/128, 1280x800 screenshots, 440x280 Chrome promo tile, privacy policy URL, "Open source (GPL-3.0) · No tracking · No accounts · Works offline" with repo link.
- **Release automation** only after the first manual submissions.
- **Legal:** privacy policy page (never a gate) must state settings stay in the browser (browser sync if on), content comes from Cloudflare (which may process IPs), the feedback form is third-party and optional, and photos are credited. Dates are indicative (confirm with the SGPC jantri or local mosque). Photo takedown contact on the site. Consider a lawyer review of the privacy page before launch.

## Open questions

Plan §10 items (resolve in the plans, then re-run `/overview`):

- [ ] **SGPC jantri 2026-2027** - collect as test fixtures. Feature 5's fixtures come from secondary reproductions of the Nanakshahi 558 jantri (to 14 Mar 2027), so a copy of the jantri itself, and jantri 559, are still to be read.
- [ ] **Muslim set** - include Mawlid / Eid Milad-un-Nabi and Shab-e-Barat?
- [ ] **Clock** - should the page also show the time?
- [ ] **Uninstall feedback form** via `runtime.setUninstallURL` - yes or no?
- [ ] **Patreon** - confirm Pakistan bank payout.
- [ ] **Feedback form** - create it (Tally or Google Forms) and add the URL.
- [ ] **Firefox add-on ID** - `wxt.config.ts` has placeholder `aajdadin@example.org`; replace with an address on a domain we own or a `{GUID}` before the first AMO upload, never a personal email (permanent once published).
- [ ] **Public contact address** - needed on the privacy page, or is the feedback form enough? Use a dedicated address if so.
- [ ] **Theme names and palettes** - the candidate names above are not final.

Found while generating this overview:

- **No explicit problem statement** in `project-plan.md` §1 (see TODO under Problem).
- **Settings code vs plan** - `Settings` in code has four fields; plan §7.3 needs several more. Feature 6 already reads the mirror, but the Settings store is item 8, so item 6 will use a minimal settings shape until then.
- **Oversized items** - build-plan items 7 (photos + fact + sign-off checks) and 13 (content pipeline: CSVs, two scripts, filter, remote refresh) bundle several concerns; `/feature` may propose splitting them.
- **Layout vs code** - plan §5.5 names `src/festivals/resolve.ts`; feature 5 built `rules.ts`, `festivals.ts` and `lines.ts`.
- **Domain** - no Cloudflare domain is named yet (needed for content URLs, privacy page and the Firefox ID).
