## Why

Reverse: 1999 arcanist detail has several game-specific progression systems (portrait, resonance, euphoria, psychube) with non-obvious constraints that differ by rarity. Speccing these now creates a reliable delta target for future changes and prevents rarity-specific rules from being lost in code comments.

## What Changes

- Create new spec `r1999-arcanist-detail`: per-arcanist tracked fields — level, portrait level (rarity-dependent max), resonance level, euphoria stage, psychube equipment, favorite toggle, level-based sort

No application code is changed. This is documentation only.

## Capabilities

### New Capabilities
- `r1999-arcanist-detail`: Reverse: 1999 per-arcanist tracked fields — level (1–60), portrait level (0–5 max varies by rarity), resonance level (0–15), euphoria stage (0–4), psychube (name + level + amplification), favorite toggle, sort-by-level secondary comparator

### Modified Capabilities

None — no existing specs exist yet for this capability.

## Impact

- `src/hooks/reverse1999/useArcanists.ts` — field update patterns, range clamping, search/sort config
- `src/types.ts` — `R1999TrackedArcanist`, `R1999ArcanistPatch` interfaces
- `src/services/reverse1999/arcanistService.ts` — DB persistence layer
