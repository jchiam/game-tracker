## REMOVED Requirements

### Requirement: Operator potential field

**Reason**: The 0–5 "potential" dimension is repurposed as "Phase" (see the added
`Operator phase field` requirement). The mechanic, range (0–5), default (0), and
clamping behavior are unchanged — only the name changes — so this requirement is
removed in favor of the renamed one rather than carried as a second dimension.

**Migration**: The `potential` column on `ae_tracked_operators` is renamed to
`phase` in place. Existing rows are preserved and their values are reinterpreted as
`phase` (same 0–5 semantics). No user action required.

## ADDED Requirements

### Requirement: Operator phase field

The system SHALL track an operator's phase as an integer in the range 0–5,
defaulting to 0 on add. Updates SHALL be clamped to this range before persisting.
Phase 0 represents an un-invested/base operator; phase 5 is the maximum.

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

### Requirement: Operator skills-maxed field

The system SHALL track whether an operator's skills are fully maxed as a single
boolean (`skillsMaxed`), defaulting to false on add. This is an all-or-nothing flag
with no per-skill granularity, mirroring HSR's all-traces-attained toggle. Updates
are optimistic and persisted via debounced save.

#### Scenario: Skills-maxed toggled on

- **WHEN** user toggles the "all skills maxed" control on for an operator
- **THEN** `skillsMaxed` is set to true in local state immediately and queued for DB write

#### Scenario: Skills-maxed toggled off

- **WHEN** user toggles the "all skills maxed" control off
- **THEN** `skillsMaxed` is set to false in local state immediately and queued for DB write

#### Scenario: Default skills-maxed state

- **WHEN** an operator is added to the roster
- **THEN** `skillsMaxed` is false

### Requirement: Operator weapon equipment

The system SHALL track an equipped weapon per operator with two fields:
`weaponName` (string or null — the display name of an entry in `ALL_WEAPONS`) and
`weaponLevel` (integer 1–90). Defaults on add: `weaponName` null, `weaponLevel` 1.
The weapon picker SHALL be filtered to `ALL_WEAPONS` entries whose `type` matches
the operator's intrinsic `weapon` class. `weaponLevel` updates SHALL be clamped to
1–90 before persisting.

#### Scenario: Weapon picker filtered by class

- **WHEN** the operator card edit body renders the weapon picker
- **THEN** the dropdown lists only weapons whose `type` equals the operator's `weapon` value, plus a "No Weapon" option

#### Scenario: Weapon equipped

- **WHEN** user selects a weapon from the picker
- **THEN** `weaponName` is set to the selected weapon's display name and queued for DB write

#### Scenario: Weapon level updated

- **WHEN** user sets the weapon level to a value between 1 and 90
- **THEN** `weaponLevel` is updated in local state and queued for DB write, clamped to 1–90

#### Scenario: Weapon cleared

- **WHEN** user selects the "No Weapon" option
- **THEN** `weaponName` is set to null and queued for DB write; `weaponLevel` is left unchanged

#### Scenario: Default weapon state

- **WHEN** an operator is added to the roster
- **THEN** `weaponName` is null and `weaponLevel` is 1

## MODIFIED Requirements

### Requirement: Operator card collapsed-summary composition

The collapsed (read-only) state of the operator card SHALL present investment as
gradient-colored stat chips, and the expanded (edit) state SHALL drive its level
and weapon-level sliders with the same shared investment gradient. The card SHALL
use the shared `getProgressStyle(value, min, max)` color language (rust → teal) so
AE matches HSR, R1999, and N2E. Because AE operators now track an equipped weapon,
the card SHALL render a `.game-card-static-line` gear one-liner for the equipped
weapon (name + level), matching the R1999 psychube line. The card SHALL NOT render
a rarity-star indicator.

#### Scenario: Level chip colored by investment

- **WHEN** an operator card renders its collapsed summary
- **THEN** the `Lv {level}` `StatChip` text and border color are computed via `getProgressStyle(level, 1, 90)`, so a low-level operator reads rust and a level-90 operator reads teal

#### Scenario: Phase chip colored by investment

- **WHEN** an operator card renders its collapsed summary
- **THEN** the `P{phase}` `StatChip` text and border color are computed via `getProgressStyle(phase, 0, 5)`

#### Scenario: Skills chip reflects maxed state

- **WHEN** an operator card renders its collapsed summary
- **THEN** a `Skills {✓|✗}` `StatChip` is shown, colored via `getProgressStyle(skillsMaxed ? 1 : 0, 0, 1)`

#### Scenario: Level slider uses the canonical class and shared gradient

- **WHEN** an operator card's edit body renders the level slider
- **THEN** the input uses the canonical `.level-slider` class and sets `--slider-fill-color` and `--slider-fill-glow` from `getProgressStyle(level, 1, 90)`, with the track fill percentage computed as `(level − 1) / 89`

#### Scenario: Equipped-weapon gear one-liner present

- **WHEN** an operator card renders its collapsed summary and a weapon is equipped
- **THEN** a `.game-card-static-line` shows the weapon name and `Lv {weaponLevel}`, colored via the shared gradient like the R1999 psychube line

#### Scenario: No weapon equipped

- **WHEN** an operator card renders its collapsed summary and no weapon is equipped
- **THEN** the `.game-card-static-line` shows an em-dash placeholder in the rust (empty) color

#### Scenario: No rarity-star indicator

- **WHEN** an operator card renders
- **THEN** no `.rarity-indicator` element is present; rarity remains a catalog field but is not displayed on the card
