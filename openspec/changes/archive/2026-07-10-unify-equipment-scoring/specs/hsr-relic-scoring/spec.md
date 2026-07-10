## MODIFIED Requirements

### Requirement: Overall relic score range

The system SHALL calculate an overall relic score for a character in the range 0–100, representing how well all equipped relics match the character's build preferences across three terms — set composition, main stat, and sub stats (see shared-equipment-scoring). The score is capped at 100 and floored at 0. A score of `-1` indicates insufficient data.

#### Scenario: Perfect score

- **WHEN** all six slots are filled, the four relic-set pieces match the preferred relic set and both planar pieces match the preferred planar set, and every variable main and every sub stat matches preferences
- **THEN** score is 100

#### Scenario: No relics equipped

- **WHEN** all six slots are empty
- **THEN** score is `-1` (insufficient data)

## REMOVED Requirements

### Requirement: Per-slot score contribution

**Reason**: Aggregation moves from equal per-slot weighting to three normalized terms (set/main/sub) shared across all games; the per-slot equal-weight model no longer describes the score.
**Migration**: Main and sub matches are now averaged over the six slots (see "Main and sub stat terms average over six slots"); slot totals are no longer scaled by 100/6.

### Requirement: Per-slot score composition

**Reason**: A slot's score is no longer a standalone main×0.4 + sub×0.6 combination; a set term is added and the term weights unify to set 0.35 / main 0.30 / sub 0.35.
**Migration**: See "Three-term score composition" and shared-equipment-scoring "Unified score composition weights".

## ADDED Requirements

### Requirement: Three-term score composition

The system SHALL compute the HSR relic score with the shared three-term weighting `setTerm × 0.35 + mainTerm × 0.30 + subTerm × 0.35` (see shared-equipment-scoring), replacing the former main 0.4 / sub 0.6 per-slot model.

#### Scenario: Weight application

- **WHEN** `setTerm` is 1.0, `mainTerm` is 1.0, and `subTerm` is 1.0
- **THEN** score is 100

#### Scenario: Stats perfect, set absent

- **WHEN** `setTerm` is 0 while `mainTerm` and `subTerm` are 1.0
- **THEN** score is 65

### Requirement: Main and sub stat terms average over six slots

The system SHALL compute `mainTerm` as the average over all six relic slots of each slot's best main-stat match and `subTerm` as the average over all six slots of each slot's sub match. Head and hands score a fixed main match of 1.0; an empty slot contributes 0 to both averages. The per-slot main and sub match rules are unchanged (see "Stat match scoring rules", "Sub-stat scoring").

#### Scenario: One slot filled, rest empty

- **WHEN** exactly one slot holds a relic that perfectly matches main and sub preferences
- **THEN** that slot contributes its full match to each average while the other five contribute 0

#### Scenario: Empty preference chain

- **WHEN** a variable slot has no main preference
- **THEN** that slot's main match is 0 in the main-term average

### Requirement: Relic and planar set term

The system SHALL compute the set term over the whole six-relic hand as `relicMatch × 0.67 + planarMatch × 0.33`, where `relicMatch = min(count of head/hands/body/feet pieces whose set equals the preferred relic set, 4) / 4` and `planarMatch = min(count of sphere/rope pieces whose set equals the preferred planar set, 2) / 2`. Each preference is guarded first: a null preferred set scores 0 for its half and SHALL NOT be credited against a null equipped set.

#### Scenario: Full relic and planar match

- **WHEN** all four relic slots hold the preferred relic set and both planar slots hold the preferred planar set
- **THEN** `relicMatch` is 1.0, `planarMatch` is 1.0, and the set term is 1.0

#### Scenario: Graded relic progress

- **WHEN** exactly three of the four relic slots hold the preferred relic set
- **THEN** `relicMatch` is 0.75

#### Scenario: No relic-set preference

- **WHEN** the preferred relic set is null
- **THEN** `relicMatch` is 0 (never credited by null-equals-null)

### Requirement: Insufficient-data sentinel

The system SHALL return `-1` when the character has no build preferences at all (no set, main, or sub preferences) or no relics equipped in any slot. The scorer SHALL own this decision rather than the card. Absent individual preference fields zero their own term rather than voiding the score.

#### Scenario: No preferences at all

- **WHEN** the character has no relic-set, planar-set, main-stat, or sub-stat preferences
- **THEN** score is `-1` regardless of equipped relics

#### Scenario: Set preference absent but stats present

- **WHEN** relic-set and planar-set preferences are null but main and sub chains are non-empty and relics are equipped
- **THEN** a numeric score is computed with `setTerm` 0 (not `-1`)
