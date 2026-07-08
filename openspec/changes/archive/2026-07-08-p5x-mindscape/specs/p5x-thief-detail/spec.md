## ADDED Requirements

### Requirement: Thief Mindscape maxed field

The system SHALL track a Thief's Mindscape completion as a boolean field
`mindscapeMaxed`, defaulting to `false` on add. When `true`, the thief's
entire Mindscape node tree is fully unlocked. Updates are optimistic and
persisted via debounced save.

#### Scenario: Default mindscape state

- **WHEN** a Thief is added to the roster
- **THEN** `mindscapeMaxed` is `false`

#### Scenario: Mark mindscape maxed

- **WHEN** user marks a Thief's Mindscape as maxed
- **THEN** `mindscapeMaxed` is set to `true` in local state immediately and queued for DB write via debounced save

#### Scenario: Unmark mindscape maxed

- **WHEN** user unmarks a Thief's Mindscape as maxed
- **THEN** `mindscapeMaxed` is set to `false` in local state immediately and queued for DB write via debounced save

### Requirement: Mindscape summary indicator

The collapsed (read-only) state of the Thief card SHALL derive a visual
indicator from `mindscapeMaxed`. When `true`, a "MS ✓" chip or equivalent
SHALL appear among the summary chips. When `false`, no Mindscape indicator
is shown, keeping the untouched card uncluttered.

#### Scenario: Mindscape maxed indicator shown

- **WHEN** a Thief card renders its collapsed summary with `mindscapeMaxed` `true`
- **THEN** a Mindscape completion indicator is shown among the summary chips

#### Scenario: No indicator when not maxed

- **WHEN** a Thief card renders its collapsed summary with `mindscapeMaxed` `false`
- **THEN** no Mindscape indicator is present

### Requirement: Mindscape edit toggle

The Thief card's edit body SHALL provide a toggle control for Mindscape
completion, rendered in a "Mindscape" `ProgressSection` below the Skills
section. The toggle SHALL be self-styled (not `.btn`).

#### Scenario: Mindscape section rendered below skills

- **WHEN** a Thief card's edit body renders
- **THEN** a "Mindscape" `ProgressSection` with the maxed toggle appears below the Skills section

#### Scenario: Toggle invokes mindscape updater

- **WHEN** user activates the Mindscape toggle
- **THEN** the card invokes the field update handler with the new `mindscapeMaxed` value
