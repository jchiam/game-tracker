## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Resonance-gate filter predicate

**Reason**: Folded into the consolidated "R1999 roster filter facets" requirement as Resonance `In progress`, paired with the new `Not started` chip in a `one`-mode facet.
**Migration**: The predicate (`resonanceLevel > 0 && resonanceLevel < 15`) is unchanged; the generic predicate-seam text it restated lives in `roster-predicate-filter`.

### Requirement: Resonance-gate filter chip

**Reason**: The `💠 Resonating` chip is relabelled `In progress` under the Resonance facet in the consolidated requirement.
**Migration**: No-match copy is unchanged; the chip key becomes `resonanceInProgress` and the ghost tag reads `no longer matches Resonance · In progress`. Chip keys are page-local and never persisted, so no data migration. Tests asserting the `💠 Resonating` label select the chip within the Resonance group instead.

### Requirement: Gluttony-gate filter predicate

**Reason**: Folded into the consolidated "R1999 roster filter facets" requirement as Psychube `Under A5`, alongside the new `None equipped` and `Under Lv 60` chips.
**Migration**: The predicate (`psychubeName !== null && psychubeAmplification < 5`) is unchanged.

### Requirement: Gluttony-gate filter chip

**Reason**: The `🍽️ Amplifying` chip is relabelled `Under A5` under the `any`-mode Psychube facet in the consolidated requirement.
**Migration**: No-match copy is unchanged; the chip key becomes `psychubeAmp` and the ghost tag reads `no longer matches Psychube · Under A5`. Tests asserting the `🍽️ Amplifying` label or ghost tag use the new text.
