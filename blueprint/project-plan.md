# Tarikh - Project Plan

> Single source of truth for scope and decisions. Last updated: 2026-10-17.
> If something here conflicts with code, this plan wins until it is deliberately
> changed. Run `/overview` after changing it.
>
> **Scope change (2026-10-17):** the project began as a Punjabi new tab. It is
> now **Tarikh**, for all of South Asia and its diaspora. v0 (§3.2) and the completed features
> were built for the Punjabi calendars and stay valid as the engine's foundation. The decision
> log (§11) keeps the earlier decisions; the pivot rows at its end take precedence where they
> differ.

## 1. Problem - What problem are we solving?

**Tarikh** ("date", and also "history", in Urdu, Hindi, Punjabi, Bengali, Gujarati, Marathi and Dari) is a browser new-tab page that shows today's date in the calendars South Asians use, today's and tomorrow's festivals for the traditions the person follows, a daily photo of South Asia and a daily fact.

People from Afghanistan, Bangladesh, Bhutan, India, the Maldives, Nepal, Pakistan and Sri Lanka, at home and across the diaspora, follow several calendars at once: a national or regional calendar, a religious calendar and the Gregorian one. A browser's new tab shows none of them. Someone from Tamil Nadu should see the Tamil date and Tamil festivals, someone from Kabul the Solar Hijri date and Nowruz, someone from Lahore the Desi date and Eid, each chosen by them.

**Pitch:** fast, private, open source. No tracking, no accounts, works offline.

### Guiding principles (in priority order)
1. **Fast and small.** The page opens on every new tab, so every byte and millisecond counts.
2. **Private and trustworthy.** No tracking or analytics, the minimum permissions, and open source code.
3. **Correct.** A wrong date or a wrong fact damages trust more than a missing feature does. Every date has a published source.
4. **Neutral and inclusive.** Treat every country, religion, community and language of the region equally. Never touch politics or controversies: no disputed territories (Kashmir included), no wars, no partitions, no "who is the real Indian or Pakistani", no maps or borders.
5. **Works offline.** Bundled data is always enough to render a complete page.

## 2. Users - Who is this for?

**Audience:** people from the eight South Asian countries (Afghanistan, Bangladesh, Bhutan, India, the Maldives, Nepal, Pakistan, Sri Lanka) and their diaspora worldwide (Gulf, UK, Canada, US, Australia, Europe, East Africa, Southeast Asia), on desktop, ages ~25-55. Also users in the region and community institutions.

**People choose by community, not by country.** A Punjabi can be Indian or Pakistani, a Tamil Indian or Sri Lankan, a Bengali Indian or Bangladeshi. Communities (§3.4.3) cross borders, fit the diaspora and avoid naming disputed regions.

**Browsers (V1):** Chrome, Edge, Firefox. Brave, Vivaldi and other Chromium browsers install from the Chrome Web Store at no extra cost.
**Not supported:** Opera, which blocks `chrome_url_overrides` for the new tab page. Safari and Samsung Internet are also out.

## 3. Features - What does the MVP need?

### 3.1 Versions at a glance

| Version | Goal | Audience |
|---|---|---|
| **v0** | Internal prototype: a working new tab with correct calendars (Punjabi calendars) | You only (loaded unpacked) |
| **V1** | Public launch on Chrome, Edge and Firefox with every calendar, community and festival set in §3.4 | Everyone |
| **V1.x** | More content, small additions | Everyone |
| **V2** | Sponsor tile once there are real user numbers | Everyone |
| **V3** | Motion, music, Opera revisit | Everyone |

**Current milestone: v0.** Version numbers: see §8.2.

### 3.2 v0 - Internal prototype

**Goal:** prove the hard parts, which are calendar correctness and speed, before building UI polish. v0 proves the engine on the Punjabi calendars; the South Asia scope (2026-10-17) does not change it.

#### Step 0 - Scaffold (done: initial commit)
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

#### Step 1 - Calendar engine
- **Gregorian**: `Intl.DateTimeFormat`.
- **Nanakshahi (original 2003)**: pure arithmetic (see §3.4.2).
- **Hijri**: `Intl.DateTimeFormat` with `calendar: 'islamic-umalqura'` plus a user offset of −1/0/+1.
- **Desi (solar)** and **Bikrami (lunisolar)**: looked up from data generated at build time.
- **Build script** (`scripts/build-calendar.ts`): uses `astronomy-engine` (dev-only dependency) to generate sangrand dates, tithis and Purnimanta month names for **2026-2036** as one JSON file per year.
- **Tests**: Vitest fixtures cross-checked against the SGPC jantri and a published panchang for the same dates.

#### Step 2 - Bare new tab
- Shows today's date in all five calendars (dev defaults hard-coded or set in a simple dev panel).
- "Today: …" / "Tomorrow: …" festival lines, using the Sikh (SGPC) and cultural sets.
- One theme, one date style, a solid-colour background, plus 2-3 bundled photos with a credit line.
- One placeholder fact.
- Settings saved in `storage.sync`, mirrored to `localStorage` for an instant first paint.

#### v0 is done when
- [ ] It loads unpacked in Chrome, Edge and Firefox with no console errors.
- [ ] All calendar tests pass against the verified fixtures for 2026 and 2027.
- [ ] First paint is under 100 ms on a mid-range laptop, with no flash of the wrong theme.
- [ ] Size budgets (§5.3) are met and enforced in CI.
- [ ] It works fully with the network disabled.

