## ADDED Requirements

### Requirement: Overall cartridge score range

The system SHALL calculate an overall cartridge score for a character in the range 0–100, representing how well the equipped cartridge matches the character's stat preferences. The score is capped at 100 and floored at 0. A score of -1 indicates insufficient data (no preferences set or no cartridge equipped).

#### Scenario: Perfect score

- **WHEN** cartridge main stat and all sub stats exactly match preferences
- **THEN** score is 100

#### Scenario: No cartridge equipped

- **WHEN** no cartridge main stat and no sub stats are present
- **THEN** score is -1

#### Scenario: No preferences set

- **WHEN** character has no main stat or sub stat preferences
- **THEN** score is -1

### Requirement: Score composition weights

The system SHALL compute the cartridge score as a weighted combination: main stat match × 0.4 + sub stat match × 0.6, then scaled to 0–100.

#### Scenario: Weight application

- **WHEN** main stat match is 1.0 and sub stat match is 0.5
- **THEN** raw score is (1.0 × 0.4 + 0.5 × 0.6) × 100 = 70

### Requirement: Main stat scoring

The system SHALL score the main stat by finding the best match score among all preferred main stats. If no main stat is equipped or no main stat preferences exist, main score is 0.

#### Scenario: Exact main stat match

- **WHEN** equipped main stat matches a preferred main stat exactly
- **THEN** main stat score is 1.0

#### Scenario: Best match used

- **WHEN** multiple main stat preferences exist and one matches better than others
- **THEN** the highest individual match score is used

#### Scenario: No main stat preferences

- **WHEN** main stats preference chain is empty
- **THEN** main stat score is 0

### Requirement: Sub stat scoring

The system SHALL score sub stats by summing the best match score for each equipped sub stat against all preferred sub stats, capped at 4 (maximum sub stats per cartridge), then normalising to a 0–1 fraction.

#### Scenario: All sub stats match preferences

- **WHEN** cartridge has 4 sub stats all matching preferred stats exactly
- **THEN** sub stat score is 1.0

#### Scenario: Partial sub stat match

- **WHEN** 2 of 4 sub stats match exactly
- **THEN** sub stat score is 2/4 = 0.5

#### Scenario: No preferred sub stats set

- **WHEN** character has no sub stat preferences
- **THEN** sub stat score is 0

#### Scenario: No sub stats equipped

- **WHEN** cartridge has an empty sub stats array
- **THEN** sub stat score is 0

### Requirement: Stat match scoring rules

The system SHALL apply the following match rules when comparing a preferred stat to an equipped stat.

#### Scenario: Exact match

- **WHEN** preferred stat equals equipped stat
- **THEN** match score is 1.0

#### Scenario: Percent preferred, flat equipped (HP%, ATK%, DEF%)

- **WHEN** preferred is HP %, ATK %, or DEF % and equipped is the corresponding flat stat
- **THEN** match score is 0.5

#### Scenario: Flat preferred, percent equipped (HP, ATK, DEF)

- **WHEN** preferred is HP, ATK, or DEF and equipped is the corresponding percent stat
- **THEN** match score is 1.0 (percent version always satisfies flat preference)

#### Scenario: Cross-crit match

- **WHEN** preferred is CRIT Rate % and equipped is CRIT DMG %, or vice versa
- **THEN** match score is 0.5

#### Scenario: No match

- **WHEN** preferred and equipped stats share no relationship
- **THEN** match score is 0.0

### Requirement: Score grade thresholds

The system SHALL assign a letter grade based on the numeric score using fixed thresholds.

#### Scenario: S grade

- **WHEN** score is 90 or above
- **THEN** grade is S

#### Scenario: A grade

- **WHEN** score is 70–89
- **THEN** grade is A

#### Scenario: B grade

- **WHEN** score is 50–69
- **THEN** grade is B

#### Scenario: C grade

- **WHEN** score is 30–49
- **THEN** grade is C

#### Scenario: D grade

- **WHEN** score is 0–29
- **THEN** grade is D

#### Scenario: No grade

- **WHEN** score is -1 (insufficient data)
- **THEN** grade is empty string
