# czn-combatant-detail Specification

## Purpose

Chaos Zero Nightmare per-Combatant tracked fields: level (1–62), Manifest Ego rank (T0–T6), Potential attained toggle, favorite toggle, level-based sort, roster search keys, roster filter facets, and the combatant card's composition over the shared Game Card Shell.

## Requirements

### Requirement: Combatant level field

The system SHALL track a Combatant's level as an integer in the range 1–62, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting. 62 is the end-game maximum (base cap 60 plus 2 from Unconscious Awakening); per-combatant cap progress is not tracked.

#### Scenario: Level updated within range

- **WHEN** user sets a Combatant's level to a value between 1 and 62 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped

- **WHEN** an update would set level outside 1–62
- **THEN** the persisted value is clamped into range

### Requirement: Combatant Manifest Ego field

The system SHALL track a Combatant's Manifest Ego rank as an integer 0–6, defaulting to 0 on add, where 0 is the base state and 1–6 are the six dupe unlocks. It SHALL be displayed as `T{n}` and edited with a single-select rung control (T0–T6).

#### Scenario: Ego updated

- **WHEN** user selects a Manifest Ego rank 0–6
- **THEN** the value is updated optimistically and queued for DB write

#### Scenario: Ego displayed with T prefix

- **WHEN** a combatant card renders an Ego value `n`
- **THEN** it is shown as `T{n}` (e.g. `T6`)

### Requirement: Potential attained toggle

The system SHALL track whether a Combatant's Potential tree has been fully unlocked as a boolean, defaulting to false on add. Individual Potential nodes are not tracked.

#### Scenario: Potential toggled on

- **WHEN** user toggles Potential to true
- **THEN** `potentialAttained` is set to true in local state and queued for DB write

#### Scenario: Potential toggled off

- **WHEN** user toggles Potential to false
- **THEN** `potentialAttained` is set to false in local state and queued for DB write

### Requirement: Favorite toggle

The system SHALL allow toggling a Combatant's favorite status optimistically, reverting on failure. Favorited combatants sort ahead of non-favorited combatants in the roster.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on a combatant card
- **THEN** `isFavorited` updates in local state immediately and persists via debounced save

### Requirement: CZN roster sort by level

The roster view SHALL offer a level sort mode ordering combatants by level descending (favorites first), alongside the default alphabetical mode.

#### Scenario: Level sort selected

- **WHEN** user switches the roster sort to level
- **THEN** combatants are ordered by level descending within favorite/non-favorite groups

### Requirement: CZN roster search keys

The roster search SHALL match combatants against `name`, `class`, and `element` using the shared fuzzy search.

#### Scenario: Search by class

- **WHEN** user types `Psionic` in the roster search
- **THEN** combatants whose class is Psionic are listed

### Requirement: Combatant card composition

The combatant card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, class and element badges, a rarity indicator (4★/5★), a build score badge in the header extra slot (hidden on the `-1` sentinel, see `czn-build-scoring`), a collapsed summary of level, Ego rank, and Potential state, a Partner summary line (see `czn-partner-tracking`), a Memory Fragment set digest line (see `czn-fragment-tracking`), and edit sections for Level (slider 1–62), Manifest Ego (rung control), Potential (toggle), Partner, Preferred Partners, and a labeled Memory Fragments group containing the six-cell slot grid and the gated Target Build readout, in that order. The card SHALL NOT re-implement shell mechanics.

#### Scenario: Card renders shell slots

- **WHEN** a tracked combatant renders in the roster grid
- **THEN** the card shows portrait, rarity indicator, class + element badges, the score badge when scored, the collapsed summary of level, Ego (`T` prefix), and Potential attained/not, the Partner summary line, and the set digest line

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Manifest Ego, Potential, Partner, Preferred Partners, and the Memory Fragments group (slot grid, then Target Build when preferences exist) are shown in that order

### Requirement: CZN roster filter facets

The CZN roster toolbar SHALL declare three filter facets and one bare chip — eight chips — through the shared `roster-predicate-filter` pattern (off by default, page-local, composing with search and sort), in the card's Level → Potential → Partner → Fragments order, with the predicates and copy in the scenarios below. Manifest Ego and Partner Manifest Ego (dupe-bound) and class, attribute, and rarity (covered by search) have no chip.

