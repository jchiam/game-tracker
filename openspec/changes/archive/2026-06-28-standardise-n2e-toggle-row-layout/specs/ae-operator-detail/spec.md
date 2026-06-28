## MODIFIED Requirements

### Requirement: Operator phase field

The system SHALL track an operator's phase as an integer in the range 0–5,
defaulting to 0 on add. Updates SHALL be clamped to this range before persisting.
Phase 0 represents an un-invested/base operator; phase 5 is the maximum.

The phase toggle button row SHALL render buttons with equal width using `flex: 1`.
The row container SHALL NOT use `flex-wrap` — all buttons MUST fit on a single line.
This matches the uniform-stretch pattern used by R1999's portrait-row.

#### Scenario: Phase updated within range

- **WHEN** user sets an operator's phase to a value between 0 and 5 inclusive
- **THEN** phase is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Phase clamped below minimum

- **WHEN** user sets an operator's phase below 0
- **THEN** phase is clamped to 0 before update

#### Scenario: Phase clamped above maximum

- **WHEN** user sets an operator's phase above 5
- **THEN** phase is clamped to 5 before update

#### Scenario: Default phase state

- **WHEN** an operator is added to the roster
- **THEN** phase is 0

#### Scenario: Toggle buttons stretch uniformly

- **WHEN** the phase row is rendered
- **THEN** all phase buttons have equal width via `flex: 1` with no wrapping
