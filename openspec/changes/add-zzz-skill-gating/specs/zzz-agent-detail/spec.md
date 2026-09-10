## ADDED Requirements

### Requirement: Agent aggregate skill-progress field

The system SHALL track an Agent's combat-skill progress as an ordered integer field
`skillProgress` in the range 0–2, defaulting to `0` on add: `0` means not started, `1` means all
five combat skills (Basic Attack, Dodge, Assist, Special Attack, Chain Attack) are raised to the
base Lv. 11 cap and are gated on Hamster Cage Passes, `2` means pushed past the Pass gate to the
base Lv. 12 max. Progress is tracked in **aggregate** for the Agent, not per individual skill. The
single ordered field encodes the monotone progression, so no representable state corresponds to
Pass-maxed without the Lv. 11 cap; the database SHALL enforce only the 0–2 range via a `CHECK`
constraint on `zzz_tracked_agents`. Updates SHALL be clamped to the 0–2 range before persisting,
are optimistic, and are persisted via debounced save. Because the in-game Mindscape Cinema grants
skill levels beyond the base cap, the field SHALL denote base-track progress only, and the system
SHALL NOT require the user to enter any Mindscape-derived bonus.

Existing rows migrated from the former five `skill_*_maxed` booleans SHALL be backfilled with `2`
where all five were `true` and `0` otherwise — the booleans cannot express the gated state, and a
partially-maxed set has no faithful aggregate value, so backfill understates rather than asserting
a gate state that may be false. The boolean columns are dropped in the same migration.

#### Scenario: Default skill-progress state

- **WHEN** an Agent is added to the roster
- **THEN** `skillProgress` is `0`

#### Scenario: Progress updated within range

- **WHEN** user sets an Agent's skill progress to 0, 1, or 2
- **THEN** the value is updated in local state immediately and queued for DB write via debounced
  save

#### Scenario: Progress clamped to range

- **WHEN** an update would set `skillProgress` outside 0–2
- **THEN** the value is clamped to the range before update

#### Scenario: Database rejects out-of-range values

- **WHEN** a row with `skill_progress` outside 0–2 is written to `zzz_tracked_agents`
- **THEN** the `CHECK` constraint rejects the write

#### Scenario: Legacy boolean columns backfilled

- **WHEN** the migration runs against rows carrying the legacy five booleans
- **THEN** a row with all five `true` backfills to `2` and every other row to `0`, and the five
  boolean columns are dropped

### Requirement: Pass-gated summary indicator

The collapsed (read-only) state of the agent card SHALL derive a **Pass-gated** state as
`skillProgress === 1` and present it as a distinct 🐹 badge among the summary chips. When
`skillProgress` is `2`, the card SHALL instead present a "skills maxed" indicator. When
`skillProgress` is `0`, the card SHALL present no skill indicator, keeping the untouched card
uncluttered.

#### Scenario: Pass-gated badge shown

- **WHEN** an agent card renders its collapsed summary with `skillProgress` `1`
- **THEN** a 🐹 Pass-gated badge is shown

#### Scenario: Maxed indicator shown

- **WHEN** an agent card renders its collapsed summary with `skillProgress` `2`
- **THEN** a "skills maxed" indicator is shown and no Pass-gated badge is present

#### Scenario: No indicator when untouched

- **WHEN** an agent card renders its collapsed summary with `skillProgress` `0`
- **THEN** no skill indicator is present

### Requirement: Skill-progress edit controls

The agent card's edit body SHALL provide a single segmented control for skill progression,
rendered in a "Skills" `ProgressSection` in the former skills row's position — directly after the
Core Skill control and before the W-Engine group. The control SHALL offer the two milestone
options "Lv11" and "Pass Lv12" (in that order), with deselection allowed to return to not started.
The control SHALL be the shared segmented-buttons component with investment coloring and the
default exact fill. The section's value readout SHALL reflect the state: "Maxed" at progress 2,
"Pass-gated" at progress 1, and an em-dash placeholder at 0.

#### Scenario: Skills section rendered after Core Skill

- **WHEN** an agent card's edit body renders
- **THEN** a "Skills" `ProgressSection` with the Lv11/Pass segmented row appears after the Core
  Skill section and before the W-Engine group

