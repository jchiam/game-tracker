## Purpose

Relic evaluation algorithm for Honkai: Star Rail. Scores an equipped relic set against a character's build preferences, producing a 0–100 score weighted across 6 slots with main and sub-stat matching rules including game-specific partial matches.

## Requirements

### Requirement: Overall relic score range

The system SHALL calculate an overall relic score for a character in the range 0–100, representing how well all equipped relics match the character's build preferences across three terms — set composition, main stat, and sub stats (see shared-equipment-scoring). The score is capped at 100 and floored at 0. A score of `-1` indicates insufficient data.

#### Scenario: Perfect score

- **WHEN** all six slots are filled, the four relic-set pieces match the preferred relic set and both planar pieces match the preferred planar set, and every variable main and every sub stat matches preferences
- **THEN** score is 100

#### Scenario: No relics equipped

- **WHEN** all six slots are empty
- **THEN** score is `-1` (insufficient data)

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

### Requirement: Fixed main stat slots (head and hands)

The system SHALL treat head and hands slots as always having a perfect main stat match (1.0), regardless of preferences or the equipped main stat.

#### Scenario: Head slot main stat match

- **WHEN** calculating score for a head slot relic
- **THEN** main stat match is 1.0 regardless of equipped main stat

#### Scenario: Hands slot main stat match

- **WHEN** calculating score for a hands slot relic
- **THEN** main stat match is 1.0 regardless of equipped main stat

### Requirement: Variable main stat slot scoring (body, feet, sphere, rope)

The system SHALL score the main stat of body, feet, sphere, and rope slots by finding the best match score among the character's main stat preferences for that slot. An empty preference chain scores 0.

#### Scenario: Exact main stat match

- **WHEN** the equipped main stat matches a preferred stat exactly
- **THEN** match score for that preference is 1.0

#### Scenario: Empty preference chain

- **WHEN** no preferences are set for the slot
- **THEN** main stat match is 0

#### Scenario: Best match used

- **WHEN** multiple preferences exist and one matches better than others
- **THEN** the highest individual match score is used

### Requirement: Stat match scoring rules

The system SHALL apply the following match rules when comparing a preferred stat to an equipped stat.

#### Scenario: Exact match

- **WHEN** preferred stat equals equipped stat
- **THEN** match score is 1.0

#### Scenario: Percent preferred, flat equipped (HP%, ATK%, DEF%)

- **WHEN** preferred is HP%, ATK%, or DEF% and equipped is the corresponding flat stat
- **THEN** match score is 0.5

#### Scenario: Flat preferred, percent equipped (HP, ATK, DEF)

- **WHEN** preferred is HP, ATK, or DEF and equipped is the corresponding percent stat
- **THEN** match score is 1.0 (percent version always satisfies flat preference)

#### Scenario: CRIT Rate preferred, CRIT DMG equipped

- **WHEN** preferred is CRIT Rate and equipped is CRIT DMG
- **THEN** match score is 0.5

#### Scenario: CRIT DMG preferred, CRIT Rate equipped

- **WHEN** preferred is CRIT DMG and equipped is CRIT Rate
- **THEN** match score is 0.5

#### Scenario: No match

- **WHEN** preferred and equipped stats share no relationship
- **THEN** match score is 0.0

### Requirement: Sub-stat scoring

The system SHALL score sub-stats by summing the best match score for each equipped sub-stat against all preferred sub-stats, capped at 4 (maximum sub-stats per relic), then normalising to a 0–1 fraction.

#### Scenario: All sub-stats match preferences

- **WHEN** a relic has 4 sub-stats all matching preferred stats
- **THEN** sub-stat score is 1.0

#### Scenario: Partial sub-stat match

- **WHEN** 2 of 4 sub-stats match exactly
- **THEN** sub-stat score is 2/4 = 0.5

#### Scenario: No preferred sub-stats set

- **WHEN** character has no sub-stat preferences
- **THEN** sub-stat score is 0 for all slots

#### Scenario: Relic has no sub-stats

- **WHEN** a relic has an empty sub-stats array
- **THEN** sub-stat score is 0