### 3.3 V1 - Public launch

Everything in v0, plus:

#### Features
- **Name: Tarikh.** Code, storage keys, manifests, strings and docs all use the name Tarikh (done by feature 20; nothing was published under the earlier name).
- **Onboarding**: minimal, 2-3 screens (see §7.2): pick communities, which pre-select calendars and festival sets. Everything is changeable later in Settings.
- **Calendars**, any combination and order: every calendar in §3.4.1, including the Bhutanese, Sinhala and Parsi calendars.
- **Communities** (§3.4.3): the person picks the traditions they follow; each one suggests calendars and festival sets. Religion is never asked directly.
- **"Today: [festival]"** and **"Tomorrow: [festival]"** lines. When several festivals fall on one day, join them: "Today: Diwali · Bandi Chhor Divas".
- **Festival sets**: religion sets and community sets (§3.4.4).
- **National days**: opt-in, per country, neutral (§3.4.5).
- **Gurpurab dates**: the **SGPC jantri** by default. Users can switch to **Original Nanakshahi (2003)**. The source is labelled.
- **Hijri offset** −1/0/+1, labelled "Match your local mosque".
- **Themes**: 6-8 colour themes, plus **3 date styles** and a **solid-colour (no photo) mode**.
- **Daily photo** of South Asia with credit in the bottom-right corner.
- **Daily fact.**
- **Language: English only.** All UI strings live in `src/strings/en.ts`.
- **Settings panel** (see §7.3).
- **"Report a mistake / Suggest a feature"**: a single entry in Settings that opens an external form.
- **Support**: Patreon monthly membership, with gentle in-page asks (see §6).

#### Content at launch
- **60 photos**, 6-8 of them bundled, balanced across the eight countries (see §4.4).
- **120 verified facts**, balanced across the region (see §4.5).
- Calendar data for 2026-2036; sourced festival lists as far ahead as their almanacs publish, at least 2026-2028 (§3.4.7).

#### Launch work
- Cloudflare Pages content site (see §8.1).
- Privacy policy page (see §9).
- Accessibility pass (see §7.4); done for the v0 surfaces, repeated for onboarding and new UI.
- Store listings for Chrome, Edge and Firefox (see §8.3).

#### Explicitly NOT in V1
Countdown · sponsor tile · analytics of any kind · any UI language other than English · Patreon Shop items · web fonts (system font stack only) · search box · Rust/WASM · Opera · computing dates for the user's own city (§3.4.6) · geolocation.

### 3.4 Calendars, communities and festivals

#### 3.4.1 Calendars

Each calendar is computed for its **reference place** (§3.4.6), the place its published almanac is computed for. Example values are illustrative; tests assert against the sources.

| Calendar | Example | Who it's for | Reference place | Source at runtime | Status |
|---|---|---|---|---|---|
| Gregorian | 17 October 2026 | Everyone | - | `Intl` | Done |
| Hijri (umm al-Qura, ±1) | 6 Jumada al-Awwal 1448 AH | Muslims | - | `Intl` + offset | Done |
| Solar Hijri | 25 Mizan 1405 | Afghanistan (official) | - | `Intl` (`persian`), Afghan month names | V1 |
| Indian National (Saka) | 25 Asvina 1948 | India (official) | - | `Intl` (`indian`) | V1 |
| Bangla (revised) | 2 Kartik 1433 | Bangladesh (official) | - | Arithmetic | V1 |
| Punjabi solar (Desi) | 1 Katak | Punjabis | Amritsar | Generated table | Done |
| Nanakshahi (2003) | 3 Katak 558 NS | Sikhs | - | Arithmetic | Done |
| Bikrami (Punjabi names) | Assu Sudi 7, Samvat 2083 | Punjabi Hindus | Amritsar | Generated table | Done |
| Vikram Samvat, Purnimanta | Ashvin Shukla 7, VS 2083 | North India, Hindi speakers | New Delhi | Generated table | V1 |
| Vikram Samvat, Amanta (Kartikadi) | Aso Sud 7, VS 2082 | Gujarati | Ahmedabad | Generated table | V1 |
| Shaka, Amanta (Chaitradi) | Ashvin Shukla 7, Shaka 1948 | Marathi, Kannada, Telugu, Konkani | Set per variant in its spec | Generated table | V1 |
| Tamil solar | 1 Aippasi | Tamils (India, Sri Lanka) | Chennai | Generated table | V1 |
| Malayalam (Kollam) | 1 Thulam 1202 | Malayalis | Thiruvananthapuram | Generated table | V1 |
| Bengali (traditional) | 1 Kartik 1433 | West Bengal, Tripura | Kolkata | Generated table | V1 |
| Odia | 1 Kartika | Odias | Bhubaneswar | Generated table | V1 |
| Assamese | 1 Kati | Assamese | Guwahati | Generated table | V1 |
| Nepali Bikram Sambat | 1 Kartik 2083 | Nepal (official) | Kathmandu | Generated table | V1 |
| Nepal Sambat | Kaulathwa 7, NS 1147 | Newars | Kathmandu | Generated table | V1 |
| Sinhala | Il Poya, BE 2570 | Sinhala, Sri Lankan Buddhists | Colombo | Generated table | V1 |
| Bhutanese lunar | 7th day, 9th month | Bhutan | Thimphu | Generated table | V1 |
| Parsi (Shahenshahi, Kadmi, Fasli) | Roj Hormazd, Mah Adar 1396 YZ | Parsis | - | Arithmetic | V1 |

