## Purpose

Honkai: Star Rail per-character tracked fields. Covers level, traces, 6 relic slots, build preference chains (main stat and sub-stat priority), and the stat preference chain structure shared with other games.

## Requirements

### Requirement: Character level field

The system SHALL track a character's level as an integer in the range 1–80, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting.

#### Scenario: Level updated within range

- **WHEN** user sets a character's level to a value between 1 and 80 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets a character's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets a character's level above 80
- **THEN** level is clamped to 80 before update

### Requirement: Traces attained toggle

The system SHALL track whether a character's traces (skill upgrades) have been fully attained as a boolean, defaulting to false on add.

#### Scenario: Traces toggled on

- **WHEN** user toggles traces to true
- **THEN** `tracesAttained` is set to true in local state and queued for DB write

#### Scenario: Traces toggled off

- **WHEN** user toggles traces to false
- **THEN** `tracesAttained` is set to false in local state and queued for DB write

### Requirement: Six relic slots

The system SHALL track one equipped relic per slot across six named slots: head, hands, body, feet, sphere, rope. Each slot defaults to null (empty) on character add.

#### Scenario: Relic saved to slot

- **WHEN** user saves relic data to a slot
- **THEN** slot is updated optimistically in local state and a debounced upsert is queued for that slot

#### Scenario: Relic cleared from slot

- **WHEN** user removes the relic from a slot
- **THEN** slot is set to an empty relic (`{ setId: null, mainStat: null, subStats: [] }`) in local state and a debounced delete is queued

#### Scenario: Relic structure

- **WHEN** a relic is equipped in any slot
- **THEN** it contains: `setId` (string or null), `mainStat` (string or null), `subStats` (array of stat-type id strings — no per-substat value)

### Requirement: Build preferences — main stat chains

The system SHALL track ordered stat preference chains for the four variable main-stat slots: body, feet, sphere, rope. Head and hands have fixed main stats and SHALL NOT have preference chains.

#### Scenario: Main stat preference saved

- **WHEN** user saves build preferences with main stat chains for body, feet, sphere, or rope
- **THEN** each chain is an ordered array of `StatPreference` entries persisted via non-atomic delete-then-reinsert (see shared-save-behaviour spec)

#### Scenario: Empty main stat chain

- **WHEN** no preferences are set for a variable slot
- **THEN** the chain is an empty array; the slot scores 0 for main stat match in relic scoring

### Requirement: Build preferences — sub-stat chain

The system SHALL track an ordered sub-stat preference chain shared across all relic slots for a character.

#### Scenario: Sub-stat preferences saved

- **WHEN** user saves a sub-stat preference chain
- **THEN** chain is an ordered array of `StatPreference` entries persisted alongside main stat chains

#### Scenario: Empty sub-stat chain

- **WHEN** no sub-stat preferences are set
- **THEN** sub-stat score is 0 for all slots in relic scoring

### Requirement: Build preferences — comments

The system SHALL support an optional free-text comments field on build preferences.

#### Scenario: Comments saved

- **WHEN** user enters comments in the build preferences editor
- **THEN** comments string is persisted with the preference rows

#### Scenario: No comments

- **WHEN** no comments are entered
- **THEN** comments field is undefined or absent

### Requirement: Stat preference chain structure

The system SHALL represent each entry in a stat preference chain as a `StatPreference` with three fields: `stat` (string), `operator` (string or null), and `orderIndex` (integer).

#### Scenario: Chain ordering

- **WHEN** multiple preferences exist in a chain
- **THEN** entries are ordered by `orderIndex` ascending, with lower index = higher priority

### Requirement: HSR roster sort by score

The system SHALL support sorting the HSR roster by calculated relic score (descending) in addition to the standard alphabetical sort.

#### Scenario: Sort by score selected

- **WHEN** user selects score sort
- **THEN** roster is ordered by `calculateRelicScore(character)` descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the shared-roster spec is applied with no score comparator

