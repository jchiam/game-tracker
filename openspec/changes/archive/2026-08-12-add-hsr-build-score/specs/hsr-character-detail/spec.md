## MODIFIED Requirements

### Requirement: HSR roster sort by score

The system SHALL support sorting the HSR roster by calculated build score (descending) in addition to the standard alphabetical sort. The build score is the blended relic + Light Cone score defined in hsr-build-scoring.

#### Scenario: Sort by score selected

- **WHEN** user selects score sort
- **THEN** roster is ordered by the blended build score descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the shared-roster spec is applied with no score comparator

### Requirement: Collapsed summary composition

The collapsed summary SHALL contain three gradient-colored stat chips, colored via the shared investment gradient (`getProgressStyle`): a level chip `Lv {level}` (gradient over 1–80), a traces indicator chip showing attained/not (gradient: attained = complete/teal, not = uninvested/rust), and a relic slot-fill chip `Relics {n}/6` where `n` is the count of slots holding a relic with a non-null `setId` (gradient over 0–6). The score badge SHALL remain in the card-image overlay with its existing tier logic and SHALL NOT move into the summary; it displays the blended build score defined in hsr-build-scoring.

#### Scenario: Relic slot-fill count reflects equipped slots

- **WHEN** a character has relics with a non-null `setId` in 4 of the 6 slots
- **THEN** the summary shows a `Relics 4/6` chip whose color is the gradient value for 4 out of 6

#### Scenario: Traces indicator reflects attainment

- **WHEN** a character's `tracesAttained` is true
- **THEN** the traces chip renders in the complete (teal) end of the gradient; when false, it renders in the uninvested (rust) end

#### Scenario: Score badge stays in the overlay

- **WHEN** a character has build or Light Cone preferences and a calculated build score
- **THEN** the score badge renders in the card-image overlay (not in the body summary), showing the blended build score