- Month names follow each tradition's own English transliteration (Katak in Punjabi, Kartik in Hindi and Nepali, Aippasi in Tamil). One spelling per calendar, listed in `src/strings/en.ts`.
- Where `Intl` returns a calendar, only its numeric parts are used and month names come from `en.ts`, as Hijri already does, so output never depends on browser locale data.
- If no verifiable published source can be found for a calendar (the Bhutanese Phugpa calendar is the likeliest), that is a blocker to raise, not a reason to ship unverified dates.

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

#### 3.4.3 Communities (draft list; review before the community feature)

The person picks any number of communities. Each one **suggests** calendars and its community festival set; everything stays editable. Communities are cultural and linguistic, never political or national.

| Community | Suggested calendars | Community festival set |
|---|---|---|
| Punjabi | Punjabi solar (Desi), Bikrami, Nanakshahi | Punjabi |
| Sindhi | Vikram Samvat (Amanta) | Sindhi |
| Kashmiri | Vikram Samvat (Purnimanta) | Kashmiri |
| Pashtun | Solar Hijri | Pashtun |
| Baloch | Hijri | Baloch |
| Afghan (Dari-speaking) | Solar Hijri | Afghan |
| Hindi-speaking north | Vikram Samvat (Purnimanta) | North Indian |
| Rajasthani | Vikram Samvat (Purnimanta) | Rajasthani |
| Gujarati | Vikram Samvat (Amanta, Kartikadi) | Gujarati |
| Marathi | Shaka (Amanta) | Marathi |
| Konkani | Shaka (Amanta) | Konkani |
| Kannada | Shaka (Amanta) | Kannada |
| Telugu | Shaka (Amanta) | Telugu |
| Tamil | Tamil solar | Tamil |
| Malayali | Malayalam (Kollam) | Malayali |
| Bengali | Bengali (traditional) or Bangla (revised) | Bengali |
| Odia | Odia | Odia |
| Assamese | Assamese | Assamese |
| Nepali | Nepali Bikram Sambat | Nepali |
| Newar | Nepal Sambat, Nepali Bikram Sambat | Newar |
| Bhutanese | Bhutanese lunar | Bhutanese |
| Sinhala | Sinhala | Sinhala |
| Maldivian | Hijri | (Muslim set) |
| Parsi | Parsi (Shahenshahi) | Parsi |

Gregorian is always suggested. A community that spans two calendars (Bengali: India and Bangladesh) asks which one, or shows both.

#### 3.4.4 Festival sets (draft lists; dates come from data)

**Religion sets.** Suggested from the chosen calendars (as in v0: Nanakshahi → Sikh, any Hindu lunisolar calendar → Hindu, Hijri or Solar Hijri → Muslim, Sinhala or Bhutanese → Buddhist, Parsi → Zoroastrian). Christian and Jain are picked directly. Religion is never asked as a question; these are just festival sets to show.
- **Hindu** (pan-Indian): Maha Shivratri, Holi, Ram Navami, Raksha Bandhan, Janmashtami, Ganesh Chaturthi, Navratri, Dussehra, Karva Chauth, Diwali.
- **Muslim**: Ramadan begins, Eid al-Fitr, Eid al-Adha, Islamic New Year, Ashura. Labelled "expected", because moon sighting decides the day.
- **Sikh** (SGPC by default): Prakash Purabs, Shaheedi Purabs (Guru Arjan Dev Ji, Guru Tegh Bahadur Ji), Khalsa Sajna Divas, Bandi Chhor Divas, Hola Mohalla, Gurgaddi and Prakash days of Guru Granth Sahib Ji, Shaheedi Jor Mela.
- **Christian**: Christmas, Good Friday, Easter (Western computus; an Orthodox option only if a community needs it).
- **Buddhist**: Vesak / Buddha Purnima (dates differ by country; each country's date is sourced), Losar, Poson.
- **Jain**: Mahavir Jayanti, Paryushan, Diwali (Mahavir Nirvana).
- **Zoroastrian**: Navroz (Jamshedi), Pateti and Parsi New Year, Khordad Sal.

**Community sets.** One per community in §3.4.3, for example:
- Punjabi: Lohri, Maghi, Basant Panchami, Vaisakhi, Teeyan.
- Tamil: Pongal, Puthandu, Thaipusam, Karthigai Deepam.
- Malayali: Vishu, Onam.
- Bengali: Pohela Boishakh, Durga Puja, Kali Puja.
- Assamese: Bohag, Kati and Magh Bihu.
- Nepali: Dashain, Tihar, Teej. Newar: Mha Puja, Yomari Punhi.
- Afghan, Pashtun, Parsi, Kashmiri: Nowruz.
- Sinhala: Sinhala and Tamil New Year, Vesak, Poson.
- Bhutanese: Losar, Tshechu days that are national holidays.
- Gujarati: Navratri, Uttarayan, Bestu Varas. Marathi: Gudi Padwa. Telugu and Kannada: Ugadi, Sankranti. Sindhi: Cheti Chand.

**Rules.**
- **Neutrality:** include days communities celebrate or observe. Never political anniversaries, war days or days defined against another country or group.
- A festival can ship as a sourced date list before or without its calendar's date line, because festival rules include explicit sourced dates (v0's Bandi Chhor Divas and Hindu festivals work this way).
- A festival in two sets (Diwali in Hindu, Jain and Sikh as Bandi Chhor Divas) appears once per day line.

