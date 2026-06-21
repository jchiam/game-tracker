## Why

The tracker currently supports three games (HSR, R:1999, N2E) and users want to manage their **Arknights: Endfield** rosters in the same place. Endfield launched recently with ~28 operators, so a minimal first cut establishes the game module now and can grow as the game and its data sources mature.

## What Changes

- Add **Arknights: Endfield** as the 4th game module, following the per-game module pattern (data → service → hook → page → components). N2E is the closest existing template.
- New static catalog `EndfieldOperator { id, name, rarity, class, element, weapon, imageUrl }`, **manually seeded** with ~28 operators (no automated update script in this phase).
- New tracked entity `EndfieldTrackedOperator` extending the catalog with `level` (1–90), `potential` (0–5), and `isFavorited`.
- Operator card shows class + element + weapon badges and a 4/5/6-star rarity indicator; roster search keys are name, class, element, weapon.
- Full **Parties/Lineups** stack for 4-operator squads (`slot_index` 0–3): `partyService`, `useParties`, `PartyCard`, `PartyEditorModal`, `PartiesTab`.
- Wiring into the app shell: `types.ts`, lazy `App.tsx` route, `GameSwitcher`, `SelectionPage`, `index.css` `bg-endfield-sel`, design tokens under `color.endfield`, and a Supabase migration (3 tables + RLS).
- One-shot seed script downloads ~28 operator portraits and uploads them to ImageKit (reuses `imagekit.ts`); images are not committed to the repo.
- **Deferred to Phase 2+** (explicitly out of scope): weapon catalog + equip, gear/relic sets + sub-stats, gear scoring algorithm, skill levels, and the automated weekly update script + GitHub Action.

## Capabilities

### New Capabilities

- `endfield-operator-detail`: Per-operator tracked fields for Arknights: Endfield — level (1–90), potential (0–5), favorite toggle, level-based + alphabetical sort, and Fuse.js search keys (name, class, element, weapon).

### Modified Capabilities

<!-- None. Endfield reuses the shared `roster`, `parties`, `save-behaviour`, and `image-pipeline` capabilities at the spec level; only new DB tables, wiring, and a game-specific detail spec are added. No existing requirement changes. -->

## Impact

- **New code**: `src/data/arknights-endfield/operators.ts`, `src/services/arknights-endfield/{operatorService,partyService}.ts`, `src/hooks/arknights-endfield/{useOperators,useParties}.ts`, `src/pages/arknights-endfield/` (page + components), one-shot seed script under `scripts/`.
- **Modified code**: `src/types.ts` (new `EndfieldOperator`, `EndfieldTrackedOperator`, `EndfieldParty`, `EndfieldPartyMember`), `src/App.tsx`, `src/components/GameSwitcher.tsx`, `src/pages/SelectionPage.tsx`, `src/index.css`, `src/styles/design-tokens.json` (`color.endfield`).
- **Database**: new migration `YYYYMMDD000000_add_endfield_tables.sql` — `endfield_tracked_operators`, `endfield_parties`, `endfield_party_members`, all with RLS + user-scoped policies and the standard indexes.
- **Infra**: ImageKit gains an `endfield` asset folder; CSP `img-src` only changes if a new image domain is introduced (ImageKit is already allowlisted).
- **No breaking changes** to existing games.
