## 1. Data Catalog

- [x] 1.1 Add `generateCartridgesTs()` function to `scripts/update-n2e-data.mjs` that maps `shards` core entries to `N2ECartridge[]`, grouped S/A/B alphabetically
- [x] 1.2 Add `shards` GraphQL query to the `main()` Promise.all fetch block in `update-n2e-data.mjs`
- [x] 1.3 Add cartridge diff report block to the script console output (total count, added/removed entries)
- [x] 1.4 Write `src/data/neverness-to-everness/cartridges.ts` (run script or hand-generate from known 36 entries to bootstrap)

## 2. Database

- [x] 2.1 Create migration `supabase/migrations/YYYYMMDD000000_add_n2e_cartridge_id.sql` with `ALTER TABLE n2e_tracked_characters ADD COLUMN cartridge_id TEXT`

## 3. Types

- [x] 3.1 Add `cartridgeId: string | null` field to `N2ETrackedCharacter` in `src/types.ts`
- [x] 3.2 Add `cartridgeId?: string | null` field to `N2ECharacterPatch` in `src/types.ts`
- [x] 3.3 Add `cartridgeId: string | null` field inside `cartridgePreferences` on `N2ETrackedCharacter`

## 4. Service Layer

- [x] 4.1 Add `cartridgeId: 'cartridge_id'` to `CHARACTER_COLUMNS` map in `characterService.ts`
- [x] 4.2 Add `cartridge_id` to the DB select columns string in `loadCharactersFromDB`
- [x] 4.3 Map `row.cartridge_id ?? null` to `cartridgeId` in the `loadCharactersFromDB` return object
- [x] 4.4 Add `cartridge_id: null` to the insert defaults in `insertCharacter`
- [x] 4.5 Add `cartridge_id` to the `cartridgePreferences` persistence (store alongside existing preference rows or as a separate `cartridge_preference_id` column on the character row — use character row column, not a preference table row)

## 5. Hook Layer

- [x] 5.1 Add `cartridgeId: null` to `createTrackedCharacter` defaults in `useCharacters.ts`
- [x] 5.2 Add `cartridgeId` parameter to `updateCartridge()` and include it in both optimistic state update and `N2ECharacterPatch`
- [x] 5.3 Add `cartridgeId: null` to the `cartridgePreferences` default in `createTrackedCharacter`
- [x] 5.4 Ensure `saveCartridgePreferences` persists `cartridgePreferences.cartridgeId` (update service call if needed)

## 6. Scoring

- [x] 6.1 Add `getCartridgeIdMatchScore(preferredId, equippedId)` function to `cartridgeScoring.ts` with rarity-delta logic (1.0 / 0.6 / 0.3 / 0.0)
- [x] 6.2 Update `calculateCartridgeScore` weights to: cartridgeId × 0.35 + mainStat × 0.30 + subStats × 0.35
- [x] 6.3 Update `-1` guard in `calculateCartridgeScore`: return -1 only when no preferences exist at all (cartridgeId pref null AND no stat prefs); a cartridgeId pref alone is sufficient to produce a non-(-1) score
- [x] 6.4 Update `cartridgeScoring` unit tests to cover new weight formula and `getCartridgeIdMatchScore` scenarios (exact, rarity delta ×1, ×2, wrong set, no pref)

## 7. UI — CartridgeEditorModal

- [x] 7.1 Replace single rarity `<select>` in the equip tab with a two-step picker: name dropdown (12 unique set names derived from `ALL_CARTRIDGES`) followed by B/A/S rarity buttons/select
- [x] 7.2 Derive `cartridgeId` from selected name + rarity in the equip tab and pass it to `onSaveCartridge`
- [x] 7.3 Update `onSaveCartridge` prop signature to include `cartridgeId: string | null` as first parameter
- [x] 7.4 Update `handleUnequip` to pass `null` for `cartridgeId`
- [x] 7.5 Add target cartridge preference picker (name + rarity, same two-step pattern) to the preferences tab
- [x] 7.6 Wire target cartridge preference picker to `cartridgePreferences.cartridgeId` via `onSavePreferences`

## 8. UI — CharacterCard

- [x] 8.1 Update `onUpdateCartridge` prop signature in `CharacterCardProps` to include `cartridgeId`
- [x] 8.2 Pass `cartridgeId` through from `CartridgeEditorModal` callback to the hook `updateCartridge` call
- [x] 8.3 Update cartridge slot display to show the named cartridge name (from `ALL_CARTRIDGES` lookup by `cartridgeId`) when equipped, falling back to current stat display

## 9. Tests

- [x] 9.1 Update `characterService.test.ts` to include `cartridge_id` in mock DB rows and verify it maps correctly
- [x] 9.2 Update `useCharacters.test.ts` to pass `cartridgeId` in `updateCartridge` mock calls
- [x] 9.3 Update `CartridgeEditorModal.test.tsx` for new picker UX and updated `onSaveCartridge` signature
- [x] 9.4 Run `npm test` and confirm all tests pass
- [x] 9.5 Run `npm run lint && npm run format:check` and fix any issues
- [x] 9.6 Run `npm run build` to confirm TypeScript compilation passes
