## MODIFIED Requirements

### Requirement: Per-slot main stat pool

The system SHALL export a `MAIN_STATS` object mapping each slot to its valid main stat options:

- `SUN`: `['HP']` (fixed)
- `MOON`: `['ATK%', 'DEF%', 'HP%', 'HP Recovery%', 'DMG Multiplier%']`
- `STAR`: `['ATK%', 'DEF%', 'HP%', 'Crit Rate%', 'Crit Multiplier%', 'Ailment Accuracy%']`
- `SKY`: `['ATK%', 'DEF%', 'HP%', 'Speed', 'SP Recovery%']`
- `SPACE`: `['ATK & DEF']` (fixed dual stat)

Flat stat options SHALL be labeled by bare stat name (`ATK`, `HP`, `DEF`) with no `Flat` prefix; only percent variants carry a `%` suffix.

#### Scenario: Sun slot has fixed main stat

- **WHEN** the Sun slot main stat pool is queried
- **THEN** only `'HP'` is available

#### Scenario: Star slot has most options

- **WHEN** the Star slot main stat pool is queried
- **THEN** 6 options are available (ATK%, DEF%, HP%, Crit Rate%, Crit Multiplier%, Ailment Accuracy%)

#### Scenario: Space slot has fixed dual stat

- **WHEN** the Space slot main stat pool is queried
- **THEN** only `'ATK & DEF'` is available

#### Scenario: Flat main stats carry no prefix

- **WHEN** any main stat pool is queried
- **THEN** no option string begins with `'Flat '`

### Requirement: Shared substat pool

The system SHALL export a `SUB_STATS` array containing all valid substat types: ATK, ATK%, DEF, DEF%, HP, HP%, DMG Multiplier%, Ailment Accuracy%, Crit Rate%, Crit Multiplier%, Speed, SP Recovery%, Pierce Rate%.

Flat substats SHALL be labeled by bare stat name (`ATK`, `DEF`, `HP`) with no `Flat` prefix; percent substats retain the `%` suffix, keeping flat and percent variants distinct.

#### Scenario: Substat pool completeness

- **WHEN** the substat pool is queried
- **THEN** it contains exactly 13 stat types

#### Scenario: Flat substats carry no prefix

- **WHEN** the substat pool is queried
- **THEN** it contains `'ATK'`, `'DEF'`, and `'HP'` and no entry begins with `'Flat '`
