## 1. Types

- [x] 1.1 Remove `resonanceCount: number` from `N2ETrackedCharacter` in `src/types.ts`
- [x] 1.2 Remove `resonanceCount?: number` from `N2ECharacterPatch` in `src/types.ts`

## 2. Service layer

- [x] 2.1 Remove `resonanceCount: 'resonance_count'` from the field map in `src/services/neverness-to-everness/characterService.ts`
- [x] 2.2 Remove `resonance_count` from the select column list in the load query
- [x] 2.3 Remove `resonanceCount: row.resonance_count ?? 0` from the row→model mapping
- [x] 2.4 Remove `resonance_count: 0` from the insert default payload

## 3. Hook layer

- [x] 3.1 Remove `resonanceCount: 0` from the default tracked-character state in `src/hooks/neverness-to-everness/useCharacters.ts`
- [x] 3.2 Remove the `updateResonanceCount` function
- [x] 3.3 Remove `updateResonanceCount` from the hook's returned object

## 4. Page + component

- [x] 4.1 Remove `updateResonanceCount` from the hook destructure and the `onUpdateResonance` prop passed to `CharacterCard` in `src/pages/neverness-to-everness/N2ePage.tsx`
- [x] 4.2 Remove the `onUpdateResonance` prop from the `CharacterCardProps` interface and signature in `src/pages/neverness-to-everness/components/CharacterCard.tsx`
- [x] 4.3 Remove the Resonance `ProgressSection` block (the resonance slider) from `CharacterCard.tsx`
- [x] 4.4 Remove the `resonancePs` (`getProgressStyle(character.resonanceCount, 0, 6)`) style and `awakeningCount`-adjacent resonance references in `CharacterCard.tsx`

## 5. Database migration

- [x] 5.1 Create `supabase/migrations/20260624000000_drop_n2e_resonance_count.sql` with `ALTER TABLE n2e_tracked_characters DROP COLUMN resonance_count;`

## 6. Tests / fixtures

- [x] 6.1 Remove `resonanceCount` from fixtures in `src/utils/cartridgeScoring.test.ts`
- [x] 6.2 Remove resonance assertions/fixtures from `src/hooks/neverness-to-everness/useCharacters.test.ts` (incl. the `updateResonanceCount` clamp test)
- [x] 6.3 Remove `resonance_count` from `src/services/neverness-to-everness/characterService.test.ts` fixtures and assertions
- [x] 6.4 Remove `resonanceCount` / `onUpdateResonance` / `updateResonanceCount` mocks from `src/pages/neverness-to-everness/N2ePage.test.tsx`, `CharacterCard.test.tsx`, `CartridgeEditorModal.test.tsx`, and `AddCharacterModal.test.tsx`

## 7. Verification

- [x] 7.1 Run `npm run build` (tsc) and resolve any remaining `resonanceCount` / `onUpdateResonance` references it surfaces
- [x] 7.2 Run `npm run lint && npm run format:check` — `format:check` passes; `lint` is blocked by a pre-existing environment issue (`eslint.config.js` cannot resolve `eslint-plugin-react-x`), unrelated to this change
- [x] 7.3 Run `npm test` and confirm the N2E suites pass (212 tests passing)
