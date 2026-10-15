# Aaj Da Din — Project Plan

> Single source of truth for scope and decisions. Last updated: 2026-10-15.
> If something here conflicts with code, this plan wins until it is deliberately
> changed. Run `/overview` after changing it.

## 1. Problem - What problem are we solving?

**Aaj Da Din** ("today's day") is a browser new-tab page that shows today's date in the calendars Punjabis use, today's and tomorrow's festivals, a daily photo of Punjab and a daily fact.

**Pitch:** fast, private, open source. No tracking, no accounts, works offline.

### Guiding principles (in priority order)
1. **Fast and small.** The page opens on every new tab, so every byte and millisecond counts.
2. **Private and trustworthy.** No tracking or analytics, the minimum permissions, and open source code.
3. **Correct.** A wrong date or a wrong fact damages trust more than a missing feature does.
4. **Neutral and inclusive.** Treat East and West Punjab, Sikh, Hindu and Muslim Punjabis equally. Stay out of politics.
5. **Works offline.** Bundled data is always enough to render a complete page.

## 2. Users - Who is this for?

**Audience:** primarily the Punjabi diaspora on desktop (Canada, UK, US, Australia, Gulf), ages ~25–55, from both East (India) and West (Pakistan) Punjab. Also urban Punjab users and community institutions.

**Browsers (V1):** Chrome, Edge, Firefox. Brave, Vivaldi and other Chromium browsers install from the Chrome Web Store at no extra cost.
**Not supported:** Opera, which blocks `chrome_url_overrides` for the new tab page. Safari and Samsung Internet are also out.

## 3. Features - What does the MVP need?

### 3.1 Versions at a glance

| Version | Goal | Audience |
|---|---|---|
| **v0** | Internal prototype: a working new tab with correct calendars | You only (loaded unpacked) |
| **V1** | Public launch on Chrome, Edge and Firefox | Everyone |
| **V1.x** | More content, small additions | Everyone |
| **V2** | Punjabi languages and scripts; sponsor tile once there are real user numbers | Everyone |
| **V3** | Motion, music, Opera revisit | Everyone |

**Current milestone: v0.** Version numbers: see §8.2.

### 3.2 v0 — Internal prototype

**Goal:** prove the hard parts, which are calendar correctness and speed, before building UI polish.

#### Step 0 — Scaffold (done: initial commit)
- WXT + TypeScript project, vanilla DOM (no UI framework).
- Manifest V3 for **all** browsers. WXT defaults Firefox to MV2, so force MV3.
- A `newtab` entrypoint. WXT generates `chrome_url_overrides.newtab` from it.
- Permissions: `storage` only. No `host_permissions` and **no background script**.
- Firefox manifest:
  - `browser_specific_settings.gecko.id`
  - `data_collection_permissions: { required: ["none"] }`
  - `strict_min_version: "140.0"`
- Tooling, all dev-only: Biome (lint and format), Vitest, a size-budget check.
- `LICENSE` (GPL-3.0) and `content/LICENSE` (CC0 for facts).
- GitHub repo + GitHub Actions running typecheck → lint → test → build → size check.

#### Step 1 — Calendar engine
- **Gregorian**: `Intl.DateTimeFormat`.
- **Nanakshahi (original 2003)**: pure arithmetic (see §3.4.2).
- **Hijri**: `Intl.DateTimeFormat` with `calendar: 'islamic-umalqura'` plus a user offset of −1/0/+1.
- **Desi (solar)** and **Bikrami (lunisolar)**: looked up from data generated at build time.
- **Build script** (`scripts/build-calendar.ts`): uses `astronomy-engine` (dev-only dependency) to generate sangrand dates, tithis and Purnimanta month names for **2026–2036** as one JSON file per year.
- **Tests**: Vitest fixtures cross-checked against the SGPC jantri and a published panchang for the same dates.

#### Step 2 — Bare new tab
- Shows today's date in all five calendars (dev defaults hard-coded or set in a simple dev panel).
- "Today: …" / "Tomorrow: …" festival lines, using the Sikh (SGPC) and cultural sets.
- One theme, one date style, a solid-colour background, plus 2–3 bundled photos with a credit line.
- One placeholder fact.
- Settings saved in `storage.sync`, mirrored to `localStorage` for an instant first paint.