### Requirement: Character card collapse presentation

The HSR character card SHALL use the canonical collapse mechanism (see `shared-card-collapse`): a read-only static summary shown by default and an edit body shown when the card body has `.is-editing`, toggled by an edit button in the card-image overlay. The collapsed summary SHALL present exactly a compact, fixed set of investment chips and SHALL NOT show editing controls (sliders, the relic grid, or the Target Build display); those SHALL live in the edit body.

#### Scenario: Default state shows the read-only summary

- **WHEN** an HSR character card is rendered and not being edited
- **THEN** the collapsed summary is visible with the investment chips, and the level slider, traces checkbox, relic grid, and Target Build display are in the edit body (collapsed, `max-height: 0`)

#### Scenario: Edit toggle reveals the editing controls

- **WHEN** the user activates the card's edit toggle
- **THEN** `.is-editing` is applied to the card body, the summary collapses, and the edit body expands to reveal the level slider, traces checkbox, relic grid, and Target Build display

### Requirement: Collapsed summary composition

The collapsed summary SHALL contain three gradient-colored stat chips, colored via the shared investment gradient (`getProgressStyle`): a level chip `Lv {level}` (gradient over 1–80), a traces indicator chip showing attained/not (gradient: attained = complete/teal, not = uninvested/rust), and a relic slot-fill chip `Relics {n}/6` where `n` is the count of slots holding a relic with a non-null `setId` (gradient over 0–6). The relic-score badge SHALL remain in the card-image overlay with its existing tier logic and SHALL NOT move into the summary.

#### Scenario: Relic slot-fill count reflects equipped slots

- **WHEN** a character has relics with a non-null `setId` in 4 of the 6 slots
- **THEN** the summary shows a `Relics 4/6` chip whose color is the gradient value for 4 out of 6

#### Scenario: Traces indicator reflects attainment

- **WHEN** a character's `tracesAttained` is true
- **THEN** the traces chip renders in the complete (teal) end of the gradient; when false, it renders in the uninvested (rust) end

#### Scenario: Score badge stays in the overlay

- **WHEN** a character has build preferences and a calculated relic score
- **THEN** the score badge renders in the card-image overlay (not in the body summary), unchanged from current behavior

### Requirement: Collapsed summary gear one-liner

The HSR character card's collapsed summary SHALL include a `.game-card-static-line` displaying equipped relic set names with piece counts, providing a gear-at-a-glance digest consistent with R1999 and N2E cards. Set names SHALL use abbreviated short names from `RELIC_SHORT_NAMES`, falling back to full names for unmapped sets.

#### Scenario: Relic sets displayed with abbreviated names

- **WHEN** the card is in collapsed state and one or more relic slots have a `setId`
- **THEN** `.game-card-static-line` renders each set using its short display name (from `RELIC_SHORT_NAMES` mapping) followed by piece count, falling back to the full name if no short name is mapped

#### Scenario: Multiple sets displayed

- **WHEN** a character has relics from 2+ different sets
- **THEN** all sets are shown in descending count order (e.g. "Firesmith 4 · Streetwise 2"), separated by `·`, colored teal

#### Scenario: No relics equipped shows dash

- **WHEN** the card is in collapsed state and no relic slots have a `setId`
- **THEN** `.game-card-static-line` shows `—` with the `.no-equip` class, colored rust

#### Scenario: One-liner truncates with ellipsis

- **WHEN** the combined set text exceeds a single line width
- **THEN** the text is truncated with ellipsis (`text-overflow: ellipsis`, `white-space: nowrap`)

#### Scenario: Fixed 1-line height reservation

- **WHEN** the card is in collapsed state regardless of whether relics are equipped
- **THEN** the `.game-card-static-line` area reserves exactly 1 line of vertical space via `min-height`, ensuring uniform collapsed card height across all HSR cards

