## ADDED Requirements

### Requirement: Agent combat skill maxed flags

The system SHALL track, per Agent, five independent booleans recording whether each of the five
in-game combat skills has been raised to its base maximum of Lv. 12: Basic Attack, Dodge, Assist,
Special Attack, and Chain Attack. Each flag SHALL default to `false` on add. Skill levels below the
maximum SHALL NOT be tracked — a flag records only the finished/unfinished state of that track. The
flags SHALL be independent of one another: setting one SHALL NOT change any other. Because the
in-game Mindscape Cinema grants skill levels beyond the base cap, a flag SHALL denote completion of
the base Lv. 12 track only, and the system SHALL NOT require the user to enter any Mindscape-derived
bonus.

#### Scenario: Skill flag toggled

- **WHEN** user toggles the maxed flag for one of the five combat skills
- **THEN** that flag alone updates optimistically and is queued for DB write, and the other four
  flags are unchanged

#### Scenario: Flags default to unfinished

- **WHEN** an agent is added to the roster
- **THEN** all five combat skill maxed flags are `false`

#### Scenario: Skill levels are not tracked

- **WHEN** a skill is not maxed
- **THEN** the system records only `false` for that skill and offers no control for entering its
  numeric level

### Requirement: Agent combat skill card row

The agent card SHALL render the five combat skill maxed flags as a single labeled row in the edit
body, positioned directly after the Core Skill control and before the W-Engine group. The row SHALL
present one independently-toggleable control per skill, ordered to match the in-game skills screen:
Basic Attack, Dodge, Assist, Special Attack, Chain Attack. The row's section value SHALL display the
count of maxed skills out of five. The collapsed summary SHALL include exactly one additional chip
carrying that same maxed count, so the number of collapsed summary lines is unchanged.

#### Scenario: Skills row rendered in edit mode

- **WHEN** user toggles the card into edit mode
- **THEN** a labeled skills row appears after the Core Skill control and before the W-Engine group,
  with one control per skill in the order Basic Attack, Dodge, Assist, Special Attack, Chain Attack

#### Scenario: Maxed count displayed

- **WHEN** three of the five skills are flagged maxed
- **THEN** the row's section value reads `3 / 5` and the collapsed summary chip reports the same
  count

#### Scenario: Collapsed layout unchanged

- **WHEN** a tracked agent renders collapsed
- **THEN** the skills count appears as a chip in the existing chip row, and no additional summary
  line is introduced

## MODIFIED Requirements

### Requirement: Agent Core Skill field

The system SHALL track an Agent's Core Skill enhancement rung as an integer 0–6, defaulting to 0 on
add, where 0 means no enhancement purchased and 1–6 display as the in-game letter rungs A, B, C, D,
E, F in that order — `A` is the first and cheapest rung and `F` is the maximum. Rung 0 SHALL NOT be
described as locked: the Core Passive is active from the moment the Agent is obtained, and 0 denotes
an unenhanced Core Skill. The edit control SHALL be a cumulative rung ladder ordered A→F, in which
every rung up to and including the selected rung renders as attained, reflecting that each rung is a
prerequisite of the next. Selecting a rung SHALL set the value to that rung; deselecting the
currently selected rung SHALL return the value to 0. The stored integer semantics are unchanged by
the letter-ordering correction, so existing stored values require no migration.

#### Scenario: Core Skill updated

- **WHEN** user selects a Core Skill rung
- **THEN** the value is updated optimistically and queued for DB write

#### Scenario: Letter display

- **WHEN** an agent card renders Core Skill value 1
- **THEN** it is shown as `A`; value 6 shows as `F`; value 0 shows as unenhanced/none

#### Scenario: Prerequisite rungs render as attained

- **WHEN** an agent's Core Skill is 3
- **THEN** rungs `A`, `B`, and `C` all render as attained and rungs `D`, `E`, `F` render as
  unattained

#### Scenario: Deselect returns to unenhanced

- **WHEN** user selects the currently selected Core Skill rung
- **THEN** the value returns to 0 and no rung renders as attained

### Requirement: Agent card composition

The agent card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, specialty and element badges, a rarity indicator (S/A), a build score badge in the header extra slot (hidden on the `-1` sentinel), a collapsed summary line (level, Mindscape, Core Skill, maxed combat skill count) plus a suit digest line built from short names and piece counts (em-dash placeholder when no discs) and the W-Engine summary line, and edit sections for Level (slider 1–60), Mindscape, Core Skill, and the combat skill maxed row followed by a labeled W-Engine group (equip controls + preference strip) and a labeled Drive Discs group containing the six-cell disc slot grid (suit icon or fallback glyph per cell; clicking a cell opens the disc editor anchored to that slot) and, when any preference is set, a Target Build readout (suit badges, per-slot and substat chain readouts, comments). The card SHALL NOT re-implement shell mechanics (header, controls, collapse).

#### Scenario: Card renders shell slots

- **WHEN** a tracked agent renders in the roster grid
- **THEN** the card shows portrait, S/A rarity indicator, specialty + element badges, score badge when scored, the collapsed summary of level, Mindscape (M-prefix), Core Skill letter, maxed combat skill count, the suit digest line, and the W-Engine summary line

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Mindscape, Core Skill, and the combat skill maxed row are shown in that order, followed by the W-Engine group and then the Drive Discs group with the slot grid

#### Scenario: Target Build readout gated

- **WHEN** an agent has no suit picks, no chains, and no comments
- **THEN** the Target Build readout does not render

#### Scenario: Slot cell opens editor

- **WHEN** user clicks a disc slot cell in the edit body
- **THEN** the disc editor modal opens anchored to that slot
