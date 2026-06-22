## MODIFIED Requirements

### Requirement: Overall cartridge score range

The system SHALL calculate an overall cartridge score for a character in the range 0–100, representing how well the equipped cartridge matches the character's preferences across three terms: named set identity, main stat, and sub stats. The score is capped at 100 and floored at 0. A score of -1 indicates insufficient data (no preferences set or no cartridge equipped).

#### Scenario: Perfect score

- **WHEN** equipped cartridge matches the preferred named set at equal or higher rarity, main stat matches, and all sub stats match preferences
- **THEN** score is 100

#### Scenario: No cartridge equipped

- **WHEN** no `cartridgeId`, main stat, or sub stats are present
- **THEN** score is -1

#### Scenario: No preferences set

- **WHEN** character has no cartridgeId, main stat, or sub stat preferences
- **THEN** score is -1

#### Scenario: Correct set, no stat preferences

- **WHEN** equipped cartridge matches preferred named set but no stat preferences are set
- **THEN** cartridgeId term contributes 0.35 × 100 = 35; score is 35

### Requirement: Score composition weights

The system SHALL compute the cartridge score as a weighted combination: cartridgeId match × 0.35 + main stat match × 0.30 + sub stat match × 0.35, then scaled to 0–100.

#### Scenario: Weight application — all terms

- **WHEN** cartridgeId match is 1.0, main stat match is 1.0, and sub stat match is 0.5
- **THEN** raw score is (1.0 × 0.35 + 1.0 × 0.30 + 0.5 × 0.35) × 100 = 82.5

#### Scenario: Weight application — no cartridgeId preference

- **WHEN** cartridgeId preference is null (no preferred set) and main stat and sub stats match perfectly
- **THEN** score is (0 × 0.35 + 1.0 × 0.30 + 1.0 × 0.35) × 100 = 65

#### Scenario: Weight application — wrong set, perfect stats

- **WHEN** equipped set does not match preferred set but main stat and sub stats match perfectly
- **THEN** score is capped at 65 (cartridgeId term = 0)

### Requirement: CartridgeId match scoring

The system SHALL score the cartridgeId term by comparing the base set identity and rarity of the equipped cartridge against the preferred cartridgeId. Preferences always target S rarity, so the preferred `cartridgeId` is always an S-tier ID. If no cartridgeId preference is set, the cartridgeId term score is 0.

#### Scenario: Exact set and rarity match (S equipped, S preferred)

- **WHEN** equipped `cartridgeId` has the same base and rarity as the preferred `cartridgeId` (both S)
- **THEN** cartridgeId match score is 1.0

#### Scenario: Same set, equipped rarity meets or exceeds preferred

- **WHEN** equipped `cartridgeId` has the same base as preferred and rarity equal to S (since preference is always S, this is the same as exact match)
- **THEN** cartridgeId match score is 1.0

#### Scenario: Same set, equipped one rarity below preferred (A equipped, S preferred)

- **WHEN** equipped `cartridgeId` has the same base as preferred but is one rarity tier lower (A equipped, S preferred)
- **THEN** cartridgeId match score is 0.6

#### Scenario: Same set, equipped two rarities below preferred (B equipped, S preferred)

- **WHEN** equipped `cartridgeId` has the same base as preferred but is two rarity tiers lower (B equipped, S preferred)
- **THEN** cartridgeId match score is 0.3

#### Scenario: Different set

- **WHEN** equipped `cartridgeId` base differs from preferred base
- **THEN** cartridgeId match score is 0.0

#### Scenario: No cartridgeId preference

- **WHEN** `cartridgePreferences.cartridgeId` is null
- **THEN** cartridgeId term score is 0

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

The system SHALL score sub stats by summing the best match score for each equipped sub stat against all preferred sub stats, capped at 4, then normalising to a 0–1 fraction.

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
