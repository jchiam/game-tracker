## MODIFIED Requirements

### Requirement: Thief Mindscape maxed field

The system SHALL track a Thief's Mindscape completion as an ordered integer
field `mindscapeProgress` in the range 0–2, defaulting to `0` on add: `0` means
not started, `1` means the Outer half of the Mindscape node tree is fully
unlocked, `2` means the Inner half is also fully unlocked — and therefore the
entire tree, since Inner nodes are blocked until Outer is done. The single
field encodes this monotone progression; no combination can express Inner
without Outer. Updates SHALL be clamped to the 0–2 range before persisting, are
optimistic, and are persisted via debounced save.

Existing rows migrated from the former `mindscapeMaxed` boolean SHALL be
backfilled with `2` where the boolean was `true` (the old "maxed" meant the
entire tree) and `0` otherwise.

#### Scenario: Default mindscape state

- **WHEN** a Thief is added to the roster
- **THEN** `mindscapeProgress` is `0`

#### Scenario: Progress updated within range

- **WHEN** user sets a Thief's Mindscape progress to 0, 1, or 2
- **THEN** the value is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Progress clamped to range

- **WHEN** an update would set `mindscapeProgress` outside 0–2
- **THEN** the value is clamped to the range before update

#### Scenario: Legacy maxed value backfilled

- **WHEN** the migration runs against a row whose `mindscape_maxed` is `true`
- **THEN** the row's `mindscape_progress` is `2`

### Requirement: Mindscape summary indicator

The collapsed (read-only) state of the Thief card SHALL derive a graded visual
indicator from `mindscapeProgress`. At `2`, an "MS ✓" chip SHALL appear among
the summary chips. At `1`, the chip SHALL read "MS O". At `0`, no Mindscape
indicator is shown, keeping the untouched card uncluttered. The chip's position
in the summary ordering is unchanged.

#### Scenario: Whole tree maxed shows check mark

- **WHEN** a Thief card renders its collapsed summary with `mindscapeProgress` `2`
- **THEN** an "MS ✓" chip is shown among the summary chips

#### Scenario: Outer only shows O

- **WHEN** a Thief card renders its collapsed summary with `mindscapeProgress` `1`
- **THEN** an "MS O" chip is shown among the summary chips

#### Scenario: No indicator when not started

- **WHEN** a Thief card renders its collapsed summary with `mindscapeProgress` `0`
- **THEN** no Mindscape indicator is present

### Requirement: Mindscape edit toggle

The Thief card's edit body SHALL provide a single segmented control for
Mindscape progression, rendered in a "Mindscape" `ProgressSection` below the
Weapon section. The control SHALL offer the two milestone options "Outer" and
"Inner" (in that order), with deselection allowed to return to not started;
selecting "Inner" represents the whole tree being done. The control SHALL be
the shared segmented-buttons component with investment coloring (matching the
Awareness, Weapon-forge, and Skills rows), not `.btn`. The section's value
readout SHALL reflect the state: "Maxed" at progress 2, "Outer" at progress 1,
and an em-dash placeholder at 0.

#### Scenario: Mindscape section rendered below Weapon

- **WHEN** a Thief card's edit body renders
- **THEN** a "Mindscape" `ProgressSection` with the Outer/Inner segmented row appears below the Weapon section

#### Scenario: Selecting a milestone invokes the updater

- **WHEN** user selects "Outer" or "Inner" in the Mindscape segmented row
- **THEN** the card invokes the field update handler with `mindscapeProgress` `1` or `2` respectively

#### Scenario: Deselecting returns to not started

- **WHEN** user deselects the active Mindscape milestone
- **THEN** the card invokes the field update handler with `mindscapeProgress` `0`

#### Scenario: Section value reflects state

- **WHEN** the Mindscape section renders
- **THEN** its value readout is "Maxed" at `mindscapeProgress` `2`, "Outer" at `1`, otherwise the em-dash placeholder

### Requirement: Thief aggregate skill-progress fields

The system SHALL track a Thief's Persona skill progress as an ordered integer
field `skillProgress` in the range 0–2, defaulting to `0` on add: `0` means not
started, `1` means skills are brought up to the level-8 incense cap, `2` means
pushed past the rose gate to the level-10 max. Progress is tracked in
**aggregate** for the Thief, not per individual skill. The single field encodes
the monotone progression; no combination can express rose-maxed without the
Lv8 cap. Updates SHALL be clamped to the 0–2 range before persisting, are
optimistic, and are persisted via debounced save.

Existing rows migrated from the former `skillsLeveled` / `roseMaxed` boolean
pair SHALL be backfilled with `2` where `rose_maxed` was `true`, `1` where only
`skills_leveled` was `true`, and `0` otherwise.

#### Scenario: Default skill-progress state

- **WHEN** a Thief is added to the roster
- **THEN** `skillProgress` is `0`

#### Scenario: Progress updated within range

- **WHEN** user sets a Thief's skill progress to 0, 1, or 2
- **THEN** the value is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Progress clamped to range

