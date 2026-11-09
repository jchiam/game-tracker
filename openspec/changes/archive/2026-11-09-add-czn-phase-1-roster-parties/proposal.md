# Proposal

## Why

Users want to track their **Chaos Zero Nightmare** (Super Creative / Smilegate) rosters alongside the seven existing trackers. CZN is a roguelike deck-builder gacha whose persistent per-combatant progression (level, Manifest Ego dupes, Potential tree) and three-combatant teams map directly onto machinery the tracker already has — ZZZ's agent + 3-slot-party module is the structural twin, and P5X's Prydwen page-data pipeline is the data twin. This change is **Phase 1**: data pipeline, combatant roster, and 3-slot parties. Partners (the weapon analog) and Memory Fragments (gear) follow as separate changes.

## What Changes

- Add **Chaos Zero Nightmare** as the 8th game module (`id: 'czn'`, path `/chaos-zero-nightmare`, DB prefix `czn_`, entity noun **Combatant**, modality `roster`), following the per-game module pattern. ZZZ Phase 1 is the closest existing template.
- New automated update script `scripts/update-czn-data.mjs` composing `scripts/lib/pipeline.mjs`, sourcing **Prydwen's Gatsby page-data** via the CloudFront origin the P5X script already uses (`d2ankz0m1a0dsp.cloudfront.net`): list `/page-data/chaos-zero-nightmare/characters/page-data.json` (34 nodes today: `unitId`, `slug`, `name`, `rarity`, `class`, `element`, `faction`) plus per-slug detail page-data for the hashed portrait image paths. Placeholder nodes (`class === 'Unknown'`) are dropped. A hand-curated **overlay seed** `scripts/seeds/czn-combatants.json` (P5X `applyOverlay` / `validateOverlaySeed` shape) covers combatants Prydwen lags on. Weekly GitHub Actions workflow `update-czn-data.yml` auto-creates a PR on changes.
- New generated catalog `src/data/chaos-zero-nightmare/combatants.ts` — `CznCombatant { id, name, rarity, class, element, faction, imageUrl }`. `id` is the Prydwen slug. Rarity `4 | 5`. Class and element are stored verbatim as open strings with data-driven badge maps (live sets: 6 classes — Striker, Vanguard, Ranger, Hunter, Psionic, Controller; 5 attributes — Passion, Order, Justice, Void, Instinct). `faction` is carried as the raw source string for later use but gets **no badge or filter** in this phase.
- New tracked entity `CznTrackedCombatant` with `level` (1–62: base cap 60 + 2 from Unconscious Awakening), `ego` (Manifest Ego rank 0–6, shown as T0–T6), `potentialAttained` (boolean, HSR `tracesAttained` shape), `isFavorited`.
- Combatant card composed from `GameCardShell`: class + element badges, rarity indicator, level slider, Manifest Ego `SegmentedButtons`, Potential toggle.
- Full **Parties** stack for **3-combatant teams** (`slot_index` 0–2) via the shared `PartiesView` config adapter with three uniform `slots` (ZZZ precedent); tier + favorite supported.
- App wiring: `types.ts`, `GAMES` registry entry in `src/lib/games.ts`, `index.css` `bg-czn-sel`, design tokens `color.czn`, Supabase migration (3 tables + RLS), selection cover + switcher icon assets.
- Portraits downloaded from Prydwen (URLs parsed from each run's page-data, never hardcoded) and uploaded to ImageKit under `chaos_zero_nightmare/combatants`; the app resolves them through the standard `getMugshotUrl` / `getAvatarUrl` transforms. No repo images, no CSP change.
- **Deferred to later phases** (explicitly out of scope): Partner catalog/equip/preferences (Prydwen `/partners` page-data exists — Phase 2), Memory Fragment gear + scoring (Phase 3), faction badge/filter, Potential sub-node tracking, per-combatant level-cap tracking.

## Capabilities

### New Capabilities

- `czn-data-pipeline`: Automated CZN catalog update script + weekly workflow — Prydwen list/detail page-data fetch, placeholder filtering, overlay-seed validation and merge, combatant codegen, ImageKit portrait seeding, catalog diff reporting; structured so Phase 2 adds the Partner catalog from the sibling `/partners` page-data.
- `czn-combatant-catalog`: Generated static catalog of CZN Combatants (`ALL_CZN_COMBATANTS`) with verbatim source taxonomy (open class/element strings, raw faction) and the hand-curated overlay seed for combatants the source lacks.
- `czn-combatant-detail`: Per-combatant tracked fields — level (1–62), Manifest Ego rank (0–6, T-prefix), Potential attained toggle, favorite toggle, level-based sort, Fuse.js search keys (name, class, element), and the card's composition over the shared Game Card Shell.

### Modified Capabilities

- `shared-parties`: Add CZN party slot constraints (3 uniform slots, indices 0–2) as a second consumer of `PartyViewConfig.slots`' uniform-reduced-count path; CZN joins the games enumerated under the party favorite toggle and tier requirements.

## Impact

- **New code**: `src/data/chaos-zero-nightmare/combatants.ts` (generated), `scripts/seeds/czn-combatants.json`, `src/services/chaos-zero-nightmare/{combatantService,partyService}.ts`, `src/hooks/chaos-zero-nightmare/{useCombatants,useParties}.ts`, `src/pages/chaos-zero-nightmare/` (page + components), `scripts/update-czn-data.mjs`, `.github/workflows/update-czn-data.yml`.
- **Modified code**: `src/types.ts` (`CznCombatant`, `CznTrackedCombatant`, `CznCombatantPatch`), `src/lib/games.ts`, `src/index.css`, `src/styles/design-tokens.json` (`color.czn` + Storybook token story), `CLAUDE.md` / `CONTEXT.md` game lists.
- **Database**: new migration `czn_tracked_combatants` (CHECKs level 1–62, ego 0–6), `czn_parties` (tier, is_favorited), `czn_party_members` (slot_index CHECK 0–2), all with RLS + user-scoped policies + standard indexes. No RPC changes — party save reuses `save_party` through the existing `assert_game_table` allowlist, which the migration must extend for the `czn_` tables.
- **Infra**: ImageKit gains a `chaos_zero_nightmare` asset folder. No CSP change (Prydwen origin touched only by the Node script).
- **No breaking changes** to existing games.
