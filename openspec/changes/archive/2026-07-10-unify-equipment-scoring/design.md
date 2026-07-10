## Context

Three near-identical scorers exist today: `relicScoring.ts` (HSR), `cartridgeScoring.ts` (N2E), `revelationScoring.ts` (P5X). All share the shape `score = Σ term × weight`, `getStatMatchScore` (exact 1.0 / %-trumps-flat 1.0-0.5 / cross-crit 0.5), and a `min(4, Σ)/4` sub denominator — but in three stat-id vocabularies (`'HP%'` / `'HP %'` / `'hp-pct'`), with three grade systems (HSR inline 3-tier 80/50; N2E/P5X `getScoreGrade` 5-grade 90/70/50/30) and three badges. HSR alone lacks a set term and lets the **card** decide "insufficient data"; N2E/P5X own a `-1` sentinel in the scorer. The codebase already blesses the config-factory pattern (`createRosterPersistence`, `createPartyPersistence`) — the scoring core should follow it.

## Goals / Non-Goals

**Goals:**

- One scoring core all three games adapt over; no duplicated match/grade logic.
- Holistic scoring: every game's set/equip composition contributes, including HSR (relic + planar families).
- Uniform weights `.35/.30/.35`, uniform 5-grade scale, uniform `-1` sentinel (owned by the scorer).
- One `<ScoreBadge>` component + one grade-color token ramp; no per-game badge CSS or duplicate tokens.
- Score-sort available in all three roster views.

**Non-Goals:**

- AE and R1999 (no equip score today) — untouched. A future change may adopt the core.
- Changing the _stat-match rules_ themselves (exact/percent/crit values stay).
- Fixing the non-atomic preference-save limitation (pre-existing; the new HSR set-pref rides the same path).
- Reworking `getProgressStyle` / the chip-recolor behavior (orthogonal).

## Decisions

### D1 — Shared core shape: a `createEquipmentScore(config)` factory with a set-term plugin

New `src/utils/scoring/` module exports:

- `getStatMatchScore(a: StatShape, b: StatShape): number` — operates on a **normalized shape**, not raw strings.
- `getScoreGrade(score: number): Grade` — the single 5-grade scale (`<0 → ''`).
- `SCORE_WEIGHTS = { set: 0.35, main: 0.3, sub: 0.35 }` — one constant.
- `createEquipmentScore<T>(config): (entity: T) => number` — owns the `-1` sentinel (no prefs OR no equip), main-term averaging, sub-term `min(4,Σ)/4`, weight application, floor/cap. The **set term is a `config.setTerm(entity) => number` callback** (0–1) — the only per-game-shaped piece.

_Why factory over one mega-function:_ the three set terms are genuinely different shapes (N2E: 1 item + rarity penalty; P5X: 4 Heavens emergent + 1 Space gated; HSR: 4pc relic + 2pc planar). Main/sub/sentinel/grade/weights are identical and belong in the core; the set term is the plugin. Alternative (one switch-on-game function) rejected — reintroduces the coupling we're removing.

### D2 — Stat-vocabulary normalization

Each game maps its stat ids to a normalized `StatShape` before matching: `{ base: 'atk'|'def'|'hp'|'crit-rate'|'crit-mult'|'spd'|… , isPercent: boolean }`. `getStatMatchScore` compares shapes: same base+percent → 1.0; flat-pref met by percent → 1.0; percent-pref met by flat → 0.5; crit-rate↔crit-mult → 0.5; else 0. Each game owns a tiny `toStatShape(id)` map (HSR display strings, N2E spaced strings, P5X kebab ids).

_Why:_ the vocabularies can't be unified at the data layer without touching generated catalogs + DB rows (out of scope). A per-game normalizer at the scorer boundary is the minimal seam. Alternative (rename all stat ids to one vocabulary) rejected — churns generated data + migrations for no user benefit.

### D3 — HSR set term (new)

