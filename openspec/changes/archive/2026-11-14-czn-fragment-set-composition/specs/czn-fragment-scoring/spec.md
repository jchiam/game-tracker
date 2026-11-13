# Spec Delta

## MODIFIED Requirements

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
