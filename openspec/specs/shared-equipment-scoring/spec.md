## Purpose

Game-agnostic equipment-scoring core shared by every game's equipment/build scorer. Defines the normalized stat-shape match rules, the unified three-term composition weights (set/main/sub), the sub-term denominator and main-term averaging, the insufficient-data sentinel, the single grade scale, and the `createEquipmentScore` factory with a per-game set-term plugin. Each game's scorer is a configuration adapter over this core.

## Requirements

### Requirement: Game-agnostic stat-match scoring

The system SHALL provide a shared `getStatMatchScore` that scores a preferred stat against an equipped stat over a normalized stat shape (`{ base, isPercent }`), independent of any game's stat-id vocabulary. Each game SHALL supply a mapping from its stat ids to the shape; the match rules SHALL be defined once.

#### Scenario: Exact shape match

- **WHEN** the preferred and equipped shapes have the same base and same percent flag
- **THEN** match score is 1.0

#### Scenario: Flat preferred satisfied by percent equipped

- **WHEN** the preferred shape is a flat stat and the equipped shape is its percent variant (same base)
- **THEN** match score is 1.0 (percent always satisfies a flat preference)

#### Scenario: Percent preferred, flat equipped

- **WHEN** the preferred shape is a percent stat and the equipped shape is its flat variant (same base)
- **THEN** match score is 0.5

#### Scenario: Cross-crit near-miss

- **WHEN** one shape is crit-rate and the other is crit-mult
- **THEN** match score is 0.5

#### Scenario: No relationship

- **WHEN** the shapes share neither base nor a crit relationship
- **THEN** match score is 0.0

### Requirement: Unified score composition weights

The system SHALL weight every game's equipment score as `setTerm × 0.35 + mainTerm × 0.30 + subTerm × 0.35`, each term normalized to 0–1, scaled to 0–100. The weights SHALL be a single shared constant used by all games.

#### Scenario: Weight application

- **WHEN** `setTerm` is 1.0, `mainTerm` is 1.0, and `subTerm` is 0.5
- **THEN** raw score is (1.0 × 0.35 + 1.0 × 0.30 + 0.5 × 0.35) × 100 = 82.5

#### Scenario: Set term absent, stats perfect caps below 100

- **WHEN** `setTerm` is 0 and `mainTerm` and `subTerm` are both 1.0
- **THEN** score is 65

### Requirement: Sub-term denominator

The system SHALL compute each slot's sub match as the sum of the best preference match per equipped sub stat, capped at 4 and divided by 4, then average the per-slot sub matches over all of the game's slots.

#### Scenario: All subs match in one four-sub slot

- **WHEN** a slot has four equipped subs that each match a sub preference
- **THEN** that slot's sub match is 1.0

#### Scenario: No sub preferences

- **WHEN** the sub-preference set is empty
- **THEN** every slot's sub match is 0 and the sub term is 0

### Requirement: Main-term averaging over slots

The system SHALL compute the main term as the average, over all of the game's equipment slots, of each slot's best main-stat match; an empty slot, an empty preference chain, or an absent main scores 0 for that slot, diluting the average.

#### Scenario: Empty slot dilutes the term

- **WHEN** a slot holds no equipped item
- **THEN** that slot contributes 0 to the main-term average

#### Scenario: Fixed-main slot

- **WHEN** a slot has a game-defined fixed main and holds an item
- **THEN** that slot's main match is 1.0

### Requirement: Insufficient-data sentinel

The system SHALL return `-1` for any game's equipment score when the entity has no preferences at all or no equipment at all. Absent individual preference fields SHALL zero their own term rather than voiding the whole score.

#### Scenario: No preferences

- **WHEN** an entity has no set, main, or sub preferences
- **THEN** the score is `-1` regardless of equipment

#### Scenario: No equipment

- **WHEN** an entity has no equipped items in any slot
- **THEN** the score is `-1` regardless of preferences

#### Scenario: Partial preferences score numerically

- **WHEN** an entity has at least one preference and one equipped item, but some preference fields are absent
- **THEN** a numeric 0–100 score is returned (absent fields zero their term), not `-1`

### Requirement: Unified grade scale

The system SHALL map a score to a letter grade with a single shared threshold set: S ≥ 90, A ≥ 70, B ≥ 50, C ≥ 30, else D; a negative (insufficient-data) score maps to the empty string. All games SHALL use this function.

#### Scenario: Grade boundaries

- **WHEN** score is 90, 70, 50, or 30
- **THEN** grade is S, A, B, or C respectively

#### Scenario: Insufficient data has no grade

- **WHEN** score is `-1`
- **THEN** grade is the empty string

### Requirement: Per-game set-term plugin

The system SHALL expose an equipment-score factory where the set term is a per-game callback returning a 0–1 value, while the main term, sub term, sentinel, weights, and grade are owned by the shared core. Each game's scorer SHALL be a configuration adapter over the factory.

#### Scenario: Set term supplied per game

- **WHEN** a game configures the factory with its own set-term callback and stat-shape mapping
- **THEN** the produced scorer applies that set term with the shared weights, sentinel, and grade scale

#### Scenario: No set concept

- **WHEN** a game supplies a set-term callback that always returns 0
- **THEN** scores are computed from main and sub terms only, capped below 100

### Requirement: Shared stat-matcher factory

The system SHALL provide a single `makeStatMatcher(shapeMap)` factory in the scoring core that binds a game's stat-id vocabulary map to the shared match rules and returns `{ getStatMatchScore, bestMatch }`:

- `getStatMatchScore(preferredStat, equippedStat)` SHALL resolve both ids through the vocabulary map (an unmapped id falls back to the identity shape `{ base: id, isPercent: false }`, so non-participants can only exact-match) and delegate to the shared shape matcher.
- `bestMatch(prefs, equipped)` SHALL return the highest `getStatMatchScore` of any preference in the chain against the equipped stat, and `0` for an empty chain.

The factory SHALL be the only implementation of vocabulary-bound matching: game scoring adapters SHALL supply only their vocabulary map and SHALL NOT hand-write the id-resolution or best-match mechanics.

#### Scenario: Adapter supplies only vocabulary

- **WHEN** a game adapter calls `makeStatMatcher` with its stat-shape map
- **THEN** the returned `getStatMatchScore` and `bestMatch` apply the shared match rules over that vocabulary with no game-side matching code

#### Scenario: Unmapped id exact-matches only

- **WHEN** a stat id absent from the vocabulary map is scored against itself and against a different unmapped id
- **THEN** the self-match scores 1.0 and the cross-match scores 0.0

#### Scenario: Best match over a chain

- **WHEN** a preference chain contains one exact match (1.0) and one partial match (0.5) for the equipped stat
- **THEN** `bestMatch` returns 1.0