#### Scenario: Selecting a milestone invokes the updater

- **WHEN** user selects "Lv11" or "Pass Lv12" in the Skills segmented row
- **THEN** the card invokes the field update handler with `skillProgress` `1` or `2` respectively

#### Scenario: Deselecting returns to not started

- **WHEN** user deselects the active Skills milestone
- **THEN** the card invokes the field update handler with `skillProgress` `0`

#### Scenario: Section value reflects state

- **WHEN** the Skills section renders
- **THEN** its value readout is "Maxed" at `skillProgress` `2`, "Pass-gated" at `1`, otherwise the
  em-dash placeholder

### Requirement: Pass-gated roster filter

The ZZZ roster toolbar SHALL render a "🐹 Gated" filter chip that, when active, narrows the
displayed roster to only agents in the Pass-gated state (`skillProgress === 1`), following the
shared `roster-predicate-filter` pattern. The chip composes with existing search and sort.

#### Scenario: Filter chip shown in toolbar

- **WHEN** the ZZZ roster view renders
- **THEN** a "🐹 Gated" filter chip is visible in the toolbar area

#### Scenario: Activating the filter narrows roster

- **WHEN** user activates the "🐹 Gated" filter chip
- **THEN** only agents with `skillProgress === 1` are shown

#### Scenario: Deactivating the filter restores full roster

- **WHEN** user deactivates the "🐹 Gated" filter chip
- **THEN** all tracked agents (matching current search/sort) are shown again

#### Scenario: Filter composes with search and sort

- **WHEN** the Pass-gate filter is active with a search term and a non-default sort
- **THEN** only Pass-gated agents matching the search are shown, in the selected sort order

#### Scenario: Empty state when no agents are Pass-gated

- **WHEN** the Pass-gate filter is active but no agents have `skillProgress === 1`
- **THEN** a filter-specific empty state message is shown

## MODIFIED Requirements

### Requirement: Agent card composition

The agent card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, specialty and element badges, a rarity indicator (S/A), a build score badge in the header extra slot (hidden on the `-1` sentinel), a collapsed summary line (level, Mindscape, Core Skill, and the conditional skill-progress indicator) plus a suit digest line built from short names and piece counts (em-dash placeholder when no discs) and the W-Engine summary line, and edit sections for Level (slider 1–60), Mindscape, Core Skill, and the Skills segmented row followed by a labeled W-Engine group (equip controls + preference strip) and a labeled Drive Discs group containing the six-cell disc slot grid (suit icon or fallback glyph per cell; clicking a cell opens the disc editor anchored to that slot) and, when any preference is set, a Target Build readout (suit badges, per-slot and substat chain readouts, comments). The card SHALL NOT re-implement shell mechanics (header, controls, collapse).

#### Scenario: Card renders shell slots

- **WHEN** a tracked agent renders in the roster grid
- **THEN** the card shows portrait, S/A rarity indicator, specialty + element badges, score badge when scored, the collapsed summary of level, Mindscape (M-prefix), Core Skill letter, the skill-progress indicator when progress is nonzero, the suit digest line, and the W-Engine summary line

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Mindscape, Core Skill, and the Skills segmented row are shown in that order, followed by the W-Engine group and then the Drive Discs group with the slot grid

#### Scenario: Target Build readout gated

- **WHEN** an agent has no suit picks, no chains, and no comments
- **THEN** the Target Build readout does not render

#### Scenario: Slot cell opens editor

- **WHEN** user clicks a disc slot cell in the edit body
- **THEN** the disc editor modal opens anchored to that slot

## REMOVED Requirements

### Requirement: Agent combat skill maxed flags

**Reason**: Replaced by the aggregate `skillProgress` field. The five independent booleans could
not express the Hamster Cage Pass-gated state — the one intermediate state worth tracking — and
Jonathan chose the P5X aggregate shape over per-track granularity.

### Requirement: Agent combat skill card row

**Reason**: Replaced by the "Skill-progress edit controls" requirement. The five-chip `ToggleChips`
row and its maxed-count readout are superseded by the two-option segmented milestone row and the
conditional summary indicator.