`setTerm = relicMatch × 0.67 + planarMatch × 0.33`, where `relicMatch = min(#equipped pieces whose set === preferredRelicSet, 4)/4` over head/hands/body/feet, `planarMatch = min(#equipped pieces whose set === preferredPlanarSet, 2)/2` over sphere/rope. Null preference → that half is 0 (guard the preference first, mirroring P5X's null-inversion fix). Graded toward breakpoints (a 3rd relic piece scores 0.75) for parity with P5X's Heavens grading.

### D4 — HSR set-preference persistence

`HsrTrackedCharacter['buildPreferences']` gains `relicSetId: string | null` and `planarSetId: string | null`. Persisted as **two scalar columns** on the existing HSR build-preference storage, not preference rows — they are single-valued, unlike the ordered stat chains. New Supabase migration adds the columns; hand-author the mapping in `hsrCharacterService`. Editor gains two `Select`s (preferred relic set / planar set) in the Build Preferences tab.

_Why columns over rows:_ set preference is a single choice per family, not an ordered chain; a row-set is overkill and would ride the non-atomic delete+reinsert path unnecessarily. Alternative (JSON blob) rejected — breaks the column-mapped convention.

### D5 — Shared badge + token ramp

New `<ScoreBadge score={number} />` (L3 shared component) renders `.score-badge.grade-{s..d}` using a game-agnostic `--color-score-grade-{s..d}` ramp (the current N2E/P5X hex values, which are already identical). Removes `.score-badge.tier-*` (HSR), `.cartridge-score-badge` (N2E), `.score-badge.grade-*` (P5X) and the `--color-{hsr,n2e,p5x}-score-*` tokens. HSR's glossy treatment is dropped. The component hides itself (renders nothing) when score `< 0`.

_Class-collision note:_ HSR and P5X both use `.score-badge` today with different modifier vocab — consolidating to one component + one class system removes the latent footgun.

### D6 — Score-sort wiring

N2E and P5X `useRosterView` configs gain a `SCORE` sort mode passing their `calculate*Score` fn (HSR already does this). `getFilteredRoster`'s score-sort path is already generic.

## Risks / Trade-offs

- **HSR scores change wholesale (weights + new set term)** → Communicated as BREAKING in the proposal; no data migration of scores needed (scores are derived, not stored). Re-tiering is expected and desired.
- **HSR set term needs a preference users haven't set** → Absent set preference zeroes the set term (score caps below 100 until set), consistent with P5X stats-only behavior; not `-1`. Existing HSR characters keep scoring.
- **New Supabase migration + column mapping** → Standard additive migration (nullable columns); RLS unchanged (same table). Follows existing HSR service conventions.
- **Refactor touches three passing test suites at once** → Land the core + its own unit tests first (behavior-frozen against current outputs for N2E/P5X), then migrate each game and assert unchanged numbers (except HSR, which has new expected values).
- **HSR set preference rides the known non-atomic save path** → It uses scalar columns (single upsert), so it actually avoids the delete+reinsert row path — lower risk than the stat chains.

## Migration Plan

1. Build `src/utils/scoring/` core (match/grade/weights/factory) + unit tests, values frozen to N2E/P5X current outputs.
2. Migrate N2E and P5X scorers onto the core (config adapters); assert identical scores; delete dup logic.
3. Add HSR set-preference types + Supabase migration + service column mapping + editor `Select`s.
4. Migrate HSR scorer onto the core with the new two-family set term + uniform weights + `-1` sentinel; update HSR score tests to new expected values; remove the card's `hasPreferences`/`tierClass` logic.
5. Add `<ScoreBadge>` + token ramp; swap all three cards; delete three badge CSS blocks + per-game tokens; `build:tokens`; add Storybook story.
6. Add `SCORE` sort to N2E/P5X roster views.

Rollback: revert commits; no destructive DB change (additive nullable columns can stay unused).

## Open Questions

- Exact HSR relic-set vs planar-set assignment by slot — confirm sphere/rope are the planar (2pc) slots and head/hands/body/feet the relic (4pc) slots against the catalog before coding D3/D4. (Believed correct from `relicScoring.ts` slot list + N2E/HSR relic conventions.)
