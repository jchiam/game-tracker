## ADDED Requirements

### Requirement: Thief aggregate skill-progress fields

The system SHALL track a Thief's Persona skill progress as two boolean fields —
`skillsLeveled` (skills brought up to the level-8 incense cap) and `roseMaxed`
(pushed past the rose gate from 8 to the level-10 max) — both defaulting to `false`
on add. Progress is tracked in **aggregate** for the Thief, not per individual skill.
Updates are optimistic and persisted via debounced save.

#### Scenario: Default skill-progress state

- **WHEN** a Thief is added to the roster
- **THEN** `skillsLeveled` is `false` and `roseMaxed` is `false`

#### Scenario: Mark skills leveled

- **WHEN** user marks a Thief's skills as leveled
- **THEN** `skillsLeveled` is set to `true` in local state immediately and queued for DB write via debounced save

#### Scenario: Mark rose maxed

- **WHEN** user marks a Thief's skills as rose-maxed
- **THEN** `roseMaxed` is set to `true` and `skillsLeveled` is `true`, and both are queued for DB write in one patch

### Requirement: Skill-progress invariant

The system SHALL prevent the invalid state where `roseMaxed` is `true` while
`skillsLeveled` is `false`. The invariant SHALL be enforced at the interaction layer
(coupled toggles), the hook updater (which normalizes against current state), and the
database (a `CHECK` constraint on `p5x_tracked_thieves`).

#### Scenario: Enabling rose implies leveled

- **WHEN** user sets `roseMaxed` to `true` on a Thief whose `skillsLeveled` is `false`
- **THEN** `skillsLeveled` is coerced to `true` in the same update so the persisted state is `(true, true)`

#### Scenario: Clearing leveled clears rose

- **WHEN** user sets `skillsLeveled` to `false` on a Thief whose `roseMaxed` is `true`
- **THEN** `roseMaxed` is coerced to `false` in the same update so the persisted state is `(false, false)`

#### Scenario: Database rejects the invalid combination

- **WHEN** a row with `rose_maxed = true` and `skills_leveled = false` is written to `p5x_tracked_thieves`
- **THEN** the `CHECK` constraint rejects the write

### Requirement: Rose-gated summary indicator

The collapsed (read-only) state of the Thief card SHALL derive a **rose-gated** state
as `skillsLeveled && !roseMaxed` and present it as a distinct 🌹 badge among the
summary chips. When `roseMaxed` is `true`, the card SHALL instead present a
"skills maxed" indicator. When both fields are `false`, the card SHALL present no
skill indicator, keeping the untouched card uncluttered.

#### Scenario: Rose-gated badge shown

- **WHEN** a Thief card renders its collapsed summary with `skillsLeveled` `true` and `roseMaxed` `false`
- **THEN** a 🌹 rose-gated badge is shown

#### Scenario: Maxed indicator shown

- **WHEN** a Thief card renders its collapsed summary with `roseMaxed` `true`
- **THEN** a "skills maxed" indicator is shown and no rose-gated badge is present

#### Scenario: No indicator when untouched

- **WHEN** a Thief card renders its collapsed summary with both `skillsLeveled` and `roseMaxed` `false`
- **THEN** no skill indicator is present

### Requirement: Skill-progress edit controls

The Thief card's edit body SHALL provide two coupled toggle controls for skill
progress, rendered in a "Skills" `ProgressSection` below the Awareness section. The
toggles SHALL be self-styled (`.toggle-btn`, not `.btn`) and SHALL enforce the
coupling described in the skill-progress invariant so no interaction can produce the
invalid combination.

#### Scenario: Skills section rendered below awareness

- **WHEN** a Thief card's edit body renders
- **THEN** a "Skills" `ProgressSection` with the two toggles appears below the Awareness `ProgressSection`

#### Scenario: Toggle invokes skill-progress updater

- **WHEN** user activates either skill toggle
- **THEN** the card invokes the skill-progress update handler with the normalized `skillsLeveled` / `roseMaxed` values
