## Why

Every tracker in the app today is a live-service gacha roster: catalog entities the player pulls, levels, equips, and slots into parties. The next thing to track — a physical collection of Digimon digivices and virtual pets — has none of that shape. It has an ownership state, a condition, an acquisition date, and a single question: "how complete is my collection, per line?" Bolting it onto the "Select Game" grid as a seventh gacha-style card would misdescribe it to the user and leave no seam for the other non-gacha things worth tracking later (trading-card sets, amiibo, console libraries, tabletop miniatures). This change introduces **Tracker Modality** as a first-class concept on the home page and the registry, and ships the Digimon device collection as the first entry of the new `collection` modality.

## What Changes

- **Tracker Modality registry.** New `src/lib/modalities.ts` declares the ordered set of modalities — `roster` (live-service gacha rosters) and `collection` (physical collectibles) — each with a home-page section title and subtitle. `Game` entries in `src/lib/games.ts` gain a required `modality` field; registry tests assert every entry's modality exists.
- **Home page grouped by modality.** `SelectionPage` renders one titled section per modality that has at least one entry, each with its own `selection-grid`. The hero copy generalises from "Select Game" to a tracker-neutral heading. Empty modalities render nothing. The three-column grid rules apply per section unchanged.
- **GameSwitcher grouped by modality.** The dropdown renders a labelled group per populated modality in modality order. Active-game highlighting and the selection-page hide are unchanged.
- **`RosterPageLayout` second-view slot generalised.** The `partiesTab` prop is renamed `secondView` (its label prop `secondViewLabel` already is generic). Six existing pages update the prop name; no behaviour changes.
- **Digimon device collection (`dgm`).** New per-game module under `digimon/` with a hand-seeded, script-generated catalog of digivice / virtual-pet releases, a `dgm_tracked_devices` table, a `useDevices` roster hook, a `DeviceCard` over `GameCardShell` (status / condition / acquired date / notes), an `AddDeviceModal` over `AddEntityModal`, and a **Completion** second view showing owned-vs-catalog progress per product line. No parties, no equipment, no scoring.
- **Seed-driven catalog generation.** `scripts/update-dgm-data.mjs` reads a hand-authored seed (`scripts/seeds/dgm-devices.json`) plus local images, uploads images to ImageKit via the shared pipeline, and generates `src/data/digimon/devices.ts`. The seed is curated by hand and is the source of truth, so the "never hand-edit `src/data`" rule holds; Wikimon is the identified fact source for a later drift-reporting sync (design D6), and Humulos is reserved for the future evolution-guide tracker, not the catalog.
- **Domain language.** `CONTEXT.md` gains a "Tracker Modality" section and a Digimon row in the games table (entity noun **device**; the tracked set is called the **collection**, an alias of roster in shared machinery).

## Capabilities

### New Capabilities

- `shared-tracker-modality`: the modality registry, its invariants, home-page sectioning, and switcher grouping.
- `dgm-device-catalog`: the seed-generated static catalog of Digimon digivice / virtual-pet releases and its generator script.
- `dgm-device-tracking`: tracked-device persistence, hook, page, card, and add-modal behaviour (ownership status, condition, acquisition date, notes, favorite).
- `dgm-completion-view`: the per-line completion second view (owned / total, percentage, progress bar).

### Modified Capabilities

- `shared-game-registry`: each entry carries a `modality` referencing the modality registry; registry invariants include modality validity.
- `selection-page-layout`: the grid requirements apply to every per-modality section rather than one page-level grid; adds the section structure requirement.
- `shared-ui-components`: `GameSwitcher` groups entries by modality.
- `shared-roster`: the layout's second-view slot is modality-neutral (`secondView`), not parties-specific.

## Impact

- **Code:** `src/lib/games.ts`, new `src/lib/modalities.ts`, `src/pages/SelectionPage.tsx` (+ css/test), `src/components/GameSwitcher.tsx` (+ css/test), `src/components/RosterPageLayout.tsx` (+ stories) and the six game pages (prop rename), new `src/{data,services,hooks,pages}/digimon/**`, `src/types.ts`, `src/index.css` (`.bg-dgm-sel`), `src/styles/design-tokens.json` (`color.dgm`).
- **Database:** new migration `supabase/migrations/20260912000000_add_dgm_tables.sql` — `dgm_tracked_devices` with RLS, `(profile_id, device_id)` unique, `profile_id` index. No RPCs; single-row writes only.
- **Scripts / CI:** new `scripts/update-dgm-data.mjs` + `scripts/seeds/dgm-devices.json`; new `.github/workflows/update-dgm-data.yml` (manual dispatch only — no weekly cron, the seed only changes by hand).
- **Assets / CSP:** device images live on ImageKit under `/assets/digimon/devices/{id}.webp`; no new external domain, no CSP change.
- **Docs:** `CONTEXT.md` (Tracker Modality, Digimon row), `CLAUDE.md` (game list, wiring checklist gains the modality step), Storybook (`RosterPageLayout` stories prop rename; no L4 stories).
- **Non-breaking to users:** existing six games keep their routes, tables, and behaviour; only the home page and switcher gain grouping.
