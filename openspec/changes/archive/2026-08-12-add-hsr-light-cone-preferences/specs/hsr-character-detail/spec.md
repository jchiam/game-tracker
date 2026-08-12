## MODIFIED Requirements

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

## ADDED Requirements

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
