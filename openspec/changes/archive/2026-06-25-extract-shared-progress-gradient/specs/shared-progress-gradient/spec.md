## ADDED Requirements

### Requirement: Shared investment-progress gradient utility

The system SHALL provide a single shared utility module that maps a numeric progress value within a `[min, max]` range to a set of CSS color strings expressing the "uninvested → complete" visual language. The gradient SHALL interpolate continuously through the fixed anchor stops rust (`#8a6050`) → amber (`#c88040`) → gold (`#d4af37`) → teal (`#40c8a0`). This utility SHALL be the single source of truth consumed by all game cards; game card components SHALL NOT define their own copy of the gradient.

#### Scenario: Minimum value yields the rust anchor

- **WHEN** the utility is called with a value equal to `min`
- **THEN** the returned `color` is the rust anchor `rgb(138, 96, 80)`

#### Scenario: Maximum value yields the teal anchor

- **WHEN** the utility is called with a value equal to `max`
- **THEN** the returned `color` is the teal anchor `rgb(64, 200, 160)`

#### Scenario: Intermediate value interpolates between adjacent stops

- **WHEN** the utility is called with a value whose normalized position falls between two anchor stops
- **THEN** the returned `color` is the linear interpolation between those two adjacent stops

#### Scenario: Out-of-range values are clamped

- **WHEN** the utility is called with a value below `min` or above `max`
- **THEN** the normalized position is clamped to `[0, 1]` and the returned color is the corresponding anchor

#### Scenario: Degenerate range treats progress as complete

- **WHEN** the utility is called with `min === max`
- **THEN** the normalized position is treated as `1` (complete) and the teal anchor is returned

### Requirement: Gradient utility returns a complete style set

The utility SHALL return, for every call, an object containing `color`, `borderColor`, `glowColor`, and `activeBg`, all derived from the same interpolated base color so a card can style text, borders, glows, and active-state backgrounds consistently from one call.

#### Scenario: All four style fields share the interpolated hue

- **WHEN** the utility returns a style object for any value
- **THEN** `borderColor`, `glowColor`, and `activeBg` are the same interpolated `r,g,b` as `color`, each at its own fixed opacity (`0.5`, `0.25`, `0.12` respectively)
