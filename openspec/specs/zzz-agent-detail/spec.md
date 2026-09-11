# zzz-agent-detail Specification

## Purpose

Zenless Zone Zero per-Agent tracked fields: level (1–60), Mindscape (M0–M6), Core Skill rung (cumulative A→F, A first and F max), aggregate skill progress (ordered 0–2: the Lv. 11 cap, then Pass-maxed to Lv. 12 — with a 🐹 Pass-gated derived state at 1 and its roster filter chip), favorite toggle, equipped Drive Disc tracking, disc build preferences, the disc editor modal, equipped W-Engine tracking, the W-Engine preference list and modal, build score, level- and score-based sort, roster search keys, and the agent card's composition over the shared Game Card Shell.

## Requirements

### Requirement: Agent level field

The system SHALL track an Agent's level as an integer in the range 1–60, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting. 60 is the current live-game cap; a future cap raise is a paired slider-max + DB CHECK change.

#### Scenario: Level updated within range

- **WHEN** user sets an Agent's level to a value between 1 and 60 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped

- **WHEN** an update would set level outside 1–60
- **THEN** the persisted value is clamped into range

### Requirement: Agent Mindscape field

The system SHALL track an Agent's Mindscape Cinema rank as an integer 0–6, defaulting to 0 on add, displayed as M0–M6. The edit control SHALL be a single-select rung control (0–6).

#### Scenario: Mindscape updated

- **WHEN** user selects a Mindscape rank 0–6
- **THEN** the value is updated optimistically and queued for DB write

#### Scenario: Mindscape displayed with M prefix

- **WHEN** an agent card renders a Mindscape value `n`
- **THEN** it is shown as `M{n}` (e.g. `M6`)

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

### Requirement: Favorite toggle

The system SHALL allow toggling an Agent's favorite status optimistically, reverting on failure. Favorited agents sort ahead of non-favorited agents in the roster.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on an agent card
- **THEN** `isFavorited` updates in local state immediately and persists via debounced save

### Requirement: ZZZ roster sort by level

The roster view SHALL offer a level sort mode ordering agents by level descending (favorites first), alongside the default alphabetical mode.

#### Scenario: Level sort selected

- **WHEN** user switches the roster sort to level
- **THEN** agents are ordered by level descending within favorite/non-favorite groups

### Requirement: ZZZ roster search keys

The roster search SHALL match agents against `name`, `specialty`, and `element` using the shared fuzzy search.

#### Scenario: Search by specialty

- **WHEN** user types `Rupture` in the roster search
- **THEN** agents whose specialty is Rupture are listed

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

### Requirement: Equipped Drive Disc tracking

The system SHALL track up to six equipped Drive Discs per agent, keyed by numeric slot 1–6. Each equipped disc records a suit id, a main stat, and up to four substat types (no numeric values). Slots 1–3 carry fixed main stats (HP, ATK, DEF respectively); slots 4–6 carry a main stat from that slot's pool. Persistence is one atomic `upsert_equipment_slot` RPC per `(agent, slot)` through the shared `upsertEquipmentSlot` helper — disc row upserted, substat rows replaced, in one statement; saves flow through the debounced queue with per-slot keys. Removing a disc deletes the row and sets the local slot to `null` — the model SHALL NOT use an empty-disc sentinel object, so in-session state always matches a reload.

#### Scenario: Disc saved to a slot

- **WHEN** user assigns a suit, main stat, and substats to slot 4 and closes the editor
- **THEN** the slot updates optimistically and a single-RPC upsert (disc + replaced substats) is queued under that agent+slot key

#### Scenario: Disc removed

- **WHEN** user clears slot 4
- **THEN** the local slot becomes `null` immediately and a delete is queued; a subsequent reload shows the same `null` slot

#### Scenario: Fixed-main slot saved

- **WHEN** user saves slot 2 with a suit selected
- **THEN** the persisted main stat is forced to ATK regardless of any transient editor state

### Requirement: Disc build preferences

The system SHALL track per-agent disc build preferences: a 4pc suit pick, a 2pc suit pick, ordered main-stat preference chains for slots 4–6 (with `>` / `>=` / `OR` operators), one global substat chain, and free-text comments. Saving SHALL replace all preference rows in one call through the shared preference-row helper, updating the suit picks and comments as parent columns, and SHALL be queued whole-object (latest-wins) under a per-agent key.

#### Scenario: Preferences saved

- **WHEN** user edits any preference field in the Build Preferences tab
- **THEN** the whole preferences object updates optimistically and one queued save replaces the preference rows and parent columns

