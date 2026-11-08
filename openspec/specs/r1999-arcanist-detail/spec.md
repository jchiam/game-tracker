## Purpose

Reverse: 1999 per-arcanist tracked fields. Covers level, portrait level (rarity-dependent max), resonance level, euphoria stage, psychube equipment (name + level + amplification), favorite toggle, and level-based sort.

## Requirements

### Requirement: Arcanist level field

The system SHALL track an arcanist's level as an integer in the range 1–60, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting.

#### Scenario: Level updated within range

- **WHEN** user sets an arcanist's level to a value between 1 and 60 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets an arcanist's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets an arcanist's level above 60
- **THEN** level is clamped to 60 before update

### Requirement: Portrait level field

The system SHALL track an arcanist's portrait level as an integer starting at 0, defaulting to 0 on add. The maximum varies by rarity: 6★ arcanists max at 5, 5★ at 3, 4★ at 2, 3★ at 1. This maximum is enforced at the UI layer, not the data layer.

#### Scenario: Portrait level updated

- **WHEN** user sets an arcanist's portrait level to a valid value
- **THEN** portrait level is updated in local state and queued for DB write

#### Scenario: Rarity-dependent maximum (informational)

- **WHEN** UI presents portrait level options for an arcanist
- **THEN** options are limited to 0 through the rarity-specific maximum (6★=5, 5★=3, 4★=2, 3★=1)

### Requirement: Resonance level field

The system SHALL track an arcanist's resonance level as an integer in the range 0–15, defaulting to 0 on add. Updates SHALL be clamped to this range.

#### Scenario: Resonance level updated within range

- **WHEN** user sets resonance level to a value between 0 and 15 inclusive
- **THEN** resonance level is updated in local state and queued for DB write

#### Scenario: Resonance level clamped

- **WHEN** user sets resonance level below 0 or above 15
- **THEN** value is clamped to the valid range before update

### Requirement: Euphoria stage field

The system SHALL track an arcanist's euphoria stage as an integer in the range 0–4, defaulting to 0 on add. Updates SHALL be clamped to this range.

#### Scenario: Euphoria stage updated within range

- **WHEN** user sets euphoria stage to a value between 0 and 4 inclusive
- **THEN** euphoria stage is updated in local state and queued for DB write

#### Scenario: Euphoria stage clamped

- **WHEN** user sets euphoria stage below 0 or above 4
- **THEN** value is clamped to the valid range before update

### Requirement: Psychube equipment

The system SHALL track an equipped psychube per arcanist with three fields: name (string key or null), level (integer 1–60), and amplification (integer 1–5). Defaults on add: name null, level 1, amplification 1.

#### Scenario: Psychube equipped

- **WHEN** user selects a psychube by name and sets its level
- **THEN** both `psychubeName` and `psychubeLevel` are updated in local state together and queued as a single debounced DB write

#### Scenario: Psychube unequipped

- **WHEN** user clears the psychube selection
- **THEN** `psychubeName` is set to null (level and amplification retain their values but are not displayed)

#### Scenario: Psychube amplification updated

- **WHEN** user sets amplification to a value between 1 and 5
- **THEN** `psychubeAmplification` is updated in local state and queued for DB write, clamped to 1–5

### Requirement: Favorite toggle

The system SHALL allow toggling the favorite status of a tracked arcanist. Updates are optimistic and persisted via debounced save.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on an arcanist
- **THEN** `isFavorited` is updated in local state immediately and queued for DB write

### Requirement: R1999 roster sort by level

The system SHALL support sorting the R1999 roster by arcanist level (descending) in addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the shared-roster spec is applied with no level comparator

### Requirement: R1999 roster search keys

The system SHALL search the R1999 roster using Fuse.js with keys: name, afflatus, damageType.

#### Scenario: Search by afflatus

- **WHEN** user searches for an afflatus name (e.g. "Star")
- **THEN** arcanists matching that afflatus are returned via fuzzy search

### Requirement: R1999 roster filter facets

