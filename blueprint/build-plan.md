# Build Plan

The features that make up Aaj Da Din, high level and in build order. Each item is
one line; the details come later in `/feature`.

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
- [ ] 7. **Bundled photos and placeholder fact** - 2–3 photos with credit line, one fact, daily selection, plus the v0 sign-off checks (three browsers, offline, first paint, budgets).

## V1 — Public launch

- [x] 8. **Settings store** - `storage.sync` with `schemaVersion`, migrations and the `localStorage` mirror.
- [x] 9. **Themes and date styles** - 6–8 colour themes, 3 date styles, solid-colour (no photo) mode.
- [x] 10. **Hindu and Muslim festival sets** - joined festival lines, "expected" labels, Gurpurab source switch (SGPC / Original Nanakshahi).
- [x] 11. **Settings panel** - lazy-loaded; calendars, look, festivals, Hijri offset, fact toggle, About.
- [ ] 12. **Onboarding** - three skippable screens with live preview; default festival sets follow the chosen calendars.
- [ ] 13. **Content pipeline** - `photos.csv` / `facts.csv`, build and optimise scripts, verified-only filter, post-paint remote refresh.
- [ ] 14. **Daily photo** - 60 photos (6–8 bundled), month tags, tomorrow's photo prefetched, credit line.
- [ ] 15. **Daily fact** - 120 verified facts with festival and month tags.
- [x] 16. **Support and feedback** - Patreon ask card (14 days, monthly, festival moments), Support link, Report a mistake / Suggest a feature link.
- [ ] 17. **Accessibility pass** - WCAG 2.2 AA contrast, keyboard operation, reduced motion, 200% zoom.
- [ ] 18. **Content site and privacy policy** - Cloudflare Pages `site/`, headers, privacy page, dates disclaimer, photo takedown contact.
- [ ] 19. **Store release 1.0.0** - icons, screenshots, listings for Chrome, Edge and Firefox, real Firefox add-on ID, changelog.
