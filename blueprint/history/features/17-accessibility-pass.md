# Feature: Accessibility pass

**From build-plan:** feature 17
**Build attempt:** 1
**Branch:** feature/accessibility-pass
**Status:** verified

## Goal

Meet plan §7.4 on what exists today: WCAG 2.2 AA contrast on every theme, keyboard operation of Settings and the support card with visible focus, reduced motion, 200% zoom, and no reliance on colour alone. This is an audit-then-fix pass, so the first move is to measure; only gaps found get changed.

### Audit findings that shape the scope

Read from the code before building (the evidence step re-checks them in both browsers).

| Plan §7.4 item | State today | Action |
|---|---|---|
| AA contrast on every theme | Measured: body text 6.35 to 15.46, muted text 5.00 to 7.71 across all six themes and the OS defaults (all at least 4.5) | Pin it with a test that reads `critical.css`, so a new or edited theme cannot regress |
| `<time datetime>` and full-text labels | Every date is a `<time datetime>` and its visible text is already spelled out ("17 October 2026", "Kattak", "AH", "Samvat"), so an `aria-label` would repeat it | None; confirm in the accessibility tree |
| Keyboard, visible focus | Native `<dialog>` gives focus trap and Esc; every control has a 2px `--fg` focus ring; the sticky Settings header can cover a focused control while tabbing (WCAG 2.2 2.4.11 Focus Not Obscured) | Add `scroll-padding-top` to the panel |
| Keyboard, support card | Dismiss removes the card while it holds focus, so focus drops to the page | Move focus to the gear button, which is the next focusable element in the DOM |
| Screen reader announcements | `.error:empty` and `.note:empty` are `display: none`, so the "moved to position N of M" live region is not in the accessibility tree until it has text, and an announcement is unreliable | Keep the regions rendered when empty (an empty `<p>` has no height, only its margin needs removing) |
| Reduced motion | No `transition`, `animation` or `scroll-behavior` exists in any stylesheet, so nothing needs guarding | None now; feature 14's photo fade must honour it (plan §4.4) |
| 200% zoom, reflow | Sizes are rem or clamp; the panel is full width under 40rem. The fixed gear (top 0.5rem, 2.75rem tall) may overlap the first date row at small viewports | Measure at 640x360 and 320x256 CSS px in both browsers; fix only a real overlap or overflow |
| Colour alone | "Today:", "Tomorrow:" and "(expected)" are text; links keep their underline | None |
| `lang` | `<html lang="en">` is set | None |

### Decisions this spec records

- **Contrast is tested, not asserted by hand.** The theme colours live only in `critical.css` (one source, inlined for first paint), so the test parses that file rather than duplicating colours in TypeScript.
- **Target is AA only.** Text and focus rings at least 4.5:1 and 3:1. No AAA, no high-contrast theme, no `forced-colors` rules: the native controls and system colours already behave there and a new surface is not an established requirement.
- **No new heading, skip link or landmark.** The page is one `<main>` with a list of dates; a skip link on a page with a handful of tab stops would be machinery without a need.

## In scope

- `tests/contrast.test.ts` (new): the contrast test.
- `src/ui/settings-panel.css`: scroll padding, live regions kept rendered.
- `src/ui/ask-card.ts`: focus returns on dismiss.
- `entrypoints/newtab/critical.css`: only if the zoom evidence shows a real overlap or overflow.

## Out of scope

- The gradient behind text over photos (plan §7.4): there is no photo layer until feature 14, which owns it.
- Onboarding (feature 12), which will need the same keyboard and focus checks when it lands.
- Punjabi or other languages, a screen-reader test on real assistive software, an automated a11y runner or any new dependency, new settings, new strings.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`, so there are no checkpoint commits; `/complete` makes the single commit. Each step leaves `pnpm typecheck`, `pnpm lint` and `pnpm test` green.

## Build steps

- [x] **1. Contrast test.**
  - `tests/contrast.test.ts`: read `entrypoints/newtab/critical.css`, collect the `--bg`, `--fg` and `--muted` of the `:root` default, the dark `prefers-color-scheme` block and each `:root[data-theme="..."]` block, and compute WCAG relative luminance and contrast ratio.
  - Assert `--fg` and `--muted` are at least 4.5:1 against `--bg` for every set, and that every id in `themeIds` has a block (so a new theme cannot skip the check). Add a known-pair sanity check (black on white is 21:1) so a broken parser or formula cannot pass silently.
  - **Done when:** `pnpm test` passes and the test fails when a theme colour is changed to a low-contrast value (checked once by hand, then reverted).

- [x] **2. Panel and card fixes.**
  - `settings-panel.css`: `scroll-padding-top` on `.settings` at least the sticky header height; replace the `display: none` on `.error:empty` and `.note:empty` with `margin: 0`.
  - `ask-card.ts`: on Dismiss, focus `#settings-open` after removing the card (no-op if it is missing).
  - **Done when:** `pnpm typecheck` and `pnpm lint` pass; step 3 evidence shows the focus lands on the gear, a focused control is never under the header, and the live regions are in the accessibility tree while empty.

- [x] **3. Browser evidence, Chrome and Firefox.**
  - Build both. On each, with a fresh profile: tab through Settings (every control reachable in order, focus ring visible, Esc closes, focus returns to the gear), drive the reorder buttons by keyboard and read the live region text, check the accessibility tree for the date rows and the two live regions, and render each of the six themes at 200% (640x360 CSS px) and 400% (320x256) with all three date styles, checking for horizontal scroll and for the gear overlapping text. Force the ask card (set `installDate` and `lastAskDate` in `storage.local`) and dismiss it with the keyboard.
  - Fix only what the evidence shows (`critical.css` for zoom). Report each case per browser as observed or not run.
  - **Evidence changed the scope once:** at 200% and 400% zoom the first date row sat under the fixed gear (`#app` top padding could shrink to 2rem, the gear ends at 3.25rem), so the `clamp` floor in `critical.css` rose to 3.75rem. Unchanged at normal heights (14vh wins above 429px).
  - **Done when:** the cases above are observed on both browsers, or a case is named as not run with the reason.

- [x] **4. Self-review and full gate.**
  - Re-read the diff against this spec and `coding-standards.md`: no new strings, no unused code, comments only for the why, no em dashes.
  - **Done when:** `pnpm check` passes.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":6722,"specSha256":"5a9b24e7243772a622bd0c04ca0b104afc76b94d68c9a359de84acdcb0b53242","branch":"refs/heads/feature/accessibility-pass","head":"47df2bf686c215343bcb4d02367a360dad6d573d","baseRef":"refs/heads/main","baseCommit":"47df2bf686c215343bcb4d02367a360dad6d573d","sourceTree":"e08ac4f83ab1fff294eee3a2b9f12a9947b65140","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Run `pnpm build`, load `.output/chrome-mv3` unpacked and open a new tab.
2. Press Tab: the gear should show a focus ring. Press Enter to open Settings, Tab through it, then Esc: focus should return to the gear.
3. Zoom the page to 200% and 300% and switch themes in Settings. The first date row should stay clear of the gear.
