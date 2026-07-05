## 1. HSR — DB migrations

- [x] 1.1 Add migration `supabase/migrations/20260706000000_add_tier_to_hsr_parties.sql`: `ALTER TABLE hsr_parties ADD COLUMN tier TEXT;`
- [x] 1.2 Add migration `supabase/migrations/20260706000001_add_favorite_to_hsr_parties.sql`: `ALTER TABLE hsr_parties ADD COLUMN is_favorited BOOLEAN NOT NULL DEFAULT FALSE;`

## 2. HSR — service, hook, config, page

- [x] 2.1 `src/services/honkai-star-rail/partyService.ts`: add `extraSelect: 'tier, is_favorited'`, `extraFromRow: (row) => ({ tier: row.tier, isFavorited: !!row.is_favorited })`, `extraToRow: (party) => ({ tier: party.tier ?? null })` (favorite deliberately absent — copy the R1999 comment); export `toggleFavoriteParty = persistence.toggleFavoriteParty`
- [x] 2.2 `src/hooks/honkai-star-rail/useParties.ts`: import `apiToggleFavorite` + `makeFavoriteToggle`, use `usePartiesBase` destructuring `setParties, partiesRef`, wire `toggleFavoriteParty = makeFavoriteToggle(setParties, partiesRef, apiToggleFavorite)`, add it to the return
- [x] 2.3 `src/pages/honkai-star-rail/components/PartiesTab.tsx`: set `supportsTier: true` and `supportsFavorite: true` in `HSR_PARTY_VIEW`; add `onToggleFavorite` to props and pass it to `PartiesView`
- [x] 2.4 `src/pages/honkai-star-rail/HonkaiStarRailPage.tsx`: pull `toggleFavoriteParty` from `useParties` and pass it as `onToggleFavorite` to `PartiesTab`

## 3. AE — DB migrations

- [x] 3.1 Add migration `supabase/migrations/20260706000002_add_tier_to_ae_parties.sql`: `ALTER TABLE ae_parties ADD COLUMN tier TEXT;`
- [x] 3.2 Add migration `supabase/migrations/20260706000003_add_favorite_to_ae_parties.sql`: `ALTER TABLE ae_parties ADD COLUMN is_favorited BOOLEAN NOT NULL DEFAULT FALSE;`

## 4. AE — service, hook, config, page

- [x] 4.1 `src/services/arknights-endfield/partyService.ts`: add `extraSelect`/`extraFromRow`/`extraToRow` (same shape as HSR) and export `toggleFavoriteParty`
- [x] 4.2 `src/hooks/arknights-endfield/useParties.ts`: wire `makeFavoriteToggle` and expose `toggleFavoriteParty` (same as HSR 2.2)
- [x] 4.3 `src/pages/arknights-endfield/components/PartiesTab.tsx`: set `supportsTier: true` / `supportsFavorite: true` in `AE_PARTY_VIEW`; add + thread `onToggleFavorite`
- [x] 4.5 Drop the AE `endfield` party variant so squads use the canonical card: remove `variantClass: 'endfield'` from `AE_PARTY_VIEW`, strip the dead `.endfield` rules from `PartiesTab.css`, update the tab test to assert the canonical (non-`endfield`) card
- [x] 4.4 `src/pages/arknights-endfield/ArknightsEndfieldPage.tsx`: pass hook `toggleFavoriteParty` to `PartiesTab` as `onToggleFavorite`

## 5. Tests

- [x] 5.1 HSR `partyService.test.ts`: add coverage for extras mapping (`tier`, `is_favorited` load/save) and `toggleFavoriteParty`, mirroring the R1999 service test
- [x] 5.2 AE `partyService.test.ts`: same extras + toggle coverage
- [x] 5.3 HSR + AE `PartiesTab.test.tsx`: assert `supportsTier`/`supportsFavorite` wiring and that `onToggleFavorite` reaches `PartiesView` (favorite star renders)
- [x] 5.4 HSR + AE `useParties.test.ts`: cover optimistic favorite toggle + revert on failure (mirror R1999/N2E hook tests)

## 6. Verify

- [x] 6.1 Run `npm test` — all party/service/hook/tab suites green
- [x] 6.2 Run `npm run lint && npm run format:check`
- [x] 6.3 Run `npx openspec validate --all`
- [x] 6.4 Manually verify tier banner + favorite star render and persist on HSR Party and AE Squad cards (dev server)