### Requirement: Build preferences — set preferences

The system SHALL track a preferred relic set and a preferred planar set on a character's build preferences, each a single nullable set id (not an ordered chain). The Build Preferences editor SHALL expose them as two `Select` controls. These preferences feed the relic-scoring set term (see hsr-relic-scoring "Relic and planar set term").

#### Scenario: Set preferences saved

- **WHEN** the user chooses a preferred relic set and a preferred planar set
- **THEN** each is persisted as a single scalar set id on the character's build preferences

#### Scenario: No set preference

- **WHEN** the user leaves a preferred set unset
- **THEN** its value is null and its half of the relic-scoring set term scores 0

#### Scenario: Set preference controls use the shared Select

- **WHEN** the Build Preferences editor renders the set-preference inputs
- **THEN** each is a shared `Select` control, not a raw `<select>`

### Requirement: Unified relic editor modal

The system SHALL provide a single `RelicEditorModal` per character covering all six relic slots, replacing the per-slot modal. The modal SHALL follow the shared equipment editor contract (see `shared-equipment-editor`): the Equip tab renders six slot cards (head, hands, body, feet, sphere, rope) — each with a set `Select` filtered by slot family (`1*` relic sets for head/hands/body/feet; `3*` planar sets for sphere/rope), a main-stat `Select` (read-only fixed stat for head HP and hands ATK), and a `SubStatList` — and accepts an anchor slot from the card's relic grid, scrolling that slot card into view on mount. Selecting a slot card's set "None" option SHALL clear that slot (the existing per-slot remove path); the footer SHALL contain only "Done" (no "Un-equip Relic" button).

The Build Preferences tab SHALL show, together and in the shared composition order (see `shared-equipment-editor`): the preferred relic-set and planar-set `Select`s, the main-stat `PreferenceChain`s for all four variable slots (body, feet, sphere, rope), the global substat `PreferenceChain`, and `BuildComments` — no longer only the opened slot's main chain.

#### Scenario: All six slots editable in one open

- **WHEN** the user opens the relic editor from any relic grid slot
- **THEN** all six slot cards are editable on the Equip tab, with the clicked slot scrolled into view

#### Scenario: Slot family filtering per card

- **WHEN** the sphere or rope slot card renders its set `Select`
- **THEN** only planar sets (id prefix `3`) are offered; head/hands/body/feet cards offer only relic sets (id prefix `1`)

#### Scenario: Set None clears the slot

- **WHEN** the user selects "None" on the body slot card's set `Select`
- **THEN** the body relic is removed (delete queued) while the other five slots are unaffected and the modal stays open

#### Scenario: Preferences tab shows all four main chains

- **WHEN** the user opens the Build Preferences tab
- **THEN** the two preferred-set `Select`s appear first, followed by the body, feet, sphere, and rope main-stat chains all visible at once, the substat chain, and `BuildComments`

### Requirement: HSR card level slider uses LevelSlider

The HSR character card's edit-body level control SHALL be the shared `LevelSlider` component (1–80), not a raw `<input type="range">`.

#### Scenario: Level control is the shared primitive

- **WHEN** the HSR card's edit body renders the level control
- **THEN** it is a `LevelSlider` with min 1, max 80, carrying the shared investment gradient fill

### Requirement: Equipped Light Cone

The system SHALL track an equipped Light Cone per character with three fields: `lightConeId` (string catalog id or null), `lightConeLevel` (integer 1–80), and `lightConeSuperimposition` (integer 1–5). Defaults on add: id null, level 1, superimposition 1. All three persist as columns on `hsr_tracked_characters` (`light_cone_id`, `light_cone_level`, `light_cone_superimposition`) and update as plain fields through the debounced save queue.

#### Scenario: Light Cone equipped

- **WHEN** user selects a Light Cone from the picker
- **THEN** `lightConeId` is updated in local state immediately and queued for DB write

