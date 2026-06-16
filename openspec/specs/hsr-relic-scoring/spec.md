## Purpose

Relic evaluation algorithm for Honkai: Star Rail. Scores an equipped relic set against a character's build preferences, producing a 0–100 score weighted across 6 slots with main and sub-stat matching rules including game-specific partial matches.

## Requirements

### Requirement: Overall relic score range
The system SHALL calculate an overall relic score for a character in the range 0–100, representing how well all equipped relics match the character's build preferences. The score is capped at 100 and floored at 0.

#### Scenario: Perfect score
- **WHEN** all six slots are filled with relics whose main and sub stats exactly match preferences
- **THEN** score is 100

#### Scenario: No relics equipped
- **WHEN** all six slots are empty
- **THEN** score is 0

### Requirement: Per-slot score contribution
The system SHALL weight each of the six slots equally at 100/6 ≈ 16.667% of the total score. Empty slots contribute 0 to the total.

#### Scenario: One slot filled, rest empty
- **WHEN** exactly one slot has a relic and it scores a perfect slot score
- **THEN** overall score is approximately 16.667

### Requirement: Per-slot score composition
The system SHALL compute each slot's score as a weighted combination: main stat match × 0.4 + sub stat match × 0.6.

#### Scenario: Slot score weights applied
- **WHEN** a slot has a main stat match of 1.0 and a sub stat match of 0.5
- **THEN** slot score is 1.0 × 0.4 + 0.5 × 0.6 = 0.7

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
