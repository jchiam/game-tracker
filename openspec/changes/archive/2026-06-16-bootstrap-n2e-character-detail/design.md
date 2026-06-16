## Context

N2E (Neverness to Everness) character tracking already fully implemented. This change documents existing behaviour — no code modifications needed. Mirrors the approach used for `hsr-character-detail` / `hsr-relic-scoring` and `r1999-arcanist-detail`.

Key source files:
- `src/hooks/neverness-to-everness/useCharacters.ts` — hook with all field update logic
- `src/utils/cartridgeScoring.ts` — scoring algorithm
- `src/types.ts` — `N2ETrackedCharacter` interface

## Goals / Non-Goals

**Goals:**
- Document all per-character tracked fields with their ranges and defaults
- Document cartridge scoring algorithm with exact weights, match rules, and grade thresholds
- Maintain structural consistency with existing HSR/R1999 specs

**Non-Goals:**
- Changing any existing behaviour
- Speccing the N2E data catalog or update script
- Speccing UI layout or visual design

## Decisions

1. **Two separate specs** — `n2e-character-detail` for tracked fields, `n2e-cartridge-scoring` for the scoring algorithm. Mirrors HSR's split between `hsr-character-detail` and `hsr-relic-scoring`. Rationale: scoring is independently testable and referenceable.

2. **Cartridge preferences use shared StatPreference structure** — same `{stat, operator, orderIndex}` pattern as HSR build preferences. References the definition in `hsr-character-detail` spec rather than re-specifying.

3. **Non-atomic save limitation acknowledged** — cartridge preferences use delete-then-reinsert pattern. Documented by reference to `save-behaviour` spec's known limitation requirement.

## Risks / Trade-offs

- [Duplication with HSR spec patterns] → Acceptable; each game spec is self-contained and independently readable. Cross-references used for shared structures.
- [Spec may drift if N2E fields change] → Mitigated by CI validation + delta-spec workflow for future changes.
