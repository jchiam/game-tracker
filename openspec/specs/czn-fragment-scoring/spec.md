# czn-fragment-scoring Specification

## Purpose

Memory Fragment equipment-match scoring for Chaos Zero Nightmare combatants: a 0–100 score computed by a config adapter over the shared equipment-scoring core, covering the target-set composition term, per-slot main-stat scoring, and the CZN stat-shape vocabulary.

## Requirements

### Requirement: Fragment equipment-match score

The system SHALL compute a 0–100 fragment equipment-match score per tracked combatant via a config adapter over the shared equipment-scoring core, weighting set match 0.35, main-stat match 0.30, and substat match 0.35. The score SHALL return the `-1` sentinel when the combatant has no fragment build preferences or no piece equipped.

#### Scenario: No preferences

- **WHEN** a combatant has pieces equipped but an empty target-set composition, no main-stat chains, and no substat chain
- **THEN** the score is `-1`

#### Scenario: No equipment

- **WHEN** a combatant has preferences set but all six slots are empty
- **THEN** the score is `-1`

#### Scenario: Perfect match

- **WHEN** every equipped piece matches a targeted Set up to that Set's piece count and the composition fills all six pieces, every variable-slot main best-matches its chain head, and substats cover the achievable top matches
- **THEN** the score is 100

### Requirement: Target-set composition term

The set term SHALL be `Σ min(count_i, pieces_i) / 6` over every Set `i` in the target-set composition, where `count_i` is the number of equipped pieces whose set is Set `i` and `pieces_i` is that Set's catalog piece count. An empty composition contributes 0. Composition order SHALL NOT affect the term. Because a Set appears at most once in the composition and every Set is either a 4-piece or a 2-piece set, no spill rule applies.

#### Scenario: Full 4 + 2 composition

- **WHEN** the combatant targets 4-piece set X and 2-piece set Y and wears 4 X pieces and 2 Y pieces
- **THEN** the set term is 1.0

#### Scenario: Full 2 + 2 + 2 composition

- **WHEN** the combatant targets 2-piece sets X, Y, Z and wears 2 pieces of each
- **THEN** the set term is 1.0

#### Scenario: Surplus pieces do not count

- **WHEN** the combatant targets only 4-piece set X and wears 6 X pieces
- **THEN** the set term is 0.67 (4/6)

#### Scenario: Partial 2-piece

- **WHEN** the combatant targets 2-piece set Y and wears 1 Y piece
- **THEN** set Y contributes 0.165 (1/6) to the set term

#### Scenario: Under-filled composition caps the term

- **WHEN** the combatant targets 2-piece sets X and Y only and wears 2 pieces of each
- **THEN** the set term is 0.67 (4/6)

### Requirement: Slot main-stat scoring

Slots 1–3 (fixed mains) SHALL always contribute a main-stat match of 1.0 when occupied. For slots 4–6: an empty preference chain SHALL score 1.0 (don't-care); a non-empty chain with no equipped main SHALL score 0; otherwise the score is the best stat-shape match between the chain and the equipped main. Empty slots contribute 0 toward the slot average.

#### Scenario: Fixed slot always full

- **WHEN** slot 3 holds any piece
- **THEN** its main-stat match is 1.0 regardless of preferences

#### Scenario: Chain set, wrong main

- **WHEN** slot 5's chain prefers `Void Damage%` and the equipped piece's main is `HP%`
- **THEN** the slot's main-stat match is 0 (exact-match-only stats do not partial-match)

### Requirement: CZN stat-shape vocabulary

The scorer SHALL bind a CZN stat-shape map to the shared stat matcher: `Flat ATK`/`ATK%`, `Flat DEF`/`DEF%`, and `Flat HP`/`HP%` pair as flat/percent forms of one base; `Critical Chance%` and `Critical Damage%` cross-match at the shared crit factor; the five element `Damage%` stats, `Ego Recovery`, `Extra Damage%`, and `Damage over Time%` are exact-match only. The substat pool used for the achievable-sum denominator SHALL be the single-sourced pool from the slot model.

#### Scenario: Flat preference matched by percent

- **WHEN** the substat chain prefers `Flat ATK` and an equipped piece carries `ATK%`
- **THEN** that substat scores a full match per the shared flat-vs-percent rule

#### Scenario: Cross-crit near miss

- **WHEN** the substat chain prefers `Critical Chance%` and an equipped piece carries `Critical Damage%`
- **THEN** that substat scores the shared cross-crit partial match
