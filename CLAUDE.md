# Aaj Da Din

Punjabi new-tab browser extension (Chrome, Edge, Firefox). **Read [docs/PLAN.md](docs/PLAN.md) first.** It holds all agreed scope, versions and decisions. Current milestone: **v0** (see PLAN §3).

## Non-negotiables
- Speed and size come first: no runtime dependencies without a strong reason, no UI framework, system fonts, lazy-load anything not needed for first paint. Respect the size budgets in PLAN §9.
- Permissions: `storage` only. No background script, no host permissions, no content scripts.
- No analytics, tracking, accounts or backend. No remote code (remote JSON data is fine).
- Calendar correctness is tested against SGPC jantri / panchang fixtures. Never "fix" a date without a source.
- Don't add features the plan lists as dropped or deferred without asking.
- Photos: Wikimedia Commons / Openverse only, licences CC0, PD, CC BY, CC BY-SA. Facts ship only when `status = verified`.