The R1999 roster toolbar SHALL declare three filter facets holding seven chips
through the shared `roster-predicate-filter` pattern (off by default,
page-local, composing with search and sort), rendered as a matrix in this
order — the card's Resonance → Euphoria → Psychube section sequence:

| facet     | mode  | chip            | keeps arcanists where                                   | single-chip no-match copy                            |
| --------- | ----- | --------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Resonance | `one` | `Not started`   | `resonanceLevel === 0`                                  | `No arcanists without resonance started.`            |
| Resonance | `one` | `In progress`   | `resonanceLevel > 0 && resonanceLevel < 15`             | `No arcanists with resonance in progress.`           |
| Euphoria  | `one` | `Not started`   | `hasEuphoria && euphoriaStage === 0`                    | `No Euphoria arcanists without Euphoria started.`    |
| Euphoria  | `one` | `In progress`   | `hasEuphoria && euphoriaStage > 0 && euphoriaStage < 4` | `No Euphoria arcanists with Euphoria in progress.`   |
| Psychube  | `any` | `None equipped` | `psychubeName === null` — **exclusive**                 | `No arcanists without a psychube.`                   |
| Psychube  | `any` | `Under Lv 60`   | `psychubeName !== null && psychubeLevel < 60`           | `No arcanists with a psychube below Lv 60.`          |
| Psychube  | `any` | `Under A5`      | `psychubeName !== null && psychubeAmplification < 5`    | `No arcanists with un-maxed psychube amplification.` |

Every chip label is a noun phrase naming the state or the missing
progression; no chip label carries a dimension prefix, a glyph, a `<`
threshold, or a `✗`. Resonance and Euphoria are `one` mode: within each at
most one chip is active and the pair renders as one joined segment. Psychube
is `any` mode with `None equipped` declared exclusive: a level or
amplification question presumes an equipped psychube, so activating
`None equipped` deactivates `Under Lv 60` and `Under A5`, activating either
of those deactivates `None equipped`, and the two threshold chips intersect
freely; a divider separates `None equipped` from them in the row. `hasEuphoria` is the catalog flag carried on the tracked
arcanist; arcanists without the Euphoria system SHALL match neither Euphoria
chip. Chips across facets compose as a logical AND; when two or more chips
are active and nothing matches, the no-match copy is the generic
`No arcanists match the active filters.` Portrait level (dupe-bound) and
arcanist level (covered by the `Lv` sort) have no chip.

#### Scenario: Three facet rows render in card order

- **WHEN** the R1999 roster view renders with tracked arcanists
- **THEN** the filter block shows three labelled group rows, top to bottom "Resonance", "Euphoria", "Psychube", holding in order `Not started`, `In progress`; `Not started`, `In progress`; `None equipped`, `Under Lv 60`, `Under A5`

#### Scenario: Resonance and Euphoria render as joined segments

- **WHEN** the filter block renders
- **THEN** the Resonance and Euphoria chip pairs each render as one joined segmented pill, while the Psychube chips render as spaced pills with a vertical divider between `None equipped` and `Under Lv 60`

#### Scenario: No chips without tracked arcanists

- **WHEN** no arcanists are tracked
- **THEN** no filter block, facet row, or chip is rendered

#### Scenario: Resonance not-started chip narrows roster

- **WHEN** user activates Resonance `Not started`
- **THEN** only arcanists with `resonanceLevel === 0` are shown; arcanists at 1–15 are excluded

#### Scenario: Resonance in-progress chip narrows roster

- **WHEN** user activates Resonance `In progress`
- **THEN** only arcanists with `resonanceLevel` between 1 and 14 inclusive are shown; arcanists at 0 or 15 are excluded

#### Scenario: Resonance chips are exclusive

- **WHEN** Resonance `Not started` is active and user activates Resonance `In progress`
- **THEN** `In progress` becomes active and `Not started` becomes inactive in the same update, and the roster shows only in-progress arcanists

#### Scenario: Clicking the active Resonance chip clears the facet

