## Context

This change introduces no code modifications. It bootstraps a canonical main spec for R1999 arcanist detail — the game-specific progression fields tracked per arcanist. Unlike HSR (which has relic slots and scoring), R1999's complexity lies in multiple numeric progression axes with rarity-dependent maximums.

## Goals / Non-Goals

**Goals:**

- Capture all tracked field constraints (valid ranges, rarity-dependent maxes, defaults)
- Document the psychube equipment model (name key + level + amplification)
- Document the level-based sort as the game-specific secondary comparator

**Non-Goals:**

- Changing any application code
- Speccing party detail (already covered by shared `parties` spec with tier + favorite extensions)
- Speccing the psychube editor UI

## Decisions

**Single spec for all R1999 arcanist fields**
Unlike HSR (which split character detail from relic scoring because the scoring algorithm is complex and independently changeable), R1999 has no scoring algorithm — all fields are simple progressions. One spec covers them all.

**Portrait level rarity constraint documented as a rule, not enforced in code**
The code does not currently clamp portrait level by rarity — the UI simply doesn't offer values beyond the rarity max. The spec documents the intended constraint per rarity for reference, but notes it is a UI constraint not a data-layer enforcement.

**Psychube keyed by name string, not ID**
After migration `20260501000001_r1999_psychube_name_key.sql`, psychubes are identified by name string (stable across data updates), not numeric ID. The spec documents this as the key type.

## Risks / Trade-offs

- Portrait level max per rarity is a game-knowledge constraint not enforced at the DB or hook level — only in UI. A future change adding DB-level validation would need a delta spec.
- Resonance level recommended stop at 10 (for max 7×7 grid) is documented as informational, not as a hard constraint.

## Open Questions

None.