#### v0 is done when
- [ ] It loads unpacked in Chrome, Edge and Firefox with no console errors.
- [ ] All calendar tests pass against the verified fixtures for 2026 and 2027.
- [ ] First paint is under 100 ms on a mid-range laptop, with no flash of the wrong theme.
- [ ] Size budgets (§5.3) are met and enforced in CI.
- [ ] It works fully with the network disabled.

### 3.3 V1 — Public launch

Everything in v0, plus:

#### Features
- **Onboarding**: minimal, 2–3 screens (see §7.2). Everything is changeable later in Settings.
- **Calendars**, any combination and order: Gregorian, Desi (solar), Bikrami (lunisolar), Nanakshahi, Hijri.
- **"Today: [festival]"** and **"Tomorrow: [festival]"** lines. When several festivals fall on one day, join them: "Today: Diwali · Bandi Chhor Divas".
- **Festival sets**: Punjabi cultural, Sikh, Hindu, Muslim (see §3.4.3).
- **Gurpurab dates**: the **SGPC jantri** by default. Users can switch to **Original Nanakshahi (2003)**. The source is labelled.
- **Themes**: 6–8 colour themes, plus **3 date styles** and a **solid-colour (no photo) mode**.
- **Daily photo** with credit in the bottom-right corner.
- **Daily fact.**
- **Language: English only.** All UI strings live in `src/strings/en.ts` so other languages can be added later.
- **Settings panel** (see §7.3).
- **"Report a mistake / Suggest a feature"**: a single entry in Settings that opens an external form.
- **Support**: Patreon monthly membership, with gentle in-page asks (see §6).

#### Content at launch
- **60 photos**, 6–8 of them bundled (see §4.4).
- **120 verified facts** (see §4.5).
- Festival data for 2026–2036, with Sikh dates checked against the SGPC jantri.

#### Launch work
- Cloudflare Pages content site (see §8.1).
- Privacy policy page (see §9).
- Accessibility pass (see §7.4).
- Store listings for Chrome, Edge and Firefox (see §8.3).

#### Explicitly NOT in V1
Countdown · sponsor tile · analytics of any kind · Roman Punjabi, Gurmukhi, Shahmukhi · Patreon Shop items · web fonts (system font stack only) · search box · Rust/WASM · Opera.

### 3.4 Calendars and festivals

#### 3.4.1 Calendar options

| Option | Example | Who it's for | Source at runtime |
|---|---|---|---|
| Gregorian | 11 October 2026 | Everyone | `Intl` |
| **Desi (solar)** | 26 Assu | Punjabis on both sides; Sikh sangrand | Generated table |
| **Bikrami (lunisolar)** | Assu Vadi 1, Samvat 2083 | Punjabi Hindus; festival dating | Generated table |
| Nanakshahi (2003) | 27 Assu 558 NS | Sikhs | Arithmetic |
| Hijri | 29 Rabi al-Thani 1448 | Punjabi Muslims | `Intl` (umalqura) + offset |

The example values are illustrative only. Verify them in the tests.

#### 3.4.2 Nanakshahi (original 2003): fixed months

| Month | Starts | Days |
|---|---|---|
| Chet | 14 Mar | 31 |
| Vaisakh | 14 Apr | 31 |
| Jeth | 15 May | 31 |
| Harh | 15 Jun | 31 |
| Sawan | 16 Jul | 31 |
| Bhadon | 16 Aug | 30 |
| Assu | 15 Sep | 30 |
| Katak | 15 Oct | 30 |
| Maghar | 14 Nov | 30 |
| Poh | 14 Dec | 30 |
| Magh | 13 Jan | 30 |
| Phagun | 12 Feb | 30 (31 in Gregorian leap years) |

Year: NS = Gregorian year − 1468 on or after 14 March; − 1469 before it. Verify this table against a published Nanakshahi source in tests.