#### Scenario: Light Cone unequipped

- **WHEN** user clears the Light Cone selection
- **THEN** `lightConeId` is set to null (level and superimposition retain their values but are not displayed)

#### Scenario: Level clamped to range

- **WHEN** user sets the Light Cone level outside 1–80
- **THEN** the value is clamped into 1–80 before update

#### Scenario: Superimposition set

- **WHEN** user selects a superimposition rank S1–S5
- **THEN** `lightConeSuperimposition` is updated in local state and queued for DB write

### Requirement: Path-filtered Light Cone picker

The Light Cone picker SHALL offer only cones whose `path` exactly matches the character's `path` — equipping is path-locked in game, so off-path cones are never listed. Options SHALL follow catalog order (rarity descending, then name). The picker SHALL include an empty option ("No Light Cone") that unequips.

#### Scenario: Only matching-path cones listed

- **WHEN** the picker renders for a character
- **THEN** its options are exactly `ALL_LIGHT_CONES.filter(lc => lc.path === character.path)` plus the empty option

#### Scenario: Off-path stored id still renders

- **WHEN** a tracked character's stored `lightConeId` no longer matches the character's path (e.g. after an upstream path change)
- **THEN** the summary still resolves and displays the cone by id; only the picker excludes off-path options

### Requirement: Light Cone card section

The character card SHALL show the Light Cone as an inline section in the psychube style. In the collapsed summary, a one-line readout renders `{name} · Lv {level} · S{superimposition}` with progress-gradient coloring per segment (level over 1–80, superimposition over 1–5), or a "No Light Cone" empty state when `lightConeId` is null. In the edit view, the cone equip controls render as a `ProgressSection` labelled "Equipped" inside the "Light Cone" section group (see Card equipment section clustering), composing the shared primitives: `Select` for the path-filtered picker, `LevelSlider` for level 1–80, and `SegmentedButtons` for S1–S5 — never raw `<select>`/`<input>` elements.

#### Scenario: Summary line with cone equipped

- **WHEN** a character has a Light Cone equipped at level 80 superimposition 5
- **THEN** the collapsed card shows `{cone name} · Lv 80 · S5` with each segment colored by its progress gradient

#### Scenario: Summary empty state

- **WHEN** `lightConeId` is null
- **THEN** the collapsed card shows "No Light Cone"

#### Scenario: Edit section composes shared primitives

- **WHEN** the card is in edit view
- **THEN** the Light Cone group's "Equipped" section renders `Select`, `LevelSlider` (1–80), and `SegmentedButtons` (S1–S5) inside a `ProgressSection`

### Requirement: Ranked Light Cone preference list

The system SHALL track an ordered list of preferred Light Cones per character: an array of Light Cone catalog ids, highest priority first, with no duplicate entries. The list is a top-level tracked-character field — deliberately NOT part of `buildPreferences`, which is relic-specific and persists through the relic editor's save flow. The list SHALL default to empty on character add and SHALL persist as a single array column on `hsr_tracked_characters` (`light_cone_preferences`), written atomically in one column update through the plain field-update path (debounced save queue) — never via delete-then-reinsert rows and never coupled to the relic build-preferences save.

#### Scenario: Preference list saved

- **WHEN** the user edits the ranked Light Cone list
- **THEN** the ordered id array updates optimistically in local state and a debounced plain field update writes the array column on the character row, index 0 being the first choice

#### Scenario: Empty list default

- **WHEN** a character is added or has never had Light Cone preferences set
- **THEN** `lightConePreferences` is an empty array and no preference-dependent UI (match badge) renders

#### Scenario: Order is significant

