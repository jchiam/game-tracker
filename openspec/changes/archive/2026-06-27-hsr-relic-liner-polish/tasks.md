## 1. Create short names mapping

- [x] 1.1 Create `src/data/honkai-star-rail/relic_short_names.ts` exporting `RELIC_SHORT_NAMES: Record<string, string>` mapping all ~58 relic set IDs to distinctive short names. Each short name is unique and recognizable.

## 2. Update CharacterCard to use short names

- [x] 2.1 In `CharacterCard.tsx`, import `RELIC_SHORT_NAMES` from `@/data/honkai-star-rail/relic_short_names`. In the one-liner, resolve display name as `RELIC_SHORT_NAMES[setId] ?? fullName` (where `fullName` comes from `availableRelicSets`).

## 3. CSS: 2-line wrapping + height reservation

- [x] 3.1 In `CharacterCard.css`, added HSR-local override for `.game-card-static-line`: `white-space: normal`, `-webkit-line-clamp: 2`, `-webkit-box-orient: vertical`, `display: -webkit-box`, `overflow: hidden`, and `min-height` reserving 2 lines.

## 4. Update tests

- [x] 4.1 Updated `CharacterCard.test.tsx`: relic set one-liner test asserts short names (Passerby, Streetwise) using real IDs. Added fallback test for unmapped set IDs.

## 5. Verify

- [x] 5.1 Run `npm test` — 898 passed across 63 files.
- [x] 5.2 Run `npm run lint && npm run format:check && npm run build` — clean.