#### 3.4.3 Festival sets (draft list; dates come from data)
- **Punjabi cultural** (default on): Lohri, Maghi, Basant Panchami, Vaisakhi, Teeyan.
- **Sikh** (SGPC by default):
  - Prakash Purabs (Guru Nanak Dev Ji, Guru Gobind Singh Ji, and others)
  - Shaheedi Purabs (Guru Arjan Dev Ji, Guru Tegh Bahadur Ji)
  - Khalsa Sajna Divas, Bandi Chhor Divas, Hola Mohalla
  - Gurgaddi and Prakash days of Guru Granth Sahib Ji
  - Shaheedi Jor Mela
- **Hindu**: Maha Shivratri, Holi, Ram Navami, Raksha Bandhan, Janmashtami, Dussehra, Karva Chauth, Diwali.
- **Muslim**: Ramadan begins, Eid al-Fitr, Eid al-Adha, Islamic New Year, Ashura. Labelled "expected", because moon sighting decides the actual day.
- **Neutrality rule:** include days communities celebrate or observe. Exclude political anniversaries.
- **Default sets come from the calendars chosen at onboarding** (all editable later):
  - Cultural: always on
  - Nanakshahi → Sikh
  - Bikrami → Hindu
  - Hijri → Muslim

#### 3.4.4 Date rules
- Use the published (jantri/IST-based) date as a calendar date wherever the user is. The day changes at **local midnight**.
- No geolocation.
- Hijri ignores the tradition that the day starts at sunset and shows the civil-day date.

### 3.5 Later versions and not planned

#### V1.x — after launch
- More facts (toward 365+) and photos.
- A tithi line under the Bikrami date.
- **Countdown** to the next festival or a chosen date (moved out of V1).
- Custom yearly events (e.g. birthdays) dated in the desi calendar.
- Patreon Shop digital items: printable desi wall calendar (PDF), wallpaper pack of your own photos.

#### V2
- **Roman Punjabi, Gurmukhi, Shahmukhi** for the UI and facts.
  - Subsetted fonts, lazy-loaded only when chosen.
  - Native-speaker review.
  - One spelling scheme for Roman Punjabi.
- **Sponsor tile** once there are real users (~10k weekly): one static tile labelled "Sponsor", no tracking parameters, no impression counting, served from the hosted JSON.

#### V3
- Small motion loops: off by default, lazy-loaded. Check Cloudflare's terms for video first.
- Opt-in, streamed music using only clearly licensed tracks.
- Revisit Opera if it ever allows replacing the new tab page.

#### Not planned (any version)
Analytics or tracking · accounts · a backend · donation popups · remote code · Pexels, Pixabay or Unsplash photos.

## 4. Data - What are we storing?

There is no backend and no user database. Data is bundled static content plus the user's own settings in their browser.

### 4.1 Calendar data pipeline
```
scripts/build-calendar.ts  (astronomy-engine, dev-only)
        │  computes sangrand, tithi and Purnimanta months for Amritsar / IST
        ▼
data/calendar/2026.json … 2036.json   ──► manual check against SGPC jantri + panchang
        │
        ├─► bundled in the extension (offline, 10 years)
        └─► also published on Cloudflare (corrections without a store release)
```
JSON is data, not code, so this is allowed under MV3 remote-code rules. Load **only the current year's file** (and the next year's file in late December, for the Tomorrow line).

### 4.2 Settings and local storage
- Settings live in `storage.sync`, versioned with a `schemaVersion` field so later releases can migrate old settings. A `localStorage` mirror (updated from `storage.sync`) gives an instant first paint; `storage.sync` stays the real source.
- `storage.sync` quotas: 100 KB total, 8 KB per item. Settings only.
- `storage.local` (10 MB) holds caches: content JSON, the install date and the last donation-ask date (see §6).
- Photos are cached offline with the Cache API (no permission needed).
- Settings fields are listed in §7.3.

### 4.3 Daily selection
- **Same for everyone on the same day; no server logic.**
- `dayNumber = days since 2026-01-01 (local date)`.
- **Fact**: if one is tagged for today's festival or desi month, use it. Otherwise use `facts[dayNumber % facts.length]`.
- **Photo**: filter to photos tagged with the current desi month (plus untagged ones), then use `pool[dayNumber % pool.length]`.

### 4.4 Photos

**Sources (decided):** Wikimedia Commons and Openverse only.