#### 3.4.5 National days (opt-in)

- A separate **National days** setting: the person ticks the countries whose national days they want. Off by default, and never inferred from a community.
- Only each country's **own official national days**, from that government's official public-holiday list: independence day, republic day or national day (for example Pakistan Day and Independence Day for Pakistan; Republic Day and Independence Day for India; National Day for Bhutan; Independence Day for Sri Lanka, Bangladesh, Afghanistan and the Maldives; Constitution Day for Nepal).
- **Never:** war, victory, defence or martyrs' days, or any day defined against another country.
- **Factual wording only:** "Today: Independence Day (Pakistan)". No flags, no emoji, no greetings, no adjectives. The support card never appears on a national day.

#### 3.4.6 Date rules and the reference place
- **Dates follow the calendar's reference place; the day changes at the user's local midnight.** Someone from Lahore living in Sydney sees, on Sydney's 18 October, the almanac entry for 18 October as published for Amritsar/Lahore. Dates are never recomputed for the user's city.
- Why: it matches how communities use almanacs (diaspora gurdwaras follow the SGPC jantri), every date can be checked against a published source, and no location is ever needed.
- Trade-off: a few festivals timed by the exact start of a tithi can fall a day apart in a diaspora temple's locally computed calendar. Computing for the user's city is to be reconsidered in the future (§3.5), not V1.
- No geolocation. Onboarding may pre-select communities from the browser's language or timezone; the hint is read on the device and never sent anywhere.
- Hijri ignores the tradition that the day starts at sunset and shows the civil-day date. The same civil-day rule applies to every calendar.

