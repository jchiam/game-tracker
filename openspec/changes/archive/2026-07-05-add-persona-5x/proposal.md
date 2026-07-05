## Why

Add **Persona 5: The Phantom X** (P5X) as the fifth tracked game so its roster and
lineups can be tracked alongside HSR, R1999, N2E, and AE. The game has been live
globally since June 2025, has a stable meta (rarity/role/element/Awareness), a
verified structured data source (Prydwen page-data JSON) enabling the same automated
update pipeline HSR and R1999 use, and the AE scope playbook (roster + parties,
equipment deferred) maps onto it directly.

## What Changes

- New per-game module following the game-module pattern: data catalog, service layer,
  hooks, page, and card components for P5X, with entity noun **Thief**.
- New identity: short id `p5x`, route `/persona-5-phantom-x`, DB prefix `p5x`,
  color tokens under `color.p5x`.
- Generated Thief catalog (`src/data/persona-5-phantom-x/thieves.ts`) produced by an
  automated update script over Prydwen's structured page-data JSON (60 units:
  slug, name, codename, persona name, rarity, element, job) — the HSR/R1999 setup,
  not AE's manual seed. Portraits downloaded from Prydwen and uploaded to ImageKit.
- New `scripts/update-p5x-data.mjs` composing `scripts/lib/pipeline.mjs`, plus weekly
  `.github/workflows/update-p5x-data.yml` (cron + manual dispatch, auto-PR).
- Tracked fields per Thief: level (1–80), Awareness (A0–A6), favorite.
- Parties: plain 4-slot lineups (`slot_index` 0–3, HSR shape) via the shared
  `PartiesView` + party persistence factory, with tier + favorite support.
- New Supabase migration: `p5x_tracked_thieves`, `p5x_parties`, `p5x_party_members`
  with RLS.
- One `GAMES` registry entry wiring route, GameSwitcher, and SelectionPage.

Out of scope (Phase 2+): weapons, Revelation cards (P5X's relic system), skill
levels, scoring, Navigator/Elucidator party slots.

## Capabilities

### New Capabilities

- `p5x-thief-catalog`: Generated catalog of P5X Thieves (`ALL_THIEVES`) — entry
  shape (id, name, codename, personaName, rarity 4|5, role, element, imageUrl), the
  Prydwen-sourced update script, and the weekly auto-PR workflow.
- `p5x-thief-detail`: Per-Thief tracked fields — level (1–80), Awareness (0–6),
  favorite toggle, level-based sort, and search keys (name, codename, personaName,
  role, element).

### Modified Capabilities

- `shared-parties`: Add P5X slot-constraint scenario (slot indices 0–3, max 4
  members) and extend the party favorite-toggle and tier requirements' "all games"
  coverage to include P5X.
- `shared-card-collapse`: Bug found while verifying the P5X card — after an edit
  expand/collapse cycle the summary reopened shorter and clipped its static line
  (measurement ran while the summary's collapsed padding was still animating).
  Both height budgets are now measured from never-clipped inner wrappers; the
  summary gains a `.game-card-static-summary-inner` element and the
  measure-only-while-expanded guard is removed as unnecessary.

## Impact

- **New code**: `src/data/persona-5-phantom-x/`, `src/services/persona-5-phantom-x/`,
  `src/hooks/persona-5-phantom-x/`, `src/pages/persona-5-phantom-x/`,
  `scripts/update-p5x-data.mjs`, `.github/workflows/update-p5x-data.yml`.
- **Touched shared files**: `src/types.ts` (P5X types), `src/lib/games.ts` (registry
  entry), `src/index.css` (`bg-p5x-sel`), `src/styles/design-tokens.json`
  (`color.p5x`), `CONTEXT.md` (domain nouns).
- **Database**: new migration `supabase/migrations/*_add_p5x_tables.sql` (3 tables,
  RLS, indexes).
- **Dependencies**: none new — reuses rosterPersistence, PartiesView, GameCardShell,
  AddEntityModal, `scripts/lib/pipeline.mjs`, imagekit lib.
- **CSP/env**: no new external domains at runtime (images resolve through ImageKit);
  seed script source domain is build-time only.