**Allowed licences:**
- ✅ CC0, Public Domain, CC BY, CC BY-SA.
- ❌ NC (non-commercial): risky because donations exist.
- ❌ ND (no derivatives).
- ❌ Pexels, Pixabay and Unsplash: their licences forbid wallpaper-style use.

**About CC BY-SA:** showing a photo unchanged with credit is fine. Resizing and converting format don't count as adaptations, and including a photo in the extension doesn't make the extension a derivative. If you crop a photo, label the cropped file CC BY-SA too.

**Openverse caveat:** always open the **original source page** and confirm the licence there. Aggregators can carry wrong licences, and Flickr has re-uploads.

#### Picking photos
- **Format:** landscape, source at least **2560 px** wide.
- **Clean:** no watermarks, text or logos.
- **Room for text:** a calm area where the date sits.
- **Subjects:** fields, rivers, architecture, food, crafts, festivals seen from a distance.
- **No identifiable people** as the main subject. **No political imagery.**
- **Both sides of Punjab:** e.g. Darbar Sahib, Badshahi Mosque, Kartarpur, Katas Raj, Anandpur Sahib, Lahore Fort, rural Doaba and Pothohar.
- **Seasonal tags:** mustard in Magh, wheat harvest in Vaisakh, monsoon in Sawan.

#### `content/photos.csv` columns
```
id | title | location | author | author_url | source_url | license | license_url |
retrieved_on | archive_url | changes | season_month | bundled
```
- `archive_url`: a web.archive.org snapshot of the source page taken when you collect the photo. It's your proof if the licence changes or the photo is deleted.
- `changes`: e.g. "resized, converted to AVIF".

#### Credit line (bottom-right)
`Badshahi Mosque at dusk · Author Name · CC BY-SA 4.0`, linked to the source page.

#### Originals
- Full-size originals live in **`photos-src/<id>.<ext>`**, named by the same `id` as the `photos.csv` row. The folder is **gitignored**: a large file committed once stays in git history for good.
- The CSV (`source_url`, `license`, `archive_url`) is the source of truth. `scripts/optimise-photos.ts` downloads any original that is missing, so a fresh clone can rebuild every output.
- Keep a personal backup of the folder, because Commons files can be deleted or re-licensed. The `archive_url` snapshot, not the image, is the proof of the licence.
- Cropped or edited files go in `photos-src/edited/`, with "cropped" in the CSV `changes` column and the same licence as the original.

#### Output
- AVIF at 1920 px (≈120–200 KB) and 2560 px (≈200–300 KB).
- Hashed filenames, served with `Cache-Control: immutable`.

### 4.5 Facts

**Licence:** CC0 (no rights reserved; anyone may reuse them).
**Language:** English only in V1. Columns for other languages are added in V2.
**Target:** 120 verified facts at launch, growing to 365+.

#### Workflow (drafted with Claude, verified by you)
1. Pick a category.
2. Claude drafts ~20 facts, each with **two real source links** found by web search, marked `draft`.
3. You open each source and confirm it supports the fact. Edit or delete anything weak.
4. Mark it `verified`. **Only `verified` facts ship.** The build script filters on this.

#### Rules
- **Length:** 120–220 characters, 1–2 sentences.
- **Sources:** two reliable ones (Britannica, books, government or university sites, museums). Wikipedia is for finding sources, not as one.
- **Balance:** roughly equal East Punjab, West Punjab and diaspora.
- **Categories:** language · food · agriculture · geography and rivers · history (pre-1900 safest) · music and folk arts · crafts (phulkari, etc.) · science · sport · festivals.
- **Avoid:** comparisons of religious doctrine, Partition blame, 1984, separatist politics, caste, India–Pakistan politics, living politicians, and unverifiable "first/biggest/oldest" claims.
- **Optional tags:** a festival or desi month, so the fact appears on that day.

#### `content/facts.csv` columns
```
id | category | text_en | source_1 | source_2 | region | festival_tag | month_tag |
status (draft|verified) | added_on | verified_on | notes
```

## 5. Tech - What stack are we using?

### 5.1 Stack
- **TypeScript**: compiles away, so no runtime cost.
- **WXT**: per-browser manifests, store zips, dev reloading.
- **Vanilla DOM**: no framework.
- **Dev-only**: Vitest, astronomy-engine, an image optimiser (sharp or avifenc).
- **Runtime dependencies: zero.** Add one only when truly needed.

