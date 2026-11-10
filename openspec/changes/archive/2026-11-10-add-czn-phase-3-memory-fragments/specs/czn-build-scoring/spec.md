# czn-build-scoring Specification

## Purpose

Overall build score for Chaos Zero Nightmare combatants — blends the fragment score with a Partner preference-rank term so the card score reflects the whole target build — plus the header score badge and the score sort mode.

## ADDED Requirements

### Requirement: Blended combatant build score

The system SHALL compute an overall CZN build score blending the unchanged fragment score with a Partner preference-rank term: when both sides are active, `0.25 × partnerTerm + 0.75 × (fragmentScore / 100)`, scaled to 0–100. A lone active side takes the whole score (active-side renormalization): an empty Partner preference list is don't-care (fragment score passes through unchanged), and a `-1` fragment score drops the fragment side (Partner term alone). The function SHALL return `-1` only when both sides are inactive. The fragment scorer SHALL NOT be modified by the blend.

#### Scenario: Both sides active

- **WHEN** a combatant has a non-empty Partner preference list and a fragment score of 80, with the ranked #1 Partner equipped
- **THEN** the build score is `(0.25 × 1.0 + 0.75 × 0.8) × 100 = 85`

#### Scenario: Empty preference list is don't-care

- **WHEN** a combatant has no Partner preferences and a fragment score of 72
- **THEN** the build score is exactly 72

#### Scenario: Partner side alone

- **WHEN** a combatant has Partner preferences but the fragment score is `-1`
- **THEN** the build score is the Partner term × 100

#### Scenario: Both sides inactive

- **WHEN** a combatant has no Partner preferences and a `-1` fragment score
- **THEN** the build score is `-1`

### Requirement: Partner preference-rank term

The Partner term SHALL be a fixed-step rank decay over the combatant's ranked Partner preference list: rank #1 scores 1.0, each rank down subtracts 0.25, floored at 0.25 so any listed Partner stays strictly above off-build. An unequipped Partner or an equipped Partner absent from the list SHALL score 0. Partner level and Manifest Ego SHALL never affect the score.

#### Scenario: Rank decay

- **WHEN** the equipped Partner is ranked #2 of 4
- **THEN** the Partner term is 0.75

#### Scenario: Floor holds deep ranks

- **WHEN** the equipped Partner is ranked #6
- **THEN** the Partner term is 0.25

#### Scenario: Off-build Partner

- **WHEN** the equipped Partner is not in the preference list
- **THEN** the Partner term is 0

#### Scenario: Level and Ego are display-only

- **WHEN** two combatants differ only in Partner level and Manifest Ego
- **THEN** their build scores are identical

### Requirement: Score badge on combatant card

The combatant card SHALL render the blended build score via the shared score badge in the card header extra slot (hidden on the `-1` sentinel) with the grade derived from the shared grade bands, and pass the score as the card's temper score. The score value SHALL appear nowhere else on the card as text.

#### Scenario: Badge grade

- **WHEN** a combatant's build score computes to 72
- **THEN** the header badge renders grade A with the score value

#### Scenario: Badge hidden

- **WHEN** a combatant's build score is `-1`
- **THEN** no score badge renders

### Requirement: CZN roster sort by score

The roster view SHALL offer a score sort mode ordering combatants by the blended build score descending (favorites first), alongside the alphabetical and level modes. Combatants with the `-1` sentinel sort after scored combatants.

#### Scenario: Score sort selected

- **WHEN** user switches the roster sort to score
- **THEN** combatants order by build score descending within favorite/non-favorite groups, unscored combatants last
