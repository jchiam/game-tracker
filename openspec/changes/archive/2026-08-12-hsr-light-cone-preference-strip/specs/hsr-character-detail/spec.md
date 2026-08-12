## MODIFIED Requirements

### Requirement: Light Cone card section

The character card SHALL show the Light Cone as an inline section in the psychube style. In the collapsed summary, a one-line readout renders the equipped cone's catalog icon (resolved through the ImageKit light cone resolver) followed by `{name} · Lv {level} · S{superimposition}` with progress-gradient coloring per segment (level over 1–80, superimposition over 1–5), or a "No Light Cone" empty state when `lightConeId` is null. If the icon fails to load it SHALL be hidden, leaving the text readout intact. In the edit view, the cone equip controls render as a `ProgressSection` labelled "Equipped" inside the "Light Cone" section group (see Card equipment section clustering), composing the shared primitives: `Select` for the path-filtered picker, `LevelSlider` for level 1–80, and `SegmentedButtons` for S1–S5 — never raw `<select>`/`<input>` elements.

#### Scenario: Summary line with cone equipped

- **WHEN** a character has a Light Cone equipped at level 80 superimposition 5
- **THEN** the collapsed card shows the cone's icon followed by `{cone name} · Lv 80 · S5` with each text segment colored by its progress gradient

#### Scenario: Summary icon resolves through ImageKit

- **WHEN** the summary icon renders for an equipped cone
- **THEN** its source URL is the catalog `imageUrl` resolved through the ImageKit light cone resolver

#### Scenario: Summary icon load failure

- **WHEN** the summary icon fails to load
- **THEN** the icon is hidden and the text readout renders unchanged

#### Scenario: Summary empty state

- **WHEN** `lightConeId` is null
- **THEN** the collapsed card shows "No Light Cone"

#### Scenario: Edit section composes shared primitives

- **WHEN** the card is in edit view
- **THEN** the Light Cone group's "Equipped" section renders `Select`, `LevelSlider` (1–80), and `SegmentedButtons` (S1–S5) inside a `ProgressSection`

## ADDED Requirements

### Requirement: Light Cone preference strip

The card's edit view SHALL render a preference strip inside the Light Cone group's Preferences section whenever the ranked preference list is non-empty: one square tile per ranked cone in list order, each showing the cone's catalog icon and a rank badge (`#1`, `#2`, …), with a `>` separator between adjacent tiles. Each tile SHALL expose the cone's name and rarity as a tooltip. When the preference list is empty, no strip renders and the Preferences section shows only the Edit Preferences button, which remains unchanged in all cases.

#### Scenario: Strip renders ranked tiles in order

- **WHEN** a character has three ranked cone preferences
- **THEN** three tiles render in rank order with badges #1, #2, #3 and `>` separators between them

#### Scenario: Empty preference list

- **WHEN** `lightConePreferences` is empty
- **THEN** no strip renders

### Requirement: Preference strip equipped highlight

The tile whose cone is currently equipped SHALL be visually highlighted using the same progress-gradient colour the cone match badge derives for that rank (rank #1 reads full/teal; lower ranks step toward rust). When the equipped cone is not in the preference list, or no cone is equipped, no tile is highlighted.

#### Scenario: Equipped cone highlighted by rank colour

- **WHEN** the equipped cone is rank #2 of three preferences
- **THEN** the #2 tile is highlighted with the rank-#2 progress-gradient colour and the other tiles are not highlighted

#### Scenario: Equipped cone off-build

- **WHEN** the equipped cone is not in the preference list
- **THEN** no tile is highlighted

### Requirement: Preference strip tiles are display-only

Cone tiles SHALL NOT mutate any tracked state. Tapping a tile SHALL toggle a caption row under the strip showing that cone's rank, name, and rarity — the touch counterpart of the desktop hover tooltip. Tapping the same tile again SHALL hide the caption; tapping a different tile SHALL switch the caption to it. Equipping remains exclusively in the equip picker.

#### Scenario: Tap shows the caption without equipping

- **WHEN** user taps the #2 tile
- **THEN** a caption showing `#2 {name} ({rarity}★)` renders under the strip and no equip update is issued

#### Scenario: Tap again hides the caption

- **WHEN** user taps the tile whose caption is already shown
- **THEN** the caption is removed

### Requirement: Preference strip overflow cap

The strip SHALL show at most 5 cone tiles. When the preference list is longer, the first 5 render and a final `+N` overflow tile (N = remaining count) SHALL open the Light Cone preference editor when clicked.

#### Scenario: Six or more preferences

- **WHEN** a character has 7 ranked preferences
- **THEN** tiles #1–#5 render followed by a `+2` overflow tile

#### Scenario: Overflow tile opens the editor

- **WHEN** user clicks the overflow tile
- **THEN** the Light Cone preference editor opens

### Requirement: Preference strip fallbacks

A tile whose icon fails to load SHALL keep its rank badge visible so the tile is never empty. A ranked id with no catalog entry SHALL render as a rank-badge-only tile whose tooltip and tap caption show the raw id.

#### Scenario: Icon load failure

- **WHEN** a tile's icon fails to load
- **THEN** the tile renders its rank badge without an image

#### Scenario: Ranked id missing from catalog

- **WHEN** a ranked cone id has no entry in the catalog
- **THEN** its tile renders the rank badge with the raw id as tooltip
