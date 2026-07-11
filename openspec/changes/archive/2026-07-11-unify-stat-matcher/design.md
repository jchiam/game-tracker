## Context

Architecture-review findings 2+3 (2026-07-11). The scoring core owns the match rules (`matchStatShapes` over `StatShape`) and the weights (`SCORE_WEIGHTS`), but three vocabulary-bound helpers leaked into every adapter, and dead per-game weight exports imply tunability that does not exist (changing them does nothing — the core never reads them).

## Goals / Non-Goals

**Goals:**

- One implementation of vocabulary-bound stat matching: `makeStatMatcher(shapeMap)` in the scoring core.
- Adapters keep only their `*_STAT_SHAPES` vocabulary map (per-game Stat Fidelity) and game-unique logic (N2E cartridge-id matching, set terms).
- Dead weight constants deleted — the interface stops lying about tunability.

**Non-Goals:**

- No change to match rules, weights, grades, or any score value.
- No consolidation of the three scoring adapters themselves — set terms and slot mappings are genuinely per-game.
- `getCartridgeIdMatchScore` (N2E) stays — game-unique, not a copy.

## Decisions

**Factory returns `{ getStatMatchScore, bestMatch }`.** Both consume the vocabulary; producing them together from one `makeStatMatcher(shapeMap)` call keeps the adapter to a single line. The identity fallback (`{ base: id, isPercent: false }` for unmapped ids) moves into the factory — it is match semantics, not vocabulary. _Alternative — export only `bestMatch` and let adapters compose `getStatMatchScore` themselves:_ rejected; `getStatMatchScore` is a public per-game export referenced by tests and the spec, and both helpers share the same binding.

**Per-game `getStatMatchScore` exports survive as re-exports.** The spec's "Game-agnostic stat-match scoring" requirement and all three test suites reference them; the factory result is destructured and re-exported, so the public interface is unchanged.

**Weight deletion needs no spec delta.** The spec's "Unified score composition weights" requirement already mandates a single shared constant; the dead exports contradicted it. Deletion is compliance, not change.

## Risks / Trade-offs

- **None behavioral** — pure concentration + deletion; scores byte-identical, verified by the untouched per-game test suites.
- **Factory is small (~15 lines)** → justified by the deletion test: removing it re-scatters the identity-fallback and best-match semantics across three adapters.
