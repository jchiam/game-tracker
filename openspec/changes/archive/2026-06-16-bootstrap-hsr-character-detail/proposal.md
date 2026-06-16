## Why

HSR character detail — relic slots, build preferences, and relic scoring — is the most complex per-game capability. Speccing it now creates a delta target for future changes (new relic stats, scoring algorithm changes, preference chain expansions) and documents the non-obvious scoring rules before they become institutional knowledge.

## What Changes

- Create new spec `hsr-character-detail`: tracked fields per character (level, traces, 6 relic slots, build preferences with stat priority chains)
- Create new spec `hsr-relic-scoring`: relic evaluation algorithm — weighted main/sub stat scoring against build preferences, partial-match rules, flat/percent stat equivalence

No application code is changed. This is documentation only.

## Capabilities

### New Capabilities
- `hsr-character-detail`: HSR-specific tracked character fields — level (1–80), traces toggle, 6 relic slots (head/hands/body/feet/sphere/rope), build preferences (main stat chains for body/feet/sphere/rope, sub-stat chain, comments), stat preference chain structure
- `hsr-relic-scoring`: Relic score calculation — per-slot main stat match (fixed for head/hands, preference-matched for others), sub-stat match with partial scoring, weighted combination across 6 slots into 0–100 score

### Modified Capabilities

None — no existing specs exist yet for these capabilities.

## Impact

- `src/hooks/honkai-star-rail/useCharacters.ts` — field update patterns (level, traces, favorite, relic save/remove, build prefs)
- `src/utils/relicScoring.ts` — scoring algorithm source of truth
- `src/data/honkai-star-rail/relics.ts` — relic slot, main stat, and sub-stat enumerations
- `src/types.ts` — `HsrTrackedCharacter`, `HsrCharacterPatch`, `StatPreference` interfaces