### 5.2 Performance rules
- **No background script.** First run is detected in the new-tab page (no settings → onboarding).
- **Instant paint from a `localStorage` mirror** of the settings. `storage.sync` stays the real source and updates the mirror.
- **Lazy loading**: onboarding, settings and the donation card load via `import()` only when needed.
- **Date formatters**: create the `Intl.DateTimeFormat` instances once and reuse them.
- **System font stack** only.
- **Inline the critical CSS.** Themes are sets of CSS custom properties (~200 bytes each).
- **Photos**:
  - Paint the theme colour first, then fade in the photo (no fade under `prefers-reduced-motion`).
  - Pick 1920 or 2560 px by screen size.
  - **Prefetch tomorrow's photo** into the Cache API.
- **Content refresh**: on new-tab open, if the cache is over 24 h old, fetch the manifest **after paint** (`requestIdleCallback`). No `alarms` permission.

### 5.3 Size budgets (enforced in CI)

| Asset | Budget |
|---|---|
| JS (gzipped, initial) | < 25 KB |
| CSS (gzipped) | < 8 KB |
| Package excluding bundled photos | < 100 KB |
| Bundled photos (6–8 at 1920 px AVIF) | ≈ 1 MB total |
| Current-year calendar data | a few KB |

### 5.4 Permissions: `storage` only