#### 3.4.7 Data horizon and sourcing
- **Computed calendars:** generated for 2026-2036 and bundled.
- **Sourced festival lists:** as far ahead as an authoritative almanac publishes, at least 2026-2028, extended later through the remote JSON without a store release. Hindu dates are sourced for 2026-2030 today.
- **Workflow (as for facts):** Claude drafts fixtures and date lists from named almanacs (Drik Panchang for the reference city, Nepal's Panchanga Nirnayak Samiti, Bangla Academy, Tamil and Malayalam panchangams, the SGPC jantri, official government holiday lists), each with a source link. You open the sources and confirm. **Only verified data ships.**

### 3.5 Later versions and not planned

#### V1.x - after launch
- More facts (toward 365+) and photos.
- A tithi line under lunisolar dates.
- **Countdown** to the next festival or a chosen date.
- Custom yearly events (e.g. birthdays) dated in a chosen calendar.
- "Prefer photos and facts from my communities."
- **Reconsider later (owner's decision, 2026-10-17):** computing dates for the user's own city instead of the calendar's reference place (§3.4.6). Not V1; revisit after launch.
- Patreon Shop digital items: printable wall calendar (PDF), wallpaper pack of your own photos.

#### V2
- **Sponsor tile** once there are real users (~10k weekly): one static tile labelled "Sponsor", no tracking parameters, no impression counting, served from the hosted JSON.

#### V3
- Small motion loops: off by default, lazy-loaded. Check Cloudflare's terms for video first.
- Opt-in, streamed music using only clearly licensed tracks.
- Revisit Opera if it ever allows replacing the new tab page.

#### Not planned (any version, for now)
Analytics or tracking · accounts · a backend · donation popups · remote code · Pexels, Pixabay or Unsplash photos · political or controversial content of any kind · UI languages other than English (revisit only by explicit decision).

## 4. Data - What are we storing?

There is no backend and no user database. Data is bundled static content plus the user's own settings in their browser.

### 4.1 Calendar data pipeline
```
scripts/build-calendar.ts  (astronomy-engine, dev-only)
        │  one definition per calendar: reference place, month rules, day rule
        ▼
data/calendar/<calendar>/2026.json … 2036.json   ──► check against the calendar's almanac
        │
        ├─► bundled in the extension (offline, 10 years)
        └─► also published on Cloudflare (corrections without a store release)
```
JSON is data, not code, so this is allowed under MV3 remote-code rules. Load **only the enabled calendars' current-year files** (and next year's in late December, for the Tomorrow line). Calendars that `Intl` or arithmetic can produce ship no data.

### 4.2 Settings and local storage
- Settings live in `storage.sync`, versioned with a `schemaVersion` field so later releases can migrate old settings. A `localStorage` mirror (updated from `storage.sync`) gives an instant first paint; `storage.sync` stays the real source.
- `storage.sync` quotas: 100 KB total, 8 KB per item. Settings only.
- New fields for the South Asia scope: `communities` (community ids), a wider `calendars` id union, a wider `festivalSets` union, `nationalDays` (country codes). Each change bumps `schemaVersion` with a migration.
- `storage.local` (10 MB) holds caches: content JSON, the install date and the last donation-ask date (see §6).
- Photos are cached offline with the Cache API (no permission needed).
- Settings fields are listed in §7.3.

### 4.3 Daily selection
- **Same for everyone on the same day; no server logic.**
- `dayNumber = days since 2026-01-01 (local date)`.
- **Fact**: if one is tagged for one of today's festivals in the person's sets, or for the Gregorian month, use it. Otherwise use `facts[dayNumber % facts.length]`.
- **Photo**: filter to photos tagged with the current Gregorian month (plus untagged ones), then use `pool[dayNumber % pool.length]`. Month tags are Gregorian so they mean the same in every calendar.

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
- **Subjects:** landscapes, rivers, mountains, coasts, architecture, food, crafts, festivals seen from a distance.
- **No identifiable people** as the main subject. **No political imagery, flags, maps or borders, and no disputed places presented as belonging to one country.**
- **Balanced across all eight countries**, for example: Darbar Sahib, Badshahi Mosque, Meenakshi Temple, Kerala backwaters, Sundarbans, Paro Taktsang, Kathmandu Durbar Square, Band-e-Amir, Sigiriya, Maldivian atolls, the Thar desert, Hunza.
- **Seasonal tags:** by Gregorian month (mustard fields in January, monsoon in July).

#### `content/photos.csv` columns
```
id | title | location | country | author | author_url | source_url | license | license_url |
retrieved_on | archive_url | changes | month_tag | bundled
```
- `archive_url`: a web.archive.org snapshot of the source page taken when you collect the photo. It's your proof if the licence changes or the photo is deleted.
- `changes`: e.g. "resized, converted to AVIF".
- `country`: used only to balance the collection, never shown as a claim.

#### Credit line (bottom-right)
`Badshahi Mosque at dusk · Author Name · CC BY-SA 4.0`, linked to the source page.

#### Originals
- Full-size originals live in **`photos-src/<id>.<ext>`**, named by the same `id` as the `photos.csv` row. The folder is **gitignored**: a large file committed once stays in git history for good.
- The CSV (`source_url`, `license`, `archive_url`) is the source of truth. `scripts/optimise-photos.ts` downloads any original that is missing, so a fresh clone can rebuild every output.
- Keep a personal backup of the folder, because Commons files can be deleted or re-licensed. The `archive_url` snapshot, not the image, is the proof of the licence.
- Cropped or edited files go in `photos-src/edited/`, with "cropped" in the CSV `changes` column and the same licence as the original.

#### Output
- AVIF at 1920 px (≈120-200 KB) and 2560 px (≈200-300 KB).
- Hashed filenames, served with `Cache-Control: immutable`.

### 4.5 Facts

**Licence:** CC0 (no rights reserved; anyone may reuse them).
**Language:** English only.
**Target:** 120 verified facts at launch, growing to 365+.

#### Workflow (drafted with Claude, verified by you)
1. Pick a category.
2. Claude drafts ~20 facts, each with **two real source links** found by web search, marked `draft`.
3. You open each source and confirm it supports the fact. Edit or delete anything weak.
4. Mark it `verified`. **Only `verified` facts ship.** The build script filters on this.

#### Rules
- **Length:** 120-220 characters, 1-2 sentences.
- **Sources:** two reliable ones (Britannica, books, government or university sites, museums). Wikipedia is for finding sources, not as one.
- **Balance:** across the eight countries and the major communities, tracked with the `region` column.
- **Categories:** language · food · agriculture · geography and rivers · history (pre-1900 safest) · music and folk arts · crafts · science · sport · festivals · calendars and astronomy.
- **Avoid:** comparisons of religious doctrine, Partition and its blame, wars (1947, 1965, 1971, Kargil and others), disputed territories including Kashmir, 1984, separatist movements, Afghan politics, language politics (Hindi versus regional languages), caste, India-Pakistan politics, living politicians, "who is the real Indian or Pakistani", and unverifiable "first/biggest/oldest" claims.
- **Optional tags:** a festival or Gregorian month, so the fact appears on that day.

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
- **Lazy loading**: onboarding, settings and the donation card load via `import()` only when needed. Calendar formatters and data load per enabled calendar, so a person with three calendars never downloads the other eighteen.
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
| Package excluding bundled photos | < 300 KB (raised from 100 KB for ~20 calendars × 11 years of data; package size does not affect new-tab speed) |
| Bundled photos (6-8 at 1920 px AVIF) | ≈ 1 MB total |
| Data loaded on one new tab | the enabled calendars' current-year files only, a few KB each |

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
tarikh/
├─ entrypoints/newtab/        index.html, main.ts, critical.css
├─ src/
│  ├─ calendars/              one module per calendar, plus a registry
│  ├─ communities/            community list and their suggested calendars and sets
│  ├─ festivals/              rules, sets, today/tomorrow lines, national days
│  ├─ content/                facts.ts, photos.ts (daily selection, cache)
│  ├─ settings/               store.ts, mirror.ts, migrations.ts
│  ├─ ui/                     onboarding, settings, ask card   ← lazy chunks
│  ├─ themes/                 theme ids (palettes in critical.css)
│  └─ strings/                en.ts (all UI strings and transliterations)
├─ data/calendar/<calendar>/  2026.json … 2036.json  (generated, bundled)
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
- **Prefer festival moments**: if an ask is due within a few days of a celebration in the person's sets, show it on that day.
- **Quiet days:** days of mourning in any set (Shaheedi Purabs, Ashura, Good Friday and similar) and national days never show the card.
- **No "I already support" button** (decided).
- A permanent, quiet "Support" link in Settings.

### Sample messages
- "Vaisakhi mubarak! Tarikh is made by one person. Support it →"
- "Eid mubarak! Free, private, no ads. Help keep it that way →"
- "Happy Diwali! Tarikh is free and private. Support it →" (and similar for Pongal, Dashain, Nowruz, Pohela Boishakh, Christmas)
- "Built by one developer for South Asians everywhere. Support the project →"
- "No tracking, no ads, ever. If Tarikh brightens your day, consider supporting it →"

Tone: warm, short, never guilt-tripping. Greetings only for celebrations, never a "mubarak" on a day of mourning.

## 7. UI/UX - How should this look and feel?

### 7.1 Look
- Fast and small first (§1): system font stack only, no web fonts, critical CSS inlined.
- **Themes**: 6-8 colour themes (CSS custom property sets), **3 date styles**, and a **solid-colour (no photo) mode**. `prefers-color-scheme` picks the default theme.
- **Photo**: theme colour paints first, then the daily photo fades in. Credit line bottom-right (format in §4.4). A gradient sits behind text over photos.
- **Festival lines**: "Today: …" / "Tomorrow: …" under the date. Muslim dates are labelled "expected". National days carry the country in brackets.
- **Donation card**: small, inline, one-click close, never over the date (§6).
- Single screen: `entrypoints/newtab/` is the only page. Onboarding, Settings and the donation card are lazy-loaded overlays or panels.

### 7.2 Onboarding (shown when no settings exist)
1. **Welcome + communities**: "Which traditions do you follow?" Pick any number (pre-selected from the browser's language or timezone when it gives a hint). A live preview shows today's date in the suggested calendars and the suggested festival sets.
2. **Look**: theme, date style, photo or solid colour, with a live preview.
3. **Done**: "You can change anything later in Settings ⚙", including calendars, festival sets and national days.

Keep it skippable. Skipping applies sensible defaults (Gregorian plus whatever the language or timezone hint suggests, otherwise Gregorian only; default theme; photo on).

Chrome and Edge show a "Change back?" prompt on the first new tab. Onboarding must show value immediately.

### 7.3 Settings
- **Communities**: pick or remove; changing them offers (never forces) their suggested calendars and sets.
- **Calendars**: on/off and order.
- **Look**: theme · date style · photo or solid colour.
- **Festivals**: sets on/off · Gurpurab source (SGPC / Original Nanakshahi) · Hijri offset (−1/0/+1, labelled "Match your local mosque") · show Today/Tomorrow lines on/off.
- **National days**: countries on/off (all off by default).
- **Fact**: show on/off.
- **Report a mistake / Suggest a feature**: opens the external form (Tally or Google Forms; URL is a placeholder until created).
- **Support Tarikh**: Patreon link.
- **About**: version · "Open source (GPL-3.0)" with repo link · privacy policy · licences and photo credits.

Storage details: §4.2.

### 7.4 Accessibility (V1 requirement)
- WCAG 2.2 AA contrast on every theme. Add a gradient behind text over photos.
- Semantic HTML: `<time datetime>`, and full-text `aria-label`s for calendar dates where the visible text is abbreviated.
- Fully keyboard-operable onboarding and settings, with visible focus.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (used as the default theme).
- Layout holds up at 200% text zoom. Never rely on colour alone.
- `lang="en"` on the page; transliterated names stay in English.

## 8. Deployment - Where and how will this ship?

### 8.1 Hosting (Cloudflare Pages, free)
- Source on GitHub. The `site/` folder deploys to Cloudflare Pages (static; no server, no env vars, no database).
- **Paths:**
  - `/data/manifest.json` (short cache)
  - `/data/calendar/<calendar>/<year>.json`
  - `/data/festivals.json` (sourced festival lists, extended over time)
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
- **Firefox add-on ID:** `wxt.config.ts` has a placeholder. It is the Tarikh placeholder `tarikh@example.org`; replace it with the real ID before the first AMO upload (see §10).

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
- **Single purpose (Chrome):** "Replaces the new tab page with today's date in South Asian calendars, festivals, a daily photo and fact."

## 9. Usage model and constraints (optional)

Established facts only. No expected user count is set; the sponsor-tile decision waits for real numbers (~10k weekly users, §3.5).

- **Operation:** a client-side browser extension that works fully offline from bundled data. Its only network use is fetching public static JSON and photos from Cloudflare Pages, after first paint.
- **Collected: nothing.** No analytics, telemetry, accounts or backend. There is no server-side user data. Community choices stay in the user's browser settings.
- **Explicit non-requirements:** no accounts, no backend, no terms-and-conditions screen or onboarding accept step, no geolocation.

### Privacy and open source
- **Code:** GPL-3.0, public GitHub repo.
- **Facts:** CC0. `content/LICENSE` covers the fact text and the CSV metadata (including the credit columns in `photos.csv`). It does **not** cover the photo files. Facts are written in our own words, never copied from the sources.
- **Photos:** each photo's own licence, credited. A CC BY-SA photo's share-alike applies to that photo only, not to the code or the facts.
- **Name and logo:** not licensed to anyone.
- **Privacy policy must say:**
  - Settings (including chosen communities) are stored in your browser and synced by the browser's own sync if you have it on.
  - Content is downloaded from Cloudflare Pages, and Cloudflare may process IP addresses under its own policy.
  - The feedback form is a third-party service, used only if you open it.
  - Photos are credited to their authors.
- **Say it everywhere** (store listings, repo README, About screen): "Open source (GPL-3.0) · No tracking · No accounts · Works offline", with a repo link.

### Legal approach (decided, not legal advice)
- **No terms-and-conditions screen and no accept step in onboarding.** GPL-3.0 §15-16 already disclaims warranty and liability, the stores' own terms apply to users, and we collect nothing. A forced accept step would add friction to the new tab for little protection.
- **Privacy policy:** a page on the site (`site/privacy.html`), linked from About and the store listings. A "Privacy policy" link is fine in About; it is never a gate.
- **Dates disclaimer** in About and on the privacy page: dates are indicative and follow each calendar's reference almanac, so confirm with your local almanac, gurdwara, temple, mosque or church. Moon-sighting dates are labelled "expected".
- **Photo takedown contact** on the site, because credit is on screen but licences can be mis-tagged.
- **Name and logo** are not licensed to anyone (see above).
- Consider a one-time lawyer review of the privacy page before the V1 launch.

## 10. Open questions / to verify

- [x] **Desi (solar) rules:** settled in v0 (features 3 and 4). A sankranti belongs to the sunrise-to-sunrise day (Amritsar / IST) that contains it, and the sangrand day is day 1 of the new month (Punjab Data's jantri writes "1 Vaisakh (Sangrand)"). Desi shows day and month only, so it has no year number.
- [x] **Bikrami lunisolar:** settled in v0 (feature 4). Months use the same Punjabi names as the desi calendar, then the paksha and day: `Assu Vadi 1, Samvat 2083`. Tithi 1-15 is Sudi and 16-30 is Vadi, read at sunrise. An adhik month takes an `Adhik` prefix, for example `Adhik Jeth Sudi 3`. The Samvat year is Gregorian + 57 from Chaitra Shukla 1 (the day Pratipada begins, so 19 March 2026) and + 56 before it. In a year with an adhik Chaitra (2029) it turns in the nija month, as Drik Panchang dates it.
- [ ] **SGPC jantri** for 2026 and 2027: collect it as test fixtures. Feature 5's festival fixtures come from secondary reproductions of the Nanakshahi 558 jantri (Dekho-ji and Golden Temple Amritsar, 14 Mar 2026 to 14 Mar 2027, with jantri 557 before that), as for feature 3, so a copy of the jantri itself is still to be read, and jantri 559 for later dates.
- [ ] **Authoritative source per new calendar:** name the almanac each calendar is verified against (in its feature spec). Highest risk: Bhutanese lunar (Phugpa), Sinhala, Nepal Sambat.
- [ ] **Community list review:** confirm §3.4.3 (names, which communities, suggested calendars) before the community feature. Open: Kashmiri Pandit (Saptarishi) calendar, Jain Vira Nirvana year, an Orthodox Easter option.
- [ ] **Shaka Amanta variants:** one calendar with per-community month spellings, or separate Marathi, Kannada and Telugu calendars? Decide in its feature spec.
- [ ] **Muslim set:** include Mawlid / Eid Milad-un-Nabi and Shab-e-Barat? (Widely observed, but not by all.)
- [ ] **National days list:** confirm each country's official national days from its government holiday list before the national-days feature.
- [ ] **Clock:** should the page also show the time? (Not discussed yet.)
- [ ] **Uninstall feedback form** via `runtime.setUninstallURL` (no permission needed): yes or no?
- [ ] **Patreon:** confirm Pakistan bank payout at signup.
- [ ] **Feedback form:** create it (Tally or Google Forms) and add the URL. `src/support/links.ts` points at the repository issues page until then.
- [ ] **Patreon page URL:** `src/support/links.ts` holds `https://www.patreon.com/` as a placeholder for the Support link and the ask card. Create the page and set the real URL before the first store upload (feature 19).
- [ ] **Firefox add-on ID:** `wxt.config.ts` has the placeholder `tarikh@example.org`. Replace it before the first AMO upload. The ID is public in the manifest and permanent (changing it later loses users' synced settings). Use `tarikh@<a domain we own>` or a `{GUID}`, **not** a personal email.
- [ ] **Name checks:** a light search (2026-10-17) found no extension or app called Tarikh. Before 1.0.0, check the three stores, a domain for the site and a basic trademark search.
- [x] **GitHub repository rename:** the repository is now `HananSolves/Tarikh` and the in-app links use it. GitHub redirects the old URL.
- [ ] **Public contact address:** decide whether the privacy page needs one, or the feedback form is enough. If an email is needed, use a dedicated address, not a personal one.
- [ ] **Theme names and palettes:** current ids are Punjabi words (Chitta, Raat, Sarson, Phulkari, Mitti, Neela). Revisit the display names for the wider audience; the ids can stay.

## 11. Decision log

Rows before "Scope: all of South Asia" predate the 2026-10-17 pivot; where they mention Punjab-only scope, the pivot rows win.

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
| v0 new tab shows all five calendars and all four festival sets when no settings mirror exists, while `defaultSettings` keeps Gregorian + Desi + Nanakshahi as the skip-onboarding default; an invalid mirror counts as none | ✅ Decided |
| Settings store: `storage.sync` key `settings` is the source of truth and the `localStorage` mirror follows it; one validator (`parseSettings`) serves both; older schemas migrate in memory on read and are not written back; a newer schema is ignored, never overwritten; saving writes `storage.sync` before the mirror | ✅ Decided |
| Themes and date styles: six themes (`chitta`, `raat`, `sarson`, `phulkari`, `mitti`, `neela`; palettes are CSS blocks in `critical.css`, names and palettes still open in §10) with `prefers-color-scheme` choosing `chitta` or `raat` when nothing is stored; three date styles (`list`, `centered`, `compact`) that change layout only; settings schema 2 adds `dateStyle` and `background` (`photo` or `solid`), `background` is stored now and read by the photo layer later, and schema 1 migrates `dark` to `raat` and any other theme to `chitta` | ✅ Decided |
| Hindu and Muslim festival sets: schema 3 adds `festivalSets` (any subset, v2 migrates to cultural + Sikh) and `gurpurabSource` (`sgpc` or `nanakshahi`); Hindu festivals are `dates` rules from Drik Panchang (New Delhi, Smarta where it lists both) for 2026 to 2030 only, because the sunrise tithi is a day off for festivals dated by the midnight, afternoon or evening tithi, and 2031 to 2036 are still to be sourced; Muslim festivals are a `hijri` rule over the Hijri offset and always read "(expected)"; five Sikh Gurpurabs carry an `original` fixed Gregorian date used under Original Nanakshahi (2003), which names its source on the line, while Hola Mohalla, Bandi Chhor Divas and Guru Nanak's Prakash were movable in 2003 and do not change | ✅ Decided |
| Settings panel: a gear on the new tab opens a lazy-loaded native `<dialog>` side sheet; every change applies to the page at once and saves to `storage.sync` straight away (no Save button), and a failed save keeps the change for this tab and says so; calendar order is edited with Up and Down buttons; schema 4 adds `showFestivalLines` and `showFact` (both default `true`; `showFact` is stored now and read by the fact in feature 15); `saveSettings` refuses to overwrite a newer schema in `storage.sync` (`NewerSettingsError`), so an older browser cannot destroy settings written by a newer one; with no settings the panel starts from what the page shows (five calendars, four sets, OS theme); About ships the version and the GPL-3.0 repository link now, while the privacy policy link waits for feature 18 and photo credits for feature 14, and Support and Report a mistake belong to feature 16 | ✅ Decided |
| Support and feedback: `installDate` is written to `storage.local` by the first new tab that finds none (there is no background script); the Patreon ask is due 14 days after it and at least 30 days after `lastAskDate`, which is written when the card is shown (not when it is closed) and before it renders, so a failing write shows nothing; a missing or invalid stored date is rewritten as today and never asks, and a date in the future waits; on a due day a celebration today in the person's festival sets shows the card, a celebration in the next 3 days holds it back, and Shaheedi Purab Guru Arjan Dev Ji, Shaheedi Purab Guru Tegh Bahadur Ji and Ashura are quiet days that never show it; Vaisakhi and the two Eids get their own greeting and other days rotate the two general messages; the card is a lazy inline `<aside>` after the festival lines, loaded after the first frame and idle time; Settings gains one "Support and feedback" section (Support link, Report a mistake or suggest a feature); no setting turns the ask off; the Patreon link and the feedback link (the repository issues page) are placeholders to replace before 1.0.0 | ✅ Decided |
| Accessibility pass: AA contrast on every theme is pinned by a test that parses `critical.css`; the Settings panel has `scroll-padding-top` so its sticky header never hides a focused control; its live regions stay rendered while empty; Dismiss on the ask card moves focus to the gear; the page's top padding never drops below the fixed gear at high zoom; onboarding gets the same checks when it lands | ✅ Decided |
| **Scope: all of South Asia** (Afghanistan, Bangladesh, Bhutan, India, Maldives, Nepal, Pakistan, Sri Lanka) and the diaspora, not only Punjab (2026-10-17) | ✅ Decided |
| **Name: Tarikh** ("date"; also "history") | ✅ Decided |
| V1 ships every calendar in §3.4.1, including full Bhutanese, Sinhala and Parsi calendars, and every community and festival set; no phased regional launch | ✅ Decided |
| People choose **communities** (cultural and linguistic, cross-border), which suggest calendars and festival sets; religion is never asked; everything stays editable | ✅ Decided |
| **Reference place:** each calendar is computed for the place its almanac is published for; the day changes at the user's local midnight; no geolocation and no per-city computation in V1 | ✅ Decided |
| **National days:** opt-in per country, off by default, only each country's own official national days, never war, victory, defence or martyrs' days, factual wording with the country in brackets, no flags or greetings, no ask card | ✅ Decided |
| **Never** political or controversial content: disputed territories (Kashmir included), wars, partitions, national identity disputes, maps and borders | ✅ Decided |
| **English only** for the UI; other languages are off the roadmap until explicitly decided | ✅ Decided |
| Data horizon: computed calendars 2026-2036; sourced festival lists as far as their almanacs publish (at least 2026-2028), extended by remote JSON | ✅ Decided |
| Sourcing: Claude drafts fixtures and date lists from named almanacs with links; the owner verifies; only verified data ships | ✅ Decided |
| New religion sets: Christian, Buddhist, Jain, Zoroastrian; one community festival set per community | ✅ Decided |
| Photos and facts: one balanced pool across South Asia, the same for everyone each day; month tags are Gregorian; "prefer my communities" is V1.x | ✅ Decided |
| Package budget raised to < 300 KB excluding photos; initial JS and CSS budgets unchanged; calendars load per enabled calendar | ✅ Decided |
| **Calendar registry and data (feature 21):** the solar calendar is "Punjabi solar" with stored id `punjabi-solar` (settings schema 5 migrates `desi`); each calendar with generated data has one build-time definition (reference place and generator) and one file per year at `data/calendar/<calendar>/<year>.json`; the page loads the code and data of the enabled calendars only; festival rules read the Punjabi solar and Bikrami files together, so festival lines load both until the festival sets are reworked (features 30 to 34) | ✅ Decided |
