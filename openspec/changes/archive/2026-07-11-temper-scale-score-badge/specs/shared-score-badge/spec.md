# shared-score-badge Delta

## MODIFIED Requirements

### Requirement: Shared score badge component

The system SHALL provide one shared score-badge component that renders a graded Temper-rail readout for every game. It SHALL take a numeric score, render nothing when the score is negative (insufficient data), and otherwise render three parts: the rounded percentage (data font role, tabular numerals), the grade letter from the shared grade scale, and a miniature Temper rail — a thin bar filled with the full investment-ramp gradient carrying a marker positioned at the score along the rail's width. The badge SHALL carry a `grade-{s..d}` class derived from the shared grade scale.

#### Scenario: Scored entity shows a rail readout

- **WHEN** the badge receives a non-negative score
- **THEN** it renders the score rounded to a whole percent, the grade letter matching the shared grade scale, and a rail whose marker sits at the score's proportional position, under a `grade-{s..d}` class

#### Scenario: Marker position tracks the score

- **WHEN** the badge receives score `s` in 0–100
- **THEN** the rail marker's horizontal offset is `s%` of the rail width (0 at the far left, 100 at the far right)

#### Scenario: Insufficient data renders nothing

- **WHEN** the badge receives a negative score
- **THEN** it renders nothing

### Requirement: Unified grade-color token ramp

The system SHALL define one game-agnostic grade-color token ramp (`--color-score-grade-{s..d}`) used by the shared badge for all games. Per-game score-color tokens SHALL NOT be defined. The badge's percentage readout SHALL be coloured by `--color-score-grade-{grade}`; the rail's background SHALL be the canonical Temper ramp gradient token rather than a grade-specific fill; the marker SHALL be a neutral text-colour tick, not a grade-coloured one.

#### Scenario: Readout colours from the shared ramp

- **WHEN** the badge renders any grade
- **THEN** the percentage colour derives from `--color-score-grade-{grade}` with no per-game score token

#### Scenario: Rail uses the canonical ramp gradient

- **WHEN** the badge's rail renders
- **THEN** its background is the shared Temper ramp gradient token, identical for every grade

#### Scenario: Single badge class system

- **WHEN** any game renders a score badge
- **THEN** it uses the shared `.score-badge` class with a `grade-{s..d}` modifier and no game-specific badge class
