# Tarikh - Project Overview

<!-- blueprint:source-hash d289030537e487987441a6c57a7c5bdf24b073ecd87a3f2cead023bf9bcb974f -->

> A new-tab browser extension (Chrome, Edge, Firefox) for all of South Asia and its diaspora: today's date in the calendars a person follows, festivals for their communities, a daily photo of South Asia and a daily fact. Fast, private, open source, works offline.

_Generated from `blueprint/project-plan.md` and `blueprint/build-plan.md`. Do not hand-edit; change the plans and re-run `/overview`. "Plan §x" points into `project-plan.md`._

## Problem

People from Afghanistan, Bangladesh, Bhutan, India, the Maldives, Nepal, Pakistan and Sri Lanka, at home and abroad, follow several calendars at once (national or regional, religious, Gregorian), and a browser's new tab shows none of them. Tarikh ("date") shows each person their own calendars and festivals. The new tab opens constantly, so it must be fast, small and trustworthy.

Principles, in priority order: (1) fast and small, (2) private and trustworthy, (3) correct, every date has a published source, (4) neutral and inclusive across countries, religions and communities, never political or controversial (no disputed territories including Kashmir, wars, partitions, identity disputes, maps or borders), (5) works offline from bundled data.

## Users

- **South Asians and the diaspora** on desktop (Gulf, UK, Canada, US, Australia, Europe and beyond), ages ~25-55; also users in the region and community institutions.
- They choose **communities** (cultural and linguistic, cross-border), never a country or religion; a Punjabi can be Indian or Pakistani.
- Browsers: Chrome, Edge, Firefox (other Chromium browsers via the Chrome Web Store). Not Opera, Safari or Samsung Internet. No accounts or tiers.

## Usage model

- Client-side extension, fully offline from bundled data; network use is public static JSON and photos from Cloudflare Pages, after first paint.
- Collects nothing: no analytics, telemetry, accounts, backend or geolocation. Community choices stay in browser settings.
- Non-requirements: accounts, backend, terms screen or accept step. No user count is set; the sponsor tile waits for ~10k weekly users.

## Features

Milestone: **v0**. Line order in `build-plan.md` is build order; numbers are stable IDs. Headline: correct dates in many calendars.

**v0 (Punjabi calendars, the engine proof):** 1 Nanakshahi ✓ · 2 Hijri ✓ · 3 Desi and Bikrami data build ✓ · 4 Desi and Bikrami lookups ✓ · 5 Festival resolver (cultural + Sikh) ✓ · 6 Bare new tab ✓ · **7 Bundled photos and placeholder fact** with v0 sign-off (three browsers, offline, first paint < 100 ms, budgets in CI).

**V1 done so far:** 8 Settings store ✓ · 9 Themes and date styles ✓ · 10 Hindu and Muslim sets ✓ · 11 Settings panel ✓ · 16 Support and feedback ✓ · 17 Accessibility pass ✓.

**South Asia expansion (next, in order):**

20. **Rename to Tarikh** - names, title, strings, storage key prefix, Firefox ID placeholder, README.
21. **Calendar registry and per-calendar data** - reference place and rules per calendar, one JSON per calendar per year, load only enabled calendars, package budget 300 KB, Desi becomes "Punjabi solar".
22. **Intl and arithmetic calendars** - Solar Hijri (Afghan month names), Indian National (Saka), Bangla (revised).
23. **Hindu lunisolar variants** - Vikram Samvat Purnimanta (Hindi names), VS Amanta Kartikadi (Gujarati), Shaka Amanta (Marathi, Kannada, Telugu, Konkani).
24. **Tamil and Malayalam** solar calendars.
25. **Eastern solar calendars** - Bengali (traditional), Odia, Assamese.
26. **Nepali calendars** - Bikram Sambat, Nepal Sambat.
27. **Sinhala calendar** - months, Poya days, Buddhist Era.
28. **Bhutanese lunar calendar** - blocked until a verifiable source is found.
29. **Parsi calendars** - Shahenshahi, Kadmi, Fasli.
30. **Communities** - list, suggested calendars and sets, settings field, Settings section.
31. **Religion sets** - add Christian, Buddhist, Jain, Zoroastrian.
32-34. **Community festival sets** - north, west and Afghanistan; south and Sri Lanka; east, Nepal and Bhutan.
35. **National days** - opt-in per country, neutral.