- **WHEN** Resonance `In progress` is active and user clicks it again
- **THEN** no Resonance chip is active and no resonance predicate is applied

#### Scenario: Euphoria not-started chip narrows roster

- **WHEN** user activates Euphoria `Not started`
- **THEN** only arcanists with `hasEuphoria` true and `euphoriaStage === 0` are shown

#### Scenario: Euphoria in-progress chip narrows roster

- **WHEN** user activates Euphoria `In progress`
- **THEN** only arcanists with `hasEuphoria` true and `euphoriaStage` between 1 and 3 inclusive are shown; stage 4 is excluded

#### Scenario: Euphoria chips exclude arcanists without the Euphoria system

- **WHEN** either Euphoria chip is active and an arcanist has `hasEuphoria` false
- **THEN** that arcanist is excluded regardless of its `euphoriaStage`

#### Scenario: Euphoria chips are exclusive

- **WHEN** Euphoria `In progress` is active and user activates Euphoria `Not started`
- **THEN** `Not started` becomes active and `In progress` becomes inactive in the same update

#### Scenario: Psychube none-equipped chip narrows roster

- **WHEN** user activates `None equipped`
- **THEN** only arcanists with `psychubeName === null` are shown

#### Scenario: Psychube level chip narrows roster

- **WHEN** user activates `Under Lv 60`
- **THEN** only arcanists with a psychube equipped and `psychubeLevel < 60` are shown; arcanists with no psychube or a Lv 60 psychube are excluded

#### Scenario: Psychube amplification chip narrows roster

- **WHEN** user activates `Under A5`
- **THEN** only arcanists with a psychube equipped and `psychubeAmplification < 5` are shown; arcanists with no psychube or an A5 psychube are excluded

#### Scenario: Psychube chips toggle independently

- **WHEN** user activates `Under Lv 60` and then `Under A5`
- **THEN** both are active and only arcanists with an equipped psychube below Lv 60 AND below A5 are shown

#### Scenario: None equipped is exclusive with the threshold chips

- **WHEN** `Under Lv 60` and `Under A5` are active and user activates `None equipped`
- **THEN** `None equipped` is the only active Psychube chip and the predicate keeps only arcanists without a psychube

#### Scenario: A threshold chip clears None equipped

- **WHEN** `None equipped` is active and user activates `Under A5`
- **THEN** `Under A5` is active, `None equipped` is inactive, and the predicate keeps only equipped psychubes below A5

#### Scenario: Chips across facets intersect

- **WHEN** Resonance `In progress` and `Under A5` are both active
- **THEN** only arcanists satisfying both predicates are shown

#### Scenario: Chips compose with search and sort

- **WHEN** a chip is active, the user types a search term, and the sort is LEVEL
- **THEN** `getFilteredRoster` receives the term, `LEVEL`, and the composed predicate; deactivating the chip removes the predicate and leaves the term and sort in place

#### Scenario: Chip state resets on navigation

- **WHEN** the user navigates away from the R1999 roster page and returns
- **THEN** every chip is inactive

#### Scenario: Single-chip no-match copy

- **WHEN** exactly one chip is active and no arcanist matches
- **THEN** the roster shows that chip's no-match copy from the table above

#### Scenario: Multi-chip no-match copy

- **WHEN** two or more chips are active and no arcanist matches
- **THEN** the roster shows `No arcanists match the active filters.`

#### Scenario: Collapsible block with facet-labelled summary pills

- **WHEN** the block is collapsed while Resonance `In progress` and `Under A5` are active
- **THEN** the `Filters` header shows the count 2 and the summary pills read `Resonance · In progress` and `Psychube · Under A5`; removing the Psychube pill clears `Under A5` and leaves `In progress` active

#### Scenario: Held card ghost tag composes the facet label

- **WHEN** Resonance `In progress` is active and an arcanist's resonance is edited to 15 mid-edit
- **THEN** the card is held with the tag `no longer matches Resonance · In progress` until the edit commits