- **WHEN** an update would set `skillProgress` outside 0–2
- **THEN** the value is clamped to the range before update

#### Scenario: Legacy boolean pair backfilled

- **WHEN** the migration runs against rows with the legacy boolean pair
- **THEN** a `rose_maxed` row backfills to `2`, a `skills_leveled`-only row to `1`, and an untouched row to `0`

### Requirement: Skill-progress invariant

The system SHALL make the invalid state "rose-maxed without the Lv8 cap"
unrepresentable by encoding skill progress as the single ordered
`skillProgress` field. No interaction-layer coupling or hook normalization is
required; the database SHALL enforce only the 0–2 range via a `CHECK`
constraint on `p5x_tracked_thieves`, replacing the former
`p5x_thief_skill_gate` pair constraint.

#### Scenario: Invalid combination is unrepresentable

- **WHEN** any skill-progress update is applied
- **THEN** the resulting state is one of exactly three valid values (0, 1, 2) — no representable state corresponds to rose-maxed without the Lv8 cap

#### Scenario: Database rejects out-of-range values

- **WHEN** a row with `skill_progress` outside 0–2 is written to `p5x_tracked_thieves`
- **THEN** the `CHECK` constraint rejects the write

### Requirement: Rose-gated summary indicator

The collapsed (read-only) state of the Thief card SHALL derive a **rose-gated**
state as `skillProgress === 1` and present it as a distinct 🌹 badge among the
summary chips. When `skillProgress` is `2`, the card SHALL instead present a
"skills maxed" indicator. When `skillProgress` is `0`, the card SHALL present
no skill indicator, keeping the untouched card uncluttered.

#### Scenario: Rose-gated badge shown

- **WHEN** a Thief card renders its collapsed summary with `skillProgress` `1`
- **THEN** a 🌹 rose-gated badge is shown

#### Scenario: Maxed indicator shown

- **WHEN** a Thief card renders its collapsed summary with `skillProgress` `2`
- **THEN** a "skills maxed" indicator is shown and no rose-gated badge is present

#### Scenario: No indicator when untouched

- **WHEN** a Thief card renders its collapsed summary with `skillProgress` `0`
- **THEN** no skill indicator is present

### Requirement: Skill-progress edit controls

The Thief card's edit body SHALL provide a single segmented control for skill
progression, rendered in a "Skills" `ProgressSection` below the Mindscape
section — the identical control design as the Mindscape section, since both
dimensions are monotone two-milestone progressions. The control SHALL offer the
two milestone options "Lv8" and "Rose Lv10" (in that order), with deselection
allowed to return to not started. The control SHALL be the shared
segmented-buttons component with investment coloring, not `.btn`. The section's
value readout SHALL reflect the state: "Maxed" at progress 2, "Rose-gated" at
progress 1, and an em-dash placeholder at 0.

#### Scenario: Skills section rendered below Mindscape

- **WHEN** a Thief card's edit body renders
- **THEN** a "Skills" `ProgressSection` with the Lv8/Rose segmented row appears below the Mindscape `ProgressSection`

#### Scenario: Selecting a milestone invokes the updater

- **WHEN** user selects "Lv8" or "Rose Lv10" in the Skills segmented row
- **THEN** the card invokes the field update handler with `skillProgress` `1` or `2` respectively

#### Scenario: Deselecting returns to not started

- **WHEN** user deselects the active Skills milestone
- **THEN** the card invokes the field update handler with `skillProgress` `0`

#### Scenario: Section value reflects state

- **WHEN** the Skills section renders
- **THEN** its value readout is "Maxed" at `skillProgress` `2`, "Rose-gated" at `1`, otherwise the em-dash placeholder

### Requirement: Rose-gated roster filter

The P5X roster toolbar SHALL render a "🌹 Gated" filter chip that, when active,
narrows the displayed roster to only thieves in the rose-gated state
(`skillProgress === 1`). The chip composes with existing search and sort.

#### Scenario: Filter chip shown in toolbar

- **WHEN** the P5X roster view renders
- **THEN** a "🌹 Gated" filter chip is visible in the toolbar area

#### Scenario: Activating the filter narrows roster

- **WHEN** user activates the "🌹 Gated" filter chip
- **THEN** only thieves with `skillProgress === 1` are shown

#### Scenario: Deactivating the filter restores full roster

- **WHEN** user deactivates the "🌹 Gated" filter chip
- **THEN** all tracked thieves (matching current search/sort) are shown again

#### Scenario: Filter composes with level sort

- **WHEN** the rose-gate filter is active and sort is set to LEVEL
- **THEN** only rose-gated thieves are shown, sorted by level descending (favorites first)

#### Scenario: Filter composes with search

- **WHEN** the rose-gate filter is active and user searches "fire"
- **THEN** only rose-gated thieves matching "fire" are shown

#### Scenario: Empty state when no thieves are rose-gated

- **WHEN** the rose-gate filter is active but no thieves have `skillProgress === 1`
- **THEN** an empty state message is shown (e.g., "No rose-gated thieves")
