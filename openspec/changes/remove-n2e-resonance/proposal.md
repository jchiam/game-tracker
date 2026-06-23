## Why

The N2E character "resonance count" (0–6) is a tracked field with no basis in the actual Neverness to Everness game. It produces nothing: it is not part of the auto-generated catalog, not fetched by `update-n2e-data.mjs`, and not used by the cartridge progress score — it only drives a color gradient and duplicates the 0–6 range of the genuine `awakening` mechanic. It appears to be a leftover from scaffolding the N2E module off the R1999 template (where `resonanceLevel` is a real arcanist mechanic). Removing it eliminates a misleading, dead progression dimension.

## What Changes

- Remove the `resonanceCount` field from the N2E tracked-character type and its update patch type.
- Remove the "Resonance" slider section from `CharacterCard` (and its color-gradient style).
- Remove the `updateResonanceCount` hook method and its `N2ePage` wiring.
- Remove `resonance_count` from the character service field map, select query, insert defaults, and row mapping.
- Add a migration to drop the `resonance_count` column from `n2e_tracked_characters`.
- Update affected tests/fixtures to drop `resonanceCount`.
- **BREAKING** (data): the `resonance_count` column is dropped; any stored values are discarded. No user-facing feature depends on it.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `n2e-character-detail`: Remove the "Resonance count field" requirement entirely. No other requirements in this capability change.

## Impact

- **Types:** `src/types.ts` — `N2ETrackedCharacter`, `N2ECharacterPatch`.
- **Hook:** `src/hooks/neverness-to-everness/useCharacters.ts` — default state, `updateResonanceCount`, exports.
- **Service:** `src/services/neverness-to-everness/characterService.ts` — field map, select columns, insert default, row→model mapping.
- **Page:** `src/pages/neverness-to-everness/N2ePage.tsx` — `updateResonanceCount` destructure + `onUpdateResonance` prop.
- **Component:** `src/pages/neverness-to-everness/components/CharacterCard.tsx` — Resonance `ProgressSection`, `resonancePs` style, `onUpdateResonance` prop.
- **Database:** new migration `supabase/migrations/` dropping `resonance_count` from `n2e_tracked_characters`.
- **Tests/fixtures:** `useCharacters.test.ts`, `N2ePage.test.tsx`, `characterService.test.ts`, `CharacterCard.test.tsx`, `CartridgeEditorModal.test.tsx`, `AddCharacterModal.test.tsx`, `cartridgeScoring.test.ts`.
- No impact on the cartridge scoring algorithm, parties, or other games.
