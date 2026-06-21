## 1. Types & Design Tokens

- [x] 1.1 Add `EndfieldOperator`, `EndfieldTrackedOperator`, `EndfieldParty`, `EndfieldPartyMember` interfaces to `src/types.ts`
- [x] 1.2 Add `color.endfield` class/element accent colors to `src/styles/design-tokens.json`, run `npm run build:tokens`
- [x] 1.3 Add `.game-card-header.bg-endfield-sel` background rule to `src/index.css`

## 2. Data Layer

- [x] 2.1 Create `src/data/arknights-endfield/operators.ts` with `EndfieldOperator` interface + hand-authored `ALL_OPERATORS` (~28 operators: id, name, rarity 4/5/6, class, element, weapon, imageUrl), header noting manual maintenance for Phase 1
- [x] 2.2 Cross-check each operator's rarity/class/element/weapon against two independent wikis while authoring

## 3. Image Pipeline

- [x] 3.1 Add any Endfield-specific transform helper to `src/lib/imagekit.ts` if needed (reuse existing mugshot/avatar helpers otherwise)
- [x] 3.2 Write a one-shot seed script under `scripts/` that downloads ~28 operator portraits from a wiki and uploads them to ImageKit under an `endfield` folder (idempotent, skips already-uploaded)
- [x] 3.3 Run the seed script and confirm portraits resolve via ImageKit CDN

## 4. Database Migration

- [x] 4.1 Create `supabase/migrations/YYYYMMDD000000_add_endfield_tables.sql` with `endfield_tracked_operators` (UUID PK, `profile_id` FK CASCADE, `operator_id`, `level`, `potential`, `is_favorited`, unique `(profile_id, operator_id)`)
- [x] 4.2 Add `endfield_parties` and `endfield_party_members` tables (`slot_index` CHECK 0–3, `UNIQUE(party_id, slot_index)`)
- [x] 4.3 Enable RLS + user-scoped policies (`profile_id = auth.uid()::text`) on all three tables; index `profile_id` on main tables, `party_id` on members

## 5. Service Layer

- [x] 5.1 Create `src/services/arknights-endfield/operatorService.ts` (`loadOperatorsFromDB`, `insertOperator`, `deleteOperator`, `updateOperator`) — each guards on `DB_ENABLED`
- [x] 5.2 Create `src/services/arknights-endfield/partyService.ts` (`loadParties`, `saveParty`, `deleteParty`)
- [x] 5.3 Write `operatorService.test.ts` and `partyService.test.ts` covering DB-disabled and DB-enabled paths

## 6. Hook Layer

- [x] 6.1 Create `src/hooks/arknights-endfield/useOperators.ts` wrapping `useRoster` with level secondary comparator, search keys (name, class, element, weapon), and `updateLevel`/`updatePotential`/`toggleFavorite` via `usePendingSaves`
- [x] 6.2 Create `src/hooks/arknights-endfield/useParties.ts` for party CRUD
- [x] 6.3 Write `useOperators.test.ts` and `useParties.test.ts` using the hoisted-mock pattern (clamp level 1–90, potential 0–5; error paths)

## 7. Page & Components

- [x] 7.1 Create `OperatorCard.tsx` + `.css` — level slider, potential control, class+element+weapon `GameBadge`s, 4/5/6-star rarity indicator, favorite/remove buttons (canonical `.game-card-*` classes)
- [x] 7.2 Create `AddOperatorModal.tsx` — picks operators from `ALL_OPERATORS` (reuse `AddEntityModal.css`)
- [x] 7.3 Create `PartyCard.tsx` + `.css` and `PartyEditorModal.tsx` for 4-slot squads
- [x] 7.4 Create `PartiesTab.tsx` + `.css` container
- [x] 7.5 Create `ArknightsEndfieldPage.tsx` + `.css` composing roster + lineups views with auth gate, load/error states, search, sort
- [x] 7.6 Write component + page tests (`OperatorCard.test.tsx`, `AddOperatorModal.test.tsx`, `PartyCard.test.tsx`, `PartyEditorModal.test.tsx`, `PartiesTab.test.tsx`, `ArknightsEndfieldPage.test.tsx`)

## 8. App Wiring

- [x] 8.1 Add lazy-loaded route in `src/App.tsx` (`/arknights-endfield`)
- [x] 8.2 Add entry to `GAMES` array in `src/components/GameSwitcher.tsx` (id, name, path, icon, color)
- [x] 8.3 Add entry to `GAMES` array in `src/pages/SelectionPage.tsx` (id, name, path, bgClass, imageUrl, description, tag)
- [x] 8.4 Confirm CSP `img-src` in `vercel.json` covers ImageKit (no new domain expected); run `npm run verify:csp`

## 9. Verification

- [x] 9.1 Run `npm run lint && npm run format:check`
- [x] 9.2 Run `npm test` (all unit tests green)
- [x] 9.3 Run `npm run build` (TypeScript strict + Vite build)
- [x] 9.4 Manually verify roster CRUD + parties CRUD against a logged-in session