**Launch:** 12 Onboarding (community picker, live preview) · 13 Content pipeline · 14 Daily photo (60, balanced across the eight countries) · 15 Daily fact (120 verified) · 18 Content site and privacy policy · 19 Store release 1.0.0.

**Not in V1:** countdown, sponsor tile, analytics, any UI language but English, Shop items, web fonts, search box, Rust/WASM, Opera, per-city date computation, geolocation. V1.x: more content, tithi line, countdown, custom yearly events, "prefer my communities" photos and facts, per-city dates (to reconsider in the future), Shop items. V2: sponsor tile. V3: motion, music, Opera. Never: tracking, accounts, backend, donation popups, remote code, Pexels/Pixabay/Unsplash, political content. Ask before adding deferred items.

### Calendars (plan §3.4.1)

| Calendar | Runtime source | Reference place | Status |
|---|---|---|---|
| Gregorian | `Intl` | - | done |
| Hijri (umm al-Qura, ±1) | `Intl` + offset | - | done |
| Punjabi solar (Desi) | generated | Amritsar | done |
| Nanakshahi (2003) | arithmetic | - | done |
| Bikrami (Punjabi names, Purnimanta) | generated | Amritsar | done |
| Solar Hijri; Indian National (Saka) | `Intl` (`persian`, `indian`) | - | 22 |
| Bangla (Bangladesh revised) | arithmetic | - | 22 |
| VS Purnimanta; VS Amanta Kartikadi; Shaka Amanta | generated | New Delhi; Ahmedabad; per variant | 23 |
| Tamil; Malayalam (Kollam) | generated | Chennai; Thiruvananthapuram | 24 |
| Bengali (traditional); Odia; Assamese | generated | Kolkata; Bhubaneswar; Guwahati | 25 |
| Nepali Bikram Sambat; Nepal Sambat | generated | Kathmandu | 26 |
| Sinhala | generated | Colombo | 27 |
| Bhutanese lunar | generated | Thimphu | 28 |
| Parsi (Shahenshahi, Kadmi, Fasli) | arithmetic | - | 29 |

- **Reference place rule:** each calendar is computed for the place its almanac is published for; the day changes at the user's local midnight (someone from Lahore in Sydney sees, on Sydney's 18 October, the Amritsar/Lahore entry for 18 October). No per-city computation, no geolocation. Every calendar shows the civil-day date (Hijri ignores sunset).
- `Intl` calendars use numeric parts only; month names come from `en.ts`. Month names follow each tradition's transliteration (Katak, Kartik, Aippasi).
- **Settled v0 rules:** Nanakshahi months are fixed (Chet 14 Mar/31, Vaisakh 14 Apr/31, Jeth 15 May/31, Harh 15 Jun/31, Sawan 16 Jul/31, Bhadon 16 Aug/30, Assu 15 Sep/30, Katak 15 Oct/30, Maghar 14 Nov/30, Poh 14 Dec/30, Magh 13 Jan/30, Phagun 12 Feb/30, 31 in leap years); NS = Gregorian − 1468 on/after 14 March, − 1469 before. Desi: a sankranti belongs to the sunrise-to-sunrise day (Amritsar/IST) containing it, sangrand is day 1, no year shown. Bikrami: `Assu Vadi 1, Samvat 2083`, sunrise tithi (1-15 Sudi, 16-30 Vadi), `Adhik` prefix, Samvat = Gregorian + 57 from Chaitra Shukla 1 (+ 56 before; nija month in an adhik-Chaitra year).
- **Correctness:** fixtures from each calendar's published almanac. No verifiable source means a blocker, never unverified dates.

