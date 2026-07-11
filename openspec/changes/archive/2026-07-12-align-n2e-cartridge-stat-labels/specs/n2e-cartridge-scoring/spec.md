## MODIFIED Requirements

### Requirement: Stat match scoring rules

The system SHALL apply the following match rules when comparing a preferred stat to an equipped stat. Stat ids use the in-game label vocabulary (`ATK%`/`HP%`/`DEF%`, `CRIT Rate`, `CRIT DMG`), mapped to a comparable `{ base, isPercent }` shape by `N2E_STAT_SHAPES`.

#### Scenario: Exact match

- **WHEN** preferred stat equals equipped stat
- **THEN** match score is 1.0

#### Scenario: Percent preferred, flat equipped (HP%, ATK%, DEF%)

- **WHEN** preferred is `HP%`, `ATK%`, or `DEF%` and equipped is the corresponding flat stat (`HP`, `ATK`, `DEF`)
- **THEN** match score is 0.5

#### Scenario: Flat preferred, percent equipped (HP, ATK, DEF)

- **WHEN** preferred is `HP`, `ATK`, or `DEF` and equipped is the corresponding percent stat (`HP%`, `ATK%`, `DEF%`)
- **THEN** match score is 1.0 (percent version always satisfies flat preference)

#### Scenario: Cross-crit match

- **WHEN** preferred is `CRIT Rate` and equipped is `CRIT DMG`, or vice versa
- **THEN** match score is 0.5

#### Scenario: No match

- **WHEN** preferred and equipped stats share no relationship
- **THEN** match score is 0.0
