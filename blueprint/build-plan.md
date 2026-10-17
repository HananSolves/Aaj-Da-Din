# Build Plan

The features that make up Tarikh, high level. Each item is
one line; the details come later in `/feature`.

Numbers are stable IDs, not positions: the order of the lines is the build order.
Items 20 onward were added on 2026-10-17 when the scope grew from Punjab to all of
South Asia (`project-plan.md` §3.4), and they come before the remaining V1 items
that depend on them.

Run `/feature` to spec the next unchecked item, or `/feature 2` to pick one.
Keep completed items checked and append new features as the project grows.
Do not renumber completed features; their archived specs refer to those IDs.

Scaffolding (WXT project, CI, size check, Gregorian formatter) is done and is not
a feature. V1.x, V2 and V3 items are deferred in `project-plan.md` §3.5 and are
not listed here.

## v0 — Internal prototype

- [x] 1. **Nanakshahi calendar** - original 2003 fixed-month arithmetic, tested against a published source.
- [x] 2. **Hijri calendar** - umm al-Qura via `Intl` with the −1/0/+1 offset.
- [x] 3. **Desi and Bikrami data build** - `build-calendar.ts` generates sangrand, tithi and Purnimanta data for 2026–2036; fixtures checked against the SGPC jantri and a panchang.
- [x] 4. **Desi and Bikrami lookups** - read the current year's generated data (next year's in late December); settles the sangrand-day and adhik-month questions.
- [x] 5. **Festival resolver (cultural + Sikh)** - festival data and the "Today:" / "Tomorrow:" lines, SGPC dates.
- [x] 6. **Bare new tab** - all five calendars and festival lines, one theme, solid background, instant paint from the settings mirror.
- [ ] 7. **Bundled photos and placeholder fact** - 2–3 photos with credit line, one fact, daily selection, plus the v0 sign-off checks (three browsers, offline, first paint, budgets). v0 stays the Punjabi-calendar proof of the engine.

## V1 — Public launch

- [x] 8. **Settings store** - `storage.sync` with `schemaVersion`, migrations and the `localStorage` mirror.
- [x] 9. **Themes and date styles** - 6–8 colour themes, 3 date styles, solid-colour (no photo) mode.
- [x] 10. **Hindu and Muslim festival sets** - joined festival lines, "expected" labels, Gurpurab source switch (SGPC / Original Nanakshahi).
- [x] 11. **Settings panel** - lazy-loaded; calendars, look, festivals, Hijri offset, fact toggle, About.

### South Asia expansion

- [x] 20. **Rename to Tarikh** - package and manifest names, page title, strings, storage key prefix, Firefox ID placeholder, README, GitHub repository.
- [x] 21. **Calendar registry and per-calendar data** - each calendar declares its reference place and rules; one generated JSON per calendar per year; the page loads only enabled calendars; package budget to 300 KB; Desi becomes "Punjabi solar".
- [ ] 22. **Intl and arithmetic calendars** - Solar Hijri (Afghan month names), Indian National (Saka), Bangla (Bangladesh revised).
- [ ] 23. **Hindu lunisolar variants** - Vikram Samvat Purnimanta (Hindi names), Vikram Samvat Amanta Kartikadi (Gujarati), Shaka Amanta (Marathi, Kannada, Telugu, Konkani).
- [ ] 24. **Tamil and Malayalam calendars** - Tamil solar and Malayalam (Kollam), with their sankranti day rules and reference places.
- [ ] 25. **Eastern solar calendars** - Bengali (traditional), Odia and Assamese.
- [ ] 26. **Nepali calendars** - Bikram Sambat (official) and Nepal Sambat, verified against Nepal's published calendar.
- [ ] 27. **Sinhala calendar** - Sinhala months, Poya days and the Buddhist Era year.
- [ ] 28. **Bhutanese lunar calendar** - Phugpa months and days; blocked until a verifiable source is found.
- [ ] 29. **Parsi calendars** - Shahenshahi, Kadmi and Fasli.
- [ ] 30. **Communities** - the community list, each community's suggested calendars and festival set, settings schema with `communities`, a Communities section in Settings.
- [ ] 31. **Religion sets** - Christian, Buddhist, Jain and Zoroastrian sets beside Hindu, Muslim and Sikh; one festival appears once per day line.
- [ ] 32. **Festivals: north, west and Afghanistan** - community sets for Punjabi, Sindhi, Kashmiri, Pashtun, Baloch, Afghan, Hindi-speaking north, Rajasthani, Gujarati, Marathi, Konkani and Parsi.
- [ ] 33. **Festivals: south and Sri Lanka** - community sets for Tamil, Telugu, Kannada, Malayali, Sinhala and Maldivian.
- [ ] 34. **Festivals: east, Nepal and Bhutan** - community sets for Bengali, Odia, Assamese, Nepali, Newar and Bhutanese.
- [ ] 35. **National days** - opt-in per country, official national days only, neutral wording, quiet days for the ask card.

### Launch

- [ ] 12. **Onboarding** - three skippable screens with live preview; pick communities, which suggest calendars and festival sets; language or timezone hint pre-selects.
- [ ] 13. **Content pipeline** - `photos.csv` / `facts.csv`, build and optimise scripts, verified-only filter, post-paint remote refresh.
- [ ] 14. **Daily photo** - 60 photos (6–8 bundled) balanced across the eight countries, Gregorian month tags, tomorrow's photo prefetched, credit line.
- [ ] 15. **Daily fact** - 120 verified facts balanced across South Asia, with festival and month tags.
- [x] 16. **Support and feedback** - Patreon ask card (14 days, monthly, festival moments), Support link, Report a mistake / Suggest a feature link.
- [x] 17. **Accessibility pass** - WCAG 2.2 AA contrast, keyboard operation, reduced motion, 200% zoom.
- [ ] 18. **Content site and privacy policy** - Cloudflare Pages `site/`, headers, privacy page, dates disclaimer (reference almanacs), photo takedown contact.
- [ ] 19. **Store release 1.0.0** - Tarikh icons, screenshots, listings for Chrome, Edge and Firefox, real Firefox add-on ID, changelog.
