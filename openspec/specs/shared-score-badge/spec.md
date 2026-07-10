## Purpose

Shared score-badge presentation used by every game. Defines the single `ScoreBadge` component that renders a graded score pill (hidden on the negative insufficient-data sentinel) and the game-agnostic `--color-score-grade-*` token ramp that colors it, replacing per-game score-badge classes and score-color tokens.

## Requirements

### Requirement: Shared score badge component

The system SHALL provide one shared score-badge component that renders a graded score pill for every game. It SHALL take a numeric score, render nothing when the score is negative (insufficient data), and otherwise show the rounded percentage with a grade class derived from the shared grade scale.

#### Scenario: Scored entity shows a graded badge

- **WHEN** the badge receives a non-negative score
- **THEN** it renders a pill showing the score rounded to a whole percent with a `grade-{s..d}` class matching the shared grade scale

#### Scenario: Insufficient data renders nothing

- **WHEN** the badge receives a negative score
- **THEN** it renders nothing

### Requirement: Unified grade-color token ramp

The system SHALL define one game-agnostic grade-color token ramp (`--color-score-grade-{s..d}`) used by the shared badge for all games. Per-game score-color tokens SHALL NOT be defined; the badge fill and border SHALL derive from the ramp via `color-mix`.

#### Scenario: Badge colors from the shared ramp

- **WHEN** the badge renders any grade
- **THEN** its color, fill, and border derive from `--color-score-grade-{grade}` with no per-game score token

#### Scenario: Single badge class system

- **WHEN** any game renders a score badge
- **THEN** it uses the shared `.score-badge` class with a `grade-{s..d}` modifier and no game-specific badge class