### Communities and festivals (plan §3.4.3-§3.4.7)

- **Communities (draft, 24):** Punjabi, Sindhi, Kashmiri, Pashtun, Baloch, Afghan, Hindi-speaking north, Rajasthani, Gujarati, Marathi, Konkani, Kannada, Telugu, Tamil, Malayali, Bengali, Odia, Assamese, Nepali, Newar, Bhutanese, Sinhala, Maldivian, Parsi. Each suggests calendars and its community festival set; Gregorian always.
- **Religion sets:** Hindu, Muslim ("expected"), Sikh (SGPC default, Original Nanakshahi switch), Christian, Buddhist (per-country Vesak), Jain, Zoroastrian. Suggested from calendars (Nanakshahi → Sikh, Hindu lunisolar → Hindu, Hijri or Solar Hijri → Muslim, Sinhala or Bhutanese → Buddhist, Parsi → Zoroastrian); Christian and Jain picked directly. Religion is never asked.
- **Festival rules:** a fixed date, a sangrand (or the day before), a tithi in the nija month, a `hijri` rule on the offset date, or an explicit sourced `dates` list (works before or without a calendar's date line). A tithi at two sunrises counts on the first day, at none on the day it begins; a 2026-2036 sweep guards gaps. Hindu dates are Drik Panchang lists (New Delhi, Smarta) for 2026-2030. Five Gurpurabs carry an `original` Nanakshahi date. A festival in two sets appears once per line. Neutrality: observed days only, no political anniversaries or war days.
- **National days:** opt-in per country (off by default, never inferred), each country's own official days only, never war, victory, defence or martyrs' days; "Today: Independence Day (Pakistan)", no flags or greetings, no ask card.
- **Horizon and sourcing:** computed calendars 2026-2036; sourced lists as far as almanacs publish (at least 2026-2028), extended via remote JSON. Claude drafts from named almanacs with links, the owner verifies, only verified data ships.

## Data model

No backend: bundled static data, a remote copy, and settings in the browser.

### Settings (`storage.sync` key `settings`, mirrored to `localStorage` `tarikh:settings`)

Schema 5 in `src/settings/types.ts`:

- `schemaVersion` (5); `calendars` (`CalendarId[]`, display order; `gregorian | punjabi-solar | bikrami | nanakshahi | hijri`, listed once in `src/calendars/registry.ts`)
- `theme` (`chitta | raat | sarson | phulkari | mitti | neela`; with nothing stored `prefers-color-scheme` picks `chitta` or `raat`)
- `dateStyle` (`list | centered | compact`); `background` (`photo | solid`, read by item 14)
- `hijriOffset` (-1 | 0 | 1); `festivalSets` (subset of `cultural | hindu | sikh | muslim`); `gurpurabSource` (`sgpc | nanakshahi`)
- `showFestivalLines`, `showFact` (booleans, default `true`)

Planned: item 21 widens `CalendarId`, item 30 adds `communities`, item 31 widens `festivalSets`, item 35 adds `nationalDays` (country codes), item 20 renames the mirror key prefix. Each bumps `schemaVersion` with a migration.

`parseSettings` validates `storage.sync` and the mirror. Older schemas migrate in memory on read, not written back; a newer schema is ignored and `saveSettings` rejects with `NewerSettingsError` rather than overwrite it; saving writes `storage.sync` before the mirror. The page paints from the mirror and re-renders if `storage.sync` differs. With no settings, v0 shows all five calendars and four sets; `defaultSettings` is Gregorian + Punjabi solar + Nanakshahi.

> Locked: settings only in `storage.sync` (100 KB, 8 KB per item). After launch synced settings outlive releases, so the migration path must keep working.

### Local state (`storage.local`)

Content cache (refreshed after paint when over 24 h old); `installDate` and `lastAskDate` (local `YYYY-MM-DD`; ask rules plan §6 and §11). Photos in the Cache API.

### Calendar data (`data/calendar/<calendar>/<year>.json`, 2026-2036)

One file per data calendar per year, generated by `scripts/build-calendar.ts` from the definitions in `scripts/calendars.ts` (`id`, reference `place`, `generate`). Both current calendars are computed for Amritsar / IST. Gregorian, Hijri and Nanakshahi ship no data. The page loads only the enabled calendars' current-year files through `loadCalendarYear(calendar, year)`; a date is looked up in its own Gregorian year's file. A missing file resolves `undefined` and that calendar is left out.

- `punjabi-solar/<year>.json`: `year`; `sangrand` (13 sorted ISO dates; index 0 is the previous December's; entry `i` starts month `((9 + i) % 12) + 1`, Chet = 1)
- `bikrami/<year>.json`: `year`; `tithi` (number[], 1-30, sunrise tithi per day); `months` (`[startISO, monthIndex, adhik 0|1][]`, 13-15 entries; `monthIndex` 0 = Chaitra; first entry is the month in progress on 1 January)
- `CalendarYear` is both merged. Festival rules read it through `loadFestivalYear(year)`, which loads both files, so festival lines fetch both until the festival sets are reworked (features 30 to 34).

> The remote copy at `/data/calendar/<calendar>/<year>.json` and the content refresh arrive with features 13 and 18; nothing fetches remotely yet.

### Photo (`content/photos.csv`)

`id, title, location, country, author, author_url, source_url, license, license_url, retrieved_on, archive_url, changes, month_tag, bundled`. Wikimedia Commons and Openverse only; CC0, PD, CC BY, CC BY-SA (confirm on the source page). Balanced across the eight countries; `country` is for balance only. No identifiable people, political imagery, flags, maps or borders. Originals in gitignored `photos-src/`; AVIF 1920 and 2560 px, hashed, immutable. Credit `Title · Author · Licence`, linked.

### Fact (`content/facts.csv`, CC0)

`id, category, text_en, source_1, source_2, region, festival_tag, month_tag, status (draft | verified), added_on, verified_on, notes`. Only `verified` ships; 120-220 characters, two reliable sources. Balanced across the region. Avoid doctrine comparisons, Partition, wars, disputed territories, 1984, separatism, Afghan politics, language politics, caste, India-Pakistan politics, living politicians, identity disputes, unverifiable superlatives.

### Daily selection (same for everyone)

`dayNumber` = days since 2026-01-01 (local). Fact: one tagged for today's festival in the person's sets or the Gregorian month, else `facts[dayNumber % length]`. Photo: Gregorian-month-tagged plus untagged pool, `pool[dayNumber % length]`.

### Hosted content (`site/`)

`/data/manifest.json` (short cache), `/data/calendar/<calendar>/<year>.json`, `/data/festivals.json`, `/data/facts.json`, `/data/photos.json`, `/photos/<hash>-1920.avif` and `-2560.avif` (immutable); CORS `*` on `/data/*`. Network failure falls back to bundled data.

## Tech stack

- **TypeScript** (strict), **WXT** (MV3 forced on every browser), **vanilla DOM**, system fonts, inlined critical CSS, themes as CSS custom properties
- **Biome**, **Vitest** (`tests/**/*.test.ts`), **astronomy-engine** and an image optimiser, all dev-only; **pnpm**, Node 22.18+; GitHub Actions runs `pnpm check`'s steps
- **Zero runtime dependencies.** **Permissions: `storage` only**; no background, host or content scripts, no `alarms`. Firefox: `gecko.id`, `data_collection_permissions: none`, `strict_min_version: "140.0"`.
- Performance: paint from the mirror; onboarding, settings, ask card and per-calendar formatters and data are `import()`-lazy; reuse `Intl.DateTimeFormat`s; theme colour first, then the photo (no fade under reduced motion); prefetch tomorrow's photo; refresh content after paint.
- **Budgets (`pnpm size`):** initial JS < 25 KB gzip, CSS < 8 KB gzip, package excluding photos < 300 KB (currently enforced at 100 KB until item 21), bundled photos ~1 MB.
- Layout: `entrypoints/newtab/`, `src/{calendars,communities,festivals,content,settings,ui,themes,strings}`, `data/calendar/`, `content/`, `scripts/`, `public/`, `site/`, `tests/`. All UI strings in `src/strings/en.ts`; English only.
- Licences: code GPL-3.0; facts and CSV metadata CC0; photos their own; name and logo unlicensed.

## Monetization

Patreon monthly only (confirm Pakistan payout). Never a popup; first ask 14+ days after install; at most monthly; small inline one-click card never over the date; prefer celebrations in the person's sets; quiet on mourning days (Shaheedi Purabs, Ashura, Good Friday) and national days; greetings only for celebrations ("Eid mubarak!", "Happy Diwali!"); general line "Built by one developer for South Asians everywhere"; no "I already support" button; quiet Support link in Settings.

## UI/UX

One page, the new tab; everything else is a lazy panel.

- **New tab:** dates in enabled calendars, Today/Tomorrow lines (national days carry the country in brackets), photo with credit, fact, gradient behind text over photos.
- **Onboarding:** 1) communities ("Which traditions do you follow?", pre-selected from browser language or timezone) with a live preview of suggested calendars and sets, 2) look, 3) done. Skippable: Gregorian plus any hinted suggestions, default theme, photo on.
- **Settings:** communities, calendars (on/off, order), look, festivals (sets, Gurpurab source, Hijri offset, lines on/off), national days (countries), fact, Report a mistake, Support Tarikh, About (version, repo, privacy, credits, dates disclaimer).
- **Look:** six themes (ids stay; display names to revisit), three date styles, solid mode.
- **Accessibility:** AA contrast (tested), `<time datetime>`, keyboard-operable panels with visible focus, reduced motion, 200% zoom, never colour alone, `lang="en"`.

