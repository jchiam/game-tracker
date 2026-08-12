## Purpose

Overall build score for Honkai: Star Rail characters — blends the existing relic score with a Light Cone preference-rank term so the card score reflects the whole target build, not relics alone.

## Requirements

### Requirement: Blended build score composition

The system SHALL compute an overall HSR build score in 0–100 as a weighted blend of two sides: a cone term (weight 0.25) derived from the equipped Light Cone's rank in the character's Light Cone preference list, and the relic score (weight 0.75) as defined by hsr-relic-scoring, unchanged. When only one side is active, the blend SHALL renormalize so the active side alone determines the score. The relic score formula itself and the shared scoring core (see shared-equipment-scoring) SHALL NOT change.

#### Scenario: Both sides active

- **WHEN** a character has Light Cone preferences and relic preferences, an equipped cone ranked #1, and a relic score of 80
- **THEN** the build score is `(0.25 × 1.0 + 0.75 × 0.80) × 100 = 85`

#### Scenario: Relic side only (cone don't-care)

- **WHEN** a character has an empty Light Cone preference list and a relic score of 80
- **THEN** the build score is 80 — identical to the relic score, regardless of any equipped cone

#### Scenario: Cone side only

- **WHEN** a character has Light Cone preferences and an equipped #1 cone but the relic score is `-1` (no relic preferences or no relics)
- **THEN** the build score is 100 — the cone term alone, renormalized

### Requirement: Cone term from preference rank

The system SHALL score the cone term from the equipped Light Cone's zero-based rank `r` in the ordered preference list using a fixed step: `max(1.0 − 0.25 × r, 0.25)`. An equipped cone absent from the preference list (off-build) SHALL score 0. No equipped cone, with a non-empty preference list, SHALL score 0. The step SHALL be independent of preference-list length.

#### Scenario: Rank steps

- **WHEN** the equipped cone is ranked #1, #2, #3, #4, or #5 in the preference list
- **THEN** the cone term is 1.0, 0.75, 0.5, 0.25, and 0.25 respectively (floored at 0.25)

#### Scenario: Off-build cone

- **WHEN** the preference list is non-empty and the equipped cone is not in it
- **THEN** the cone term is 0

#### Scenario: No cone equipped

- **WHEN** the preference list is non-empty and no Light Cone is equipped
- **THEN** the cone term is 0

#### Scenario: Length independence

- **WHEN** the equipped cone is ranked #2 in a list of 2 or #2 in a list of 5
- **THEN** the cone term is 0.75 in both cases

### Requirement: Investment excluded from the score

The build score SHALL measure build match only: Light Cone level and superimposition SHALL NOT affect the score. They remain display-only fields.

#### Scenario: Superimposition does not move the score

- **WHEN** two characters differ only in equipped cone superimposition (S1 vs S5) and level
- **THEN** their build scores are identical

### Requirement: Insufficient-data sentinel

The build score SHALL be `-1` only when both sides are insufficient: the relic score is `-1` (per hsr-relic-scoring) and the Light Cone preference list is empty. A character with only Light Cone preferences SHALL receive a numeric score from the cone side alone.

#### Scenario: Neither side active

- **WHEN** a character has no relic preferences, no relics, and an empty Light Cone preference list
- **THEN** the build score is `-1` and the score badge hides

#### Scenario: Cone preferences declared, gear misses

- **WHEN** a character has Light Cone preferences, an off-build or absent cone, and a `-1` relic score
- **THEN** the build score is 0 (not `-1`)
