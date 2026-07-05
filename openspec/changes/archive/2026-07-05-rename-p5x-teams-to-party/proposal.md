## Why

The Persona 5: The Phantom X module labels its lineup feature "Teams" (view label, party noun, header, default name, subtitle, catalog description). Every other game uses a proper party-flavored noun (HSR "Parties", R1999/N2E "Lineups", AE "Squads"). Renaming P5X's flavor noun to "Party" aligns the wording with the shared party vocabulary and the module's own `useParties`/`partyService` internals.

## What Changes

- P5X `secondViewLabel` changes from `"Teams"` to `"Parties"`.
- P5X `PartyViewConfig` nouns change: `party: 'Team' → 'Party'`, `partiesLower: 'teams' → 'parties'`, `header: 'Your Teams' → 'Your Parties'`.
- P5X page subtitle changes from `"...and build teams."` to `"...and build parties."`.
- P5X `partyService` `defaultName` changes from `'New Team'` to `'New Party'`.
- P5X game registry description changes from `"...and team compositions."` to `"...and party compositions."`.
- Stale "team" references in P5X comments (`partyService.ts`, `PartiesTab.css`) and tests (`P5xPage.test.tsx`, `PartiesTab.test.tsx`, `useParties.test.ts`, `partyService.test.ts`) updated to "party".
- No behavior, schema, or data-flow change — user-facing and internal wording only.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-parties`: add a requirement pinning P5X's party-view display noun to "Party"/"Parties" (previously unspecified — the flavor noun was config-only), so the rename is regression-tested. No behavioral change to party CRUD, slots, tier, or favorite.

## Impact

- `src/pages/persona-5-phantom-x/P5xPage.tsx` — `secondViewLabel`, subtitle
- `src/pages/persona-5-phantom-x/components/PartiesTab.tsx` — `PartyViewConfig` nouns
- `src/pages/persona-5-phantom-x/components/PartiesTab.css` — comment
- `src/services/persona-5-phantom-x/partyService.ts` — `defaultName`, comment
- `src/lib/games.ts` — P5X registry description
- P5X tests: `P5xPage.test.tsx`, `components/PartiesTab.test.tsx`, `hooks/.../useParties.test.ts`, `services/.../partyService.test.ts`
- No DB migration, no data-pipeline, no shared-code change.
