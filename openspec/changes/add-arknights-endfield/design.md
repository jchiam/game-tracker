## Context

The tracker uses a per-game module pattern (data → service → hook → page → components) with shared infrastructure (`useRoster`, `usePendingSaves`, `Modal`, `GameSwitcher`, ImageKit). Three games already follow it. Adding **Arknights: Endfield** is mostly applying that pattern; the only novel constraints are (a) Endfield is brand-new so there is no clean structured data source, and (b) the scope is deliberately minimal (level + potential, no equipment/scoring yet). N2E is the closest template — same `extends {Entity}` tracked shape, level-based sort, and multi-key fuzzy search.

## Goals / Non-Goals

**Goals:**

- Ship a working Endfield roster + 4-slot parties module that matches the conventions of the existing three games.
- Track `level` (1–90) and `potential` (0–5) per operator, with favorite toggle, level/alpha sort, and name/class/element/weapon search.
- Seed ~28 operators manually and get their portraits onto ImageKit via a one-shot script.
- Reuse the shared `roster`, `parties`, `save-behaviour`, and `image-pipeline` capabilities without modifying them.

**Non-Goals:**

- Weapon catalog + equipment, gear/relic sets + sub-stats, gear scoring algorithm, skill levels (all Phase 2+).
- Automated weekly update script + GitHub Action (Phase 2+ once a stable data source exists).
- Any change to existing game modules.

## Decisions

### Manual seed instead of an automated update script

Endfield has no clean structured catalog source. The only automated archive (`daydreamer-json/ak-endfield-api-archive`) holds launcher/CDN download manifests and encrypted asset-bundle indexes — no parsed operator stats; extracting them would require unpacking Unity bundles. Rendered databases (prydwen, game8, wiki.gg) are HTML-only and brittle to scrape. With only ~28 operators and a light identity schema (name, rarity, class, element, weapon, image), a hand-authored `ALL_OPERATORS` array is cheaper and more reliable than a scraper.

- **Alternative — HTML scrape now**: rejected as brittle and higher-maintenance for marginal benefit at this roster size.
- **Alternative — unpack the asset archive**: rejected as far too heavy for identity fields only.
- **Consequence**: `src/data/arknights-endfield/operators.ts` is hand-authored. This is a deliberate, documented exception to the "never hand-edit `src/data/**`" rule for this phase; a Phase-2 update script will take over generation. The file header notes this.

### One-shot seed script for images

Images are not committed to the repo (project convention). A throwaway/seed script downloads the ~28 portraits from a wiki once and uploads them to ImageKit, mirroring how the update scripts handle assets — but without the weekly cron. `operators.ts` references local `/assets/arknights-endfield/operators/{id}.webp` paths that `imagekit.ts` resolves to CDN URLs, exactly like the other games.

### Tracked entity shape mirrors N2E

`EndfieldTrackedOperator extends EndfieldOperator` with `level`, `potential`, `isFavorited`, and `dbId`. The hook (`useOperators`) wraps the shared `useRoster` with a level secondary comparator and the four search keys. All writes route through `usePendingSaves` (1000 ms debounce). No new save semantics.

### Parties reuse the shared pattern at 4 slots

Endfield combat squads are 4 operators. Tables and components copy the HSR/N2E party stack with `slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 3)` and `UNIQUE(party_id, slot_index)`. No new capability spec — the shared `parties` spec already covers the behavior.

### Database

New migration `YYYYMMDD000000_add_endfield_tables.sql` adds three tables following the documented conventions: `endfield_tracked_operators` (unique `(profile_id, operator_id)`, columns for `level`, `potential`, `is_favorited`), `endfield_parties`, and `endfield_party_members`. UUID PKs, `profile_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE`, RLS enabled with user-scoped policies (`profile_id = auth.uid()::text`), index `profile_id` on main tables and `party_id` on members.

### Design tokens & wiring

Add `color.endfield` (class/element accent colors) to `design-tokens.json`, run `build:tokens`, and add `.game-card-header.bg-endfield-sel` to `index.css`. Wire the lazy route in `App.tsx`, and entries in `GameSwitcher` and `SelectionPage`. Card renders class + element + weapon badges via `GameBadge` and a 4/5/6-star rarity indicator.

## Risks / Trade-offs

- **Hand-authored catalog drifts from the live game** → Mitigation: small roster, easy to update by hand; Phase 2 replaces it with a generated file. File header flags it as manually maintained for now.
- **Manual seed data accuracy (class/element/weapon/rarity per operator)** → Mitigation: cross-check values against two independent wikis (wiki.gg + game8/icy-veins) when authoring the array.
- **Wiki portrait sourcing for the seed script** → Mitigation: script is idempotent and re-runnable; if a wiki blocks hotlinking the download step can be pointed at an alternate source without touching app code.
- **Non-atomic preference saves** known limitation does not apply — this phase has no preference chains (no gear scoring).

## Migration Plan

1. Land code + the new Supabase migration on a branch; apply the migration to the Supabase project.
2. Run the one-shot seed script to populate ImageKit with operator portraits.
3. Verify the route, roster CRUD, and parties CRUD against a logged-in session; run `npm test` and `npm run verify:csp`.
4. Rollback: the migration only adds new tables (no changes to existing ones), so dropping the three `endfield_*` tables fully reverts the DB; reverting the code commit removes the route and module.

## Open Questions

- None blocking. Phase-2 data source for the automated update script remains undecided and is intentionally out of scope here.
