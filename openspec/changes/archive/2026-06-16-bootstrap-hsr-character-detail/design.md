## Context

This change introduces no code modifications. It bootstraps canonical main specs for the two HSR-specific capabilities: character detail field management and relic scoring. The scoring algorithm in particular contains non-obvious rules (partial stat matches, flat/percent equivalence, fixed head/hands slots) that are worth documenting explicitly before they diverge from any future reimplementation.

## Goals / Non-Goals

**Goals:**
- Capture all tracked field constraints (valid ranges, defaults, update debounce path)
- Capture the full relic scoring algorithm as testable WHEN/THEN scenarios
- Document the stat partial-match rules that are game-knowledge, not general logic

**Non-Goals:**
- Changing any application code
- Speccing the relic editor UI (component behaviour) — that belongs in a future design system spec
- Speccing HSR party detail (covered by the shared `parties` spec already)

## Decisions

**Two specs, not one**
Character detail (fields + constraints) and relic scoring (algorithm) are separate concerns. A future change that tweaks the scoring algorithm deltas only `hsr-relic-scoring`, not the field spec. Keeping them separate minimises delta blast radius.

**Scoring algorithm documented as scenarios, not pseudocode**
The `calculateRelicScore` function has several edge cases (empty preferences → 0 score, no relic in slot → skip, capped at 100). Scenarios make these individually testable and unambiguous without copying implementation.

**Stat preference chain documented as a first-class concept**
`StatPreference` (stat + operator + orderIndex) is used by both HSR build prefs and N2E cartridge prefs. Documenting it here (in the HSR spec) is accurate to where it first appears; the N2E spec will reference the same structure.

## Risks / Trade-offs

- Partial match rules (HP% preferred → HP equipped = 0.5; HP preferred → HP% equipped = 1.0) encode game balance knowledge. If the game changes, both code and spec need updating → Mitigation: the asymmetry is explicitly documented in the spec scenarios so it can't be silently dropped.
- SLOT_WEIGHT (100/6 ≈ 16.667%) and MAIN_STAT_WEIGHT (0.4) / SUB_STAT_WEIGHT (0.6) are constants baked into the algorithm. Future rebalancing requires a delta spec.

## Open Questions

None — algorithm and field constraints are fully observable in the current codebase.
