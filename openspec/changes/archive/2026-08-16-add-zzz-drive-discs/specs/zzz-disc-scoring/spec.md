# zzz-disc-scoring Delta

## ADDED Requirements

### Requirement: Disc equipment-match score

The system SHALL compute a 0–100 disc equipment-match score per tracked agent via a config adapter (`src/utils/discScoring.ts`) over the shared `createEquipmentScore` factory, weighting set match 0.35, main-stat match 0.30, and substat match 0.35. The score SHALL return the `-1` sentinel when the agent has no build preferences set or no discs equipped, which hides the score badge.

#### Scenario: No preferences

- **WHEN** an agent has discs equipped but no suit picks, no main-stat chains, and no substat chain
- **THEN** the score is `-1` and no badge renders

#### Scenario: No equipment

- **WHEN** an agent has preferences set but all six disc slots are empty
- **THEN** the score is `-1` and no badge renders

#### Scenario: Perfect match

- **WHEN** all equipped discs match the preferred suits, every variable-slot main stat best-matches its chain head, and substats cover the achievable top matches
- **THEN** the score is 100 and the badge shows grade S

### Requirement: 4pc/2pc set term with same-suit spill

The set term SHALL be `min(count4, 4)/4 × 0.67 + min(count2, 2)/2 × 0.33`, where `count4` is equipped discs matching the 4pc suit pick and `count2` is equipped discs matching the 2pc suit pick. When the 4pc and 2pc picks are the same suit, pieces beyond the first four SHALL spill into `count2` rather than double-counting. A missing suit pick contributes 0 to its term.

#### Scenario: Distinct suits

- **WHEN** the agent targets 4pc suit X + 2pc suit Y and wears 4 X pieces and 2 Y pieces
- **THEN** the set term is 1.0

#### Scenario: Same suit six pieces

- **WHEN** the agent targets suit X in both picks and wears 6 X pieces
- **THEN** `count4` is 4 and `count2` is 2 (the two surplus pieces spill), yielding a full set term

#### Scenario: Same suit four pieces

- **WHEN** the agent targets suit X in both picks and wears exactly 4 X pieces
- **THEN** `count4` is 4 and `count2` is 0

### Requirement: Slot main-stat scoring

Slots 1–3 (fixed mains) SHALL always contribute a main-stat match of 1.0. For slots 4–6: an empty preference chain SHALL score 1.0 (don't-care); a non-empty chain with no equipped main SHALL score 0; otherwise the score is the best stat-shape match between the chain and the equipped main. Empty disc slots (`null`) SHALL contribute zero toward the slot average; the model never stores an empty-disc sentinel object.

#### Scenario: Fixed slot always full

- **WHEN** slot 2 holds any disc
- **THEN** its main-stat match is 1.0 regardless of preferences

#### Scenario: Chain set, wrong main

- **WHEN** slot 5's chain prefers an element DMG bonus and the equipped disc's main is DEF%
- **THEN** the slot's main-stat match is 0 (exact-match-only stats do not partial-match)

### Requirement: ZZZ stat-shape vocabulary

The scorer SHALL bind a ZZZ stat-shape map to the shared stat matcher: HP/ATK/DEF flat and percent forms pair as base-stat shapes, CRIT Rate and CRIT DMG cross-match at the shared factor, PEN and PEN Ratio pair as flat/percent forms of one base; element DMG bonuses and slot-6 utility stats (Impact, Energy Regen, Anomaly Mastery) are exact-match only. Anomaly Proficiency is a flat stat appearing in both the slot-4 main pool and the substat pool.

#### Scenario: Flat-preference matched by percent

- **WHEN** the substat chain prefers ATK and an equipped disc carries ATK%
- **THEN** that substat scores a full match per the shared flat-vs-percent rule

### Requirement: Score badge on agent card

The agent card SHALL render the disc score via the shared `ScoreBadge` in the card header extra slot with the grade derived from the shared grade bands (S≥90, A≥70, B≥50, C≥30, else D), and pass the score as the card's temper score.

#### Scenario: Badge grade

- **WHEN** an agent's disc score computes to 72
- **THEN** the header badge renders grade A with the score value