#### Scenario: Rows render in card order

- **WHEN** the CZN roster view renders with tracked combatants
- **THEN** the filter block shows, top to bottom, a "Level" row holding `Under Lv 60`, `Awakening`; an unlabelled row holding `Not attained`; a "Partner" row holding `None equipped`, `Under Lv 60`, `Off-build`; and a "Fragments" row holding `Open slots`, `No build`

#### Scenario: No chips without tracked combatants

- **WHEN** no combatants are tracked
- **THEN** no filter block, facet row, or chip is rendered

#### Scenario: Level facet renders as a joined segment

- **WHEN** the filter block renders
- **THEN** the Level chips render as one joined segmented pill, while the Partner and Fragments chips render as spaced pills with a vertical divider between `None equipped` and `Under Lv 60`

#### Scenario: Under Lv 60 level chip narrows roster

- **WHEN** user activates Level `Under Lv 60`
- **THEN** only combatants with `level < 60` are shown, and the single-chip no-match copy is `No combatants below Lv 60.`

#### Scenario: Awakening chip narrows roster

- **WHEN** user activates Level `Awakening`
- **THEN** only combatants at Lv 60 or 61 (Unconscious Awakening pending) are shown; combatants below 60 or at 62 are excluded, and the single-chip no-match copy is `No combatants with Awakening pending.`

#### Scenario: Level chips are mutually exclusive

- **WHEN** Level `Under Lv 60` is active and user activates `Awakening`
- **THEN** `Awakening` becomes active and `Under Lv 60` becomes inactive in the same update

#### Scenario: Potential chip narrows roster

- **WHEN** user activates `Not attained`
- **THEN** only combatants whose Potential is not attained are shown, and the single-chip no-match copy is `No combatants with Potential pending.`

#### Scenario: Partner none-equipped chip narrows roster

- **WHEN** user activates Partner `None equipped`
- **THEN** only combatants with no Partner equipped are shown, and the single-chip no-match copy is `No combatants without a Partner.`

#### Scenario: Partner level chip narrows roster

- **WHEN** user activates Partner `Under Lv 60`
- **THEN** only combatants with a Partner equipped below Lv 60 are shown; combatants with no Partner are excluded, and the single-chip no-match copy is `No combatants with a Partner below Lv 60.`

#### Scenario: Partner off-build chip narrows roster

- **WHEN** user activates Partner `Off-build`
- **THEN** only combatants with a Partner equipped, a non-empty preferred-Partners list, and an equipped Partner absent from that list are shown; a combatant running any listed Partner, with an empty list, or with no Partner is excluded, and the single-chip no-match copy is `No combatants with an off-build Partner.`

#### Scenario: Partner none-equipped is exclusive

- **WHEN** Partner `Under Lv 60` and `Off-build` are active and user activates `None equipped`
- **THEN** `None equipped` becomes active and both other Partner chips become inactive in the same update; activating either of them afterwards deactivates `None equipped`

#### Scenario: Partner threshold chips intersect

- **WHEN** Partner `Under Lv 60` and `Off-build` are both active
- **THEN** only combatants matching both are shown

#### Scenario: Fragments open-slots chip narrows roster

- **WHEN** user activates Fragments `Open slots`
- **THEN** only combatants with fewer than six Memory Fragment slots equipped are shown, and the single-chip no-match copy is `No combatants with open fragment slots.`

#### Scenario: Fragments no-build chip agrees with the score

- **WHEN** user activates Fragments `No build`
- **THEN** only combatants with no slot IV–VI main-stat chain, no substat chain, and no target set are shown — the same test the fragment scorer uses for its insufficient-data sentinel — and the single-chip no-match copy is `No combatants without a fragment Target Build.`

#### Scenario: Chips across facets compose as AND

- **WHEN** Level `Awakening` and Partner `None equipped` are both active and no combatant matches both
- **THEN** the roster shows `No combatants match the active filters.`