## Deployment

- **Extension:** `pnpm build` (`.output/chrome-mv3`), `pnpm build:firefox` (`.output/firefox-mv3`), `pnpm zip`/`zip:firefox`; `pnpm check` runs everything.
- **Site:** `site/` on Cloudflare Pages (static, no env vars or workers); `_headers` as above; hosts `privacy.html`. Domain: TODO.
- **Versions:** `package.json` is the source; `0.0.x`, then `1.0.0`, then SemVer; changelog from `1.0.0`.
- **Stores:** Chrome ($5; privacy tab, single purpose "today's date in South Asian calendars, festivals, a daily photo and fact", `storage` justification), Edge, Firefox AMO (source zip). Icons, 1280x800 screenshots, 440x280 promo tile, privacy URL, "Open source (GPL-3.0) · No tracking · No accounts · Works offline".
- **Legal:** privacy page (never a gate); dates disclaimer (follow reference almanacs, confirm locally); photo takedown contact.

## Open questions

From plan §10:

- [ ] SGPC jantri 2026-2027 itself (fixtures come from reproductions) and jantri 559.
- [ ] Authoritative source per new calendar (riskiest: Bhutanese, Sinhala, Nepal Sambat).
- [ ] Community list review; Kashmiri Pandit calendar, Jain year, Orthodox Easter.
- [ ] Shaka Amanta: one calendar with spellings or separate per community.
- [ ] Muslim set: Mawlid and Shab-e-Barat?
- [ ] National days list per country, from official holiday lists.
- [ ] Clock on the page? Uninstall feedback URL?
- [ ] Patreon payout and page URL; feedback form URL; Firefox ID (`tarikh@<domain>` or GUID).
- [ ] Name checks (stores, domain, trademark); GitHub repo rename timing; public contact address; theme display names.