- **WHEN** the list contains multiple cone ids
- **THEN** array position defines rank (index 0 = rank #1) with no operator semantics between entries

#### Scenario: Saving cone preferences leaves relic preferences untouched

- **WHEN** the user saves only the Light Cone preference list
- **THEN** no relic build-preference rows are deleted, re-inserted, or otherwise written

### Requirement: Light Cone preference dialog

The system SHALL provide a dedicated Light Cone preferences dialog per character, opened from the character card's Light Cone section — a flow entirely separate from the relic editor modal, whose Build Preferences tab SHALL remain relic-only (sets, main-stat chains, substat chain, comments). The dialog SHALL render the ranked list with the shared ranked-list preference control (`PreferenceChain` `ranked-list` variant): per-row select, up/down reorder, per-row remove, and duplicate prevention. Options SHALL be exactly the cones whose `path` matches the character's path (the same strict filter as the equip picker), labelled with name and rarity, in catalog order (rarity descending, then name).

#### Scenario: Dialog opened from the card

- **WHEN** the user activates the Light Cone preferences launcher in the card's Light Cone section
- **THEN** the Light Cone preferences dialog opens for that character, showing its current ranked list

#### Scenario: Ranked list edited in the dialog

- **WHEN** the user adds, reorders, or removes entries in the dialog
- **THEN** the ordered list updates optimistically and is queued through the debounced field-update save

#### Scenario: Options are path-filtered

- **WHEN** the dialog renders its selectable options
- **THEN** only cones matching the character's path are offered, and cones already ranked are not offered again in other rows

#### Scenario: Off-path stored preference still resolves

- **WHEN** a stored preference id no longer matches the character's path (e.g. after an upstream path change)
- **THEN** the entry still renders resolved by id in its row; only newly addable options are path-filtered

#### Scenario: Relic editor unaffected

- **WHEN** the user opens the relic editor's Build Preferences tab
- **THEN** it contains no Light Cone controls

### Requirement: Card equipment section clustering

The HSR character card's edit body SHALL cluster equipment concerns into two labeled section groups using the canonical shared group pattern (`.card-section-group` + `.card-section-group-header`, N2E Console precedent): a "Light Cone" group containing the cone equip section and the preference-dialog launcher, and a "Relics" group containing the relic slot grid and the Target Build readout. Character progression sections (Level, Traces) SHALL remain ungrouped above them. Groups use the neutral shared styling — no per-game accent.

#### Scenario: Light Cone group composition

- **WHEN** the card is in edit view
- **THEN** a section group labeled "Light Cone" contains the equip controls and the Light Cone preferences launcher, in that order

#### Scenario: Relics group composition

- **WHEN** the card is in edit view
- **THEN** a section group labeled "Relics" contains the relic slot grid and, when present, the Target Build readout

#### Scenario: Progression sections stay ungrouped

- **WHEN** the card is in edit view
- **THEN** the Level and Traces sections render before the two groups and inside neither

### Requirement: Light Cone rank match badge

The character card's Light Cone summary line SHALL show a match badge when the character has at least one Light Cone preference and a cone equipped: the equipped cone's 1-based rank in the preference list (`#1`…`#n`), colored by the shared progress gradient where rank #1 is full/teal and lower ranks step toward rust, or the label `Off-build` in the uninvested (rust) end when the equipped cone is not in the list. The badge SHALL NOT render when the preference list is empty or no cone is equipped.

#### Scenario: Equipped cone ranked first

- **WHEN** the equipped cone's id is at index 0 of the preference list
- **THEN** the badge shows `#1` at the full (teal) end of the gradient

#### Scenario: Equipped cone ranked lower

- **WHEN** the equipped cone's id is at index k > 0 of an n-entry list
- **THEN** the badge shows `#{k+1}` colored by the gradient value for (n − k) out of n

#### Scenario: Equipped cone not in list

- **WHEN** preferences exist but the equipped cone's id is absent from the list
- **THEN** the badge shows `Off-build` in the rust end of the gradient

#### Scenario: No badge without prerequisites

- **WHEN** the preference list is empty or `lightConeId` is null
- **THEN** no match badge renders on the summary line