#### Scenario: Preferences survive reload

- **WHEN** the roster reloads from DB
- **THEN** chains reconstruct in `order_index` order with operators intact, and suit picks and comments come from the parent row

### Requirement: Disc editor modal

The system SHALL provide a disc editor composed over the shared Equipment Editor Shell with an Equip tab and a Build Preferences tab. The Equip tab renders six slot cards: suit select over the single suit pool, main-stat select for slots 4–6 (read-only fixed stat for slots 1–3), and a substat list; stat controls are gated until a suit is chosen, and on save the main stat is pruned from the substat list. Opening the editor from a card slot SHALL scroll to that slot. The Build Preferences tab renders 4pc and 2pc suit selects, one preference chain per variable slot, the global substat chain, and build comments, all via the shared build-preference primitives.

#### Scenario: Editor opens anchored

- **WHEN** user clicks slot 5 on the agent card
- **THEN** the editor opens on the Equip tab scrolled to slot 5

#### Scenario: Gating before suit chosen

- **WHEN** a slot has no suit selected
- **THEN** its main-stat and substat controls are gated

#### Scenario: Main pruned from substats

- **WHEN** user saves slot 6 with Impact as main and Impact present in its substat list
- **THEN** the persisted substats exclude Impact

### Requirement: ZZZ roster sort by score

The roster view SHALL offer a score sort mode ordering agents by the blended build score descending (favorites first), alongside the alphabetical and level modes. Agents with the `-1` sentinel sort after scored agents.

#### Scenario: Score sort selected

- **WHEN** user switches the roster sort to score
- **THEN** agents order by build score descending within favorite/non-favorite groups, unscored agents last

### Requirement: Equipped W-Engine tracking

The system SHALL track one equipped W-Engine per agent: a catalog id (nullable), a level 0–60 (default 0), and a Phase 1–5 (default 1), stored as parent columns on the tracked-agent row and written through the plain field-update patch path. Existing rows with no engine SHALL load as null id / level 0 / Phase 1.

#### Scenario: Engine equipped

- **WHEN** user picks an engine in the card's W-Engine select
- **THEN** the agent updates optimistically and a debounced patch writes the engine id column

#### Scenario: Engine cleared

- **WHEN** user clears the engine select
- **THEN** the engine id becomes null locally and in the DB; level and Phase values are retained but not displayed

### Requirement: W-Engine preference list

The system SHALL track a ranked W-Engine preference list per agent: an ordered array of catalog ids, highest priority first, no duplicates, persisted as a single array column written atomically through the plain field-update patch path (no preference rows). A dedicated W-Engine modal SHALL edit the list via the shared ranked-list preference chain, offering only engines matching the agent's specialty, labelled with name and rarity letter.

#### Scenario: Preferences reordered

- **WHEN** user reorders the ranked list in the W-Engine modal
- **THEN** the array updates optimistically and one debounced patch writes the whole array column

#### Scenario: Specialty filter strict

- **WHEN** the modal lists engine options for a Stun agent
- **THEN** only Stun-specialty engines appear

### Requirement: W-Engine card section

The agent card SHALL render a W-Engine summary line in the collapsed body — engine name, level, and Phase with progress-gradient colouring, plus a match badge showing the equipped engine's preference rank (`#N`, or `Off-build` when listed preferences exclude it; hidden when no preferences or no engine) — and, in the edit body, a labeled W-Engine group containing the equip select (specialty-filtered), a level slider (0–60), Phase segmented buttons (P1–P5), and a preference strip: one icon tile per ranked engine (rank badge, equipped tile highlighted, `+N` overflow tile past the display cap), where tapping a tile only toggles a caption line naming that engine — tiles SHALL NOT mutate state. An Edit Preferences control under the strip (and the overflow tile) SHALL open the W-Engine modal.

#### Scenario: Summary line renders

- **WHEN** an agent has an equipped engine at level 50 Phase 3
- **THEN** the collapsed card shows the engine name, `Lv 50`, and `P3` with gradient colouring

#### Scenario: Match badge ranks

- **WHEN** the equipped engine is ranked #2 in a non-empty preference list
- **THEN** the summary match badge shows `#2`; an unlisted equipped engine shows `Off-build`

#### Scenario: Strip tiles are display-only

- **WHEN** user taps a preference strip tile
- **THEN** a caption line with the engine's rank and name toggles, and no equip or preference state changes

#### Scenario: Overflow tile

- **WHEN** the preference list exceeds the strip display cap
- **THEN** the strip shows the capped tiles followed by a `+N` overflow tile