| What we do | Permission needed |
|---|---|
| Save settings (synced across the user's devices) | `storage` (no install warning) |
| Cache content JSON | `storage` (`storage.local`, 10 MB) |
| Replace the new tab page | None (a manifest entry) |
| Load photos from Cloudflare | None (`<img>`/CSS) |
| Fetch JSON from Cloudflare | None (Cloudflare sends `Access-Control-Allow-Origin: *`) |
| Cache photos offline | None (Cache API) |
| Open the feedback form | None (a link) |

### 5.5 Proposed repo layout
```
aaj-da-din/
├─ entrypoints/newtab/        index.html, main.ts, critical.css
├─ src/
│  ├─ calendars/              gregorian.ts, nanakshahi.ts, hijri.ts, desi.ts, bikrami.ts
│  ├─ festivals/              resolve.ts (today/tomorrow, sets, SGPC vs Nanakshahi)
│  ├─ content/                facts.ts, photos.ts (daily selection, cache)
│  ├─ settings/               store.ts, mirror.ts, migrations.ts
│  ├─ ui/                     onboarding/, settings/, donate/   ← lazy chunks
│  ├─ themes/                 themes.css
│  └─ strings/                en.ts, glossary.ts (Punjabi word spellings)
├─ data/calendar/             2026.json … 2036.json  (generated, bundled)
├─ content/                   facts.csv, photos.csv  (source of truth), LICENSE (CC0)
├─ scripts/                   build-calendar.ts, build-content.ts, optimise-photos.ts
├─ public/                    icons, bundled photos
├─ site/                      Cloudflare Pages: _headers, privacy.html, data/, photos/
├─ tests/
├─ wxt.config.ts
└─ LICENSE                    GPL-3.0
```

## 6. Monetize - How will this make money?

**V1: Patreon monthly membership tiers only.** Confirm Pakistan bank payout at signup. No sponsor tile, Shop items or Stripe.

### Donation ask rules
- **Never** a popup, modal or anything that blocks or delays the page.
- **First ask** at least **14 days after install**. Store the install date in `storage.local`.
- **At most once a month.** Store the last ask date.
- **Small inline card**, closed with one click, that never covers the date.
- **Prefer festival moments**: if an ask is due within a few days of a festival, show it on the festival day.
- **No "I already support" button** (decided).
- A permanent, quiet "Support" link in Settings.

### Sample messages
- "Vaisakhi mubarak! Aaj Da Din is made by one person. Support it →"
- "Eid mubarak! Free, private, no ads. Help keep it that way →"
- "Built by a Punjabi developer for Punjabis everywhere. Support the project →"
- "No tracking, no ads, ever. If Aaj Da Din brightens your day, consider supporting it →"

Tone: warm, short, never guilt-tripping.

## 7. UI/UX - How should this look and feel?

### 7.1 Look
- Fast and small first (§1): system font stack only, no web fonts, critical CSS inlined.
- **Themes**: 6–8 colour themes (CSS custom property sets), **3 date styles**, and a **solid-colour (no photo) mode**. `prefers-color-scheme` picks the default theme.
- **Photo**: theme colour paints first, then the daily photo fades in. Credit line bottom-right (format in §4.4). A gradient sits behind text over photos.
- **Festival lines**: "Today: …" / "Tomorrow: …" under the date. Muslim dates are labelled "expected".
- **Donation card**: small, inline, one-click close, never over the date (§6).
- Single screen: `entrypoints/newtab/` is the only page. Onboarding, Settings and the donation card are lazy-loaded overlays or panels.

### 7.2 Onboarding (shown when no settings exist)
1. **Welcome + calendars**: pick any combination with a live preview of today's date.
2. **Look**: theme, date style, photo or solid colour, with a live preview.
3. **Done**: "You can change anything later in Settings ⚙".

Keep it skippable. Skipping applies sensible defaults (Gregorian + Desi + Nanakshahi, default theme, photo on).

Chrome and Edge show a "Change back?" prompt on the first new tab. Onboarding must show value immediately.

### 7.3 Settings
- **Calendars**: on/off and order.
- **Look**: theme · date style · photo or solid colour.
- **Festivals**: sets on/off · Gurpurab source (SGPC / Original Nanakshahi) · Hijri offset (−1/0/+1, labelled "Match your local mosque") · show Today/Tomorrow lines on/off.
- **Fact**: show on/off.
- **Report a mistake / Suggest a feature**: opens the external form (Tally or Google Forms; URL is a placeholder until created).
- **Support Aaj Da Din**: Patreon link.
- **About**: version · "Open source (GPL-3.0)" with repo link · privacy policy · licences and photo credits.

Storage details: §4.2.

### 7.4 Accessibility (V1 requirement)
- WCAG 2.2 AA contrast on every theme. Add a gradient behind text over photos.
- Semantic HTML: `<time datetime>`, and full-text `aria-label`s for calendar dates.
- Fully keyboard-operable onboarding and settings, with visible focus.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (used as the default theme).
- Layout holds up at 200% text zoom. Never rely on colour alone.
- Set `lang` attributes now, so Punjabi scripts can be added in V2.

## 8. Deployment - Where and how will this ship?

### 8.1 Hosting (Cloudflare Pages, free)
- Source on GitHub. The `site/` folder deploys to Cloudflare Pages (static; no server, no env vars, no database).
- **Paths:**
  - `/data/manifest.json` (short cache)
  - `/data/calendar/<year>.json`
  - `/data/facts.json`
  - `/data/photos.json`
  - `/photos/<hash>-1920.avif`, `/photos/<hash>-2560.avif` (immutable)
- **`_headers`:**
  - `Access-Control-Allow-Origin: *` on `/data/*`
  - long `immutable` cache on `/photos/*`
- **Fallback:** if the network fails, the extension always falls back to bundled data and photos.
- **The site also hosts** the privacy policy and, optionally, a simple landing page.

### 8.2 Build, versions and CI
- Build: `pnpm build` (Chrome/Edge, `.output/chrome-mv3`) and `pnpm build:firefox` (`.output/firefox-mv3`); store zips with `pnpm zip` / `pnpm zip:firefox`.
- GitHub Actions runs typecheck → lint → test → build → size check. Release and store-publish automation comes only after the first manual submissions.
- **Version numbers:** `package.json` `version` is the single source (WXT copies it into the manifest). The prototype uses `0.0.x`, the first store release is `1.0.0`, and later releases follow SemVer. A `CHANGELOG.md` (Keep a Changelog format) starts at `1.0.0`; until then git history is enough.
- **Firefox add-on ID:** `wxt.config.ts` has the placeholder `aajdadin@example.org`. Replace it before the first AMO upload (see §10).

### 8.3 Store submission checklist

| | Chrome Web Store | Edge Add-ons | Firefox (AMO) |
|---|---|---|---|
| Fee | $5 once | Free | Free |
| Account | Developer dashboard | Partner Center | addons.mozilla.org |
| Special requirements | Privacy practices tab; single-purpose statement; `storage` justification ("Saves your display preferences") | Same listing assets | `gecko.id`; `data_collection_permissions: none`; upload source zip (WXT generates it) |

**All three stores:**
- Icons (16/32/48/128).
- Screenshots at 1280×800.
- Chrome small promo tile (440×280).
- Privacy policy URL.
- The "open source · no tracking" line with the repo link.
- **Single purpose (Chrome):** "Replaces the new tab page with today's date in Punjabi calendars, festivals, a daily photo and fact."

## 9. Usage model and constraints (optional)

Established facts only. No expected user count is set; the sponsor-tile decision waits for real numbers (~10k weekly users, §3.5).

- **Operation:** a client-side browser extension that works fully offline from bundled data. Its only network use is fetching public static JSON and photos from Cloudflare Pages, after first paint.
- **Collected: nothing.** No analytics, telemetry, accounts or backend. There is no server-side user data.
- **Explicit non-requirements:** no accounts, no backend, no terms-and-conditions screen or onboarding accept step.

### Privacy and open source
- **Code:** GPL-3.0, public GitHub repo.
- **Facts:** CC0. `content/LICENSE` covers the fact text and the CSV metadata (including the credit columns in `photos.csv`). It does **not** cover the photo files. Facts are written in our own words, never copied from the sources.
- **Photos:** each photo's own licence, credited. A CC BY-SA photo's share-alike applies to that photo only, not to the code or the facts.
- **Name and logo:** not licensed to anyone.
- **Privacy policy must say:**
  - Settings are stored in your browser and synced by the browser's own sync if you have it on.
  - Content is downloaded from Cloudflare Pages, and Cloudflare may process IP addresses under its own policy.
  - The feedback form is a third-party service, used only if you open it.
  - Photos are credited to their authors.
- **Say it everywhere** (store listings, repo README, About screen): "Open source (GPL-3.0) · No tracking · No accounts · Works offline", with a repo link.

### Legal approach (decided, not legal advice)
- **No terms-and-conditions screen and no accept step in onboarding.** GPL-3.0 §15–16 already disclaims warranty and liability, the stores' own terms apply to users, and we collect nothing. A forced accept step would add friction to the new tab for little protection.
- **Privacy policy:** a page on the site (`site/privacy.html`), linked from About and the store listings. A "Privacy policy" link is fine in About; it is never a gate.
- **Dates disclaimer** in About and on the privacy page: dates are indicative, so confirm with the SGPC jantri or your local mosque. Hijri and moon-sighting dates are already labelled "expected".
- **Photo takedown contact** on the site, because credit is on screen but licences can be mis-tagged.
- **Name and logo** are not licensed to anyone (see above).
- Consider a one-time lawyer review of the privacy page before the V1 launch.

## 10. Open questions / to verify

- [x] **Desi (solar) rules:** settled in v0 (features 3 and 4). A sankranti belongs to the sunrise-to-sunrise day (Amritsar / IST) that contains it, and the sangrand day is day 1 of the new month (Punjab Data's jantri writes "1 Vaisakh (Sangrand)"). Desi shows day and month only, so it has no year number.
- [x] **Bikrami lunisolar:** settled in v0 (feature 4). Months use the same Punjabi names as the desi calendar, then the paksha and day: `Assu Vadi 1, Samvat 2083`. Tithi 1-15 is Sudi and 16-30 is Vadi, read at sunrise. An adhik month takes an `Adhik` prefix, for example `Adhik Jeth Sudi 3`. The Samvat year is Gregorian + 57 from Chaitra Shukla 1 (the day Pratipada begins, so 19 March 2026) and + 56 before it. In a year with an adhik Chaitra (2029) it turns in the nija month, as Drik Panchang dates it.
- [ ] **SGPC jantri** for 2026 and 2027: collect it as test fixtures. Feature 5's festival fixtures come from secondary reproductions of the Nanakshahi 558 jantri (Dekho-ji and Golden Temple Amritsar, 14 Mar 2026 to 14 Mar 2027, with jantri 557 before that), as for feature 3, so a copy of the jantri itself is still to be read, and jantri 559 for later dates.
- [ ] **Muslim set:** include Mawlid / Eid Milad-un-Nabi and Shab-e-Barat? (Widely observed, but not by all.)
- [ ] **Clock:** should the page also show the time? (Not discussed yet.)
- [ ] **Uninstall feedback form** via `runtime.setUninstallURL` (no permission needed): yes or no?
- [ ] **Patreon:** confirm Pakistan bank payout at signup.
- [ ] **Feedback form:** create it (Tally or Google Forms) and add the URL.
- [ ] **Firefox add-on ID:** `wxt.config.ts` has the placeholder `aajdadin@example.org`. Replace it before the first AMO upload. The ID is public in the manifest and permanent (changing it later loses users' synced settings). Use `aajdadin@<a domain we own>` or a `{GUID}`, **not** a personal email.
- [ ] **Public contact address:** decide whether the privacy page needs one, or the feedback form is enough. If an email is needed, use a dedicated address, not a personal one.
- [ ] **Theme names and palettes:** e.g. Sarson (mustard), Phulkari (magenta and orange), Mitti (earth), Neela (indigo), Raat (dark), Chitta (light minimal).

## 11. Decision log

| Decision | Status |
|---|---|
| Browsers: Chrome, Edge, Firefox; Opera dropped | ✅ Decided |
| Stack: TS + WXT + vanilla DOM, MV3, no background script | ✅ Decided |
| Rust/WASM dropped | ✅ Decided |
| Only the `storage` permission | ✅ Decided |
| System font stack in V1 | ✅ Decided |
| English only in V1 | ✅ Decided |
| Calendars: Gregorian, Desi solar, Bikrami lunisolar, Nanakshahi 2003, Hijri (±1) | ✅ Decided |
| Desi: sangrand day is day 1, no year shown. Bikrami: Sudi/Vadi from sunrise tithi, `Adhik` prefix, Samvat from Chaitra Shukla 1 (nija month in an adhik-Chaitra year) | ✅ Decided |
| Festivals are rules over the calendar lookups: a fixed date, a sangrand (or the day before one), a Bikrami tithi in the nija month, or an explicit list of sourced dates where the sunrise tithi cannot give the SGPC date (Bandi Chhor Divas). A tithi at two sunrises counts on the first day, and one at no sunrise on the day it begins. A sweep over 2026-2036 guards the gaps | ✅ Decided |
| Gurpurab dates: SGPC default, Nanakshahi optional | ✅ Decided |
| Today + Tomorrow festival lines in V1 | ✅ Decided |
| Countdown deferred to V1.x | ✅ Decided |
| Themes + date styles + solid mode, chosen at onboarding | ✅ Decided |
| Festivals and all settings editable after onboarding | ✅ Decided |
| No analytics | ✅ Decided |
| Single feedback entry in Settings | ✅ Decided |
| Patreon monthly only; no Shop in V1 | ✅ Decided |
| Donation asks: no popups, first after 14 days, max monthly, festival moments, no "already support" button | ✅ Decided |
| Sponsor tile deferred until real users | ✅ Decided |
| Open source, GPL-3.0, advertised on stores and repo | ✅ Decided |
| Facts: CC0, drafted with Claude, human-verified | ✅ Decided |
| Photos: Wikimedia Commons + Openverse only; CC0, PD, CC BY, CC BY-SA | ✅ Decided |
| Content licence: CC0 1.0 for facts and CSV metadata; photo files keep their own licences | ✅ Decided |
| No terms-and-conditions screen or onboarding accept step; privacy policy page plus dates disclaimer instead | ✅ Decided |
| Versioning: `0.0.x` prototype, `1.0.0` first store release, SemVer after; changelog starts at `1.0.0` | ✅ Decided |
| CI now (GitHub Actions); release/store-publish automation only after the first manual submissions | ✅ Decided |
| Firefox ID: placeholder until the first AMO upload; never a personal email | ✅ Decided |
| Photo originals: gitignored `photos-src/<id>.<ext>`, re-fetchable from `photos.csv`; only optimised AVIFs are committed | ✅ Decided |
| v0 new tab shows all five calendars when no settings mirror exists, while `defaultSettings` keeps Gregorian + Desi + Nanakshahi as the skip-onboarding default; an invalid mirror counts as none | ✅ Decided |
