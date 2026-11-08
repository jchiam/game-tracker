## ADDED Requirements

### Requirement: Chip facets

A game MAY nest chips under a facet — a declared dimension with a stable key, a
label, a mode, and an ordered chip list. Mode `any` chips SHALL toggle
independently. Mode `one` chips SHALL be radio-exclusive: activating one
member SHALL deactivate every other active member of that facet in the same
toggle, and activating the already-active member SHALL deactivate it, leaving
the facet with no active member. A chip toggle that changes facet membership
SHALL still be a single projection change (one fresh active-key set). Chips in
different facets, chips in an `any` facet, and bare chips SHALL continue to
compose as a logical AND.

The layout SHALL render the filter row as a matrix of rows with an aligned
label column: one row per facet, and one unlabelled row per run of
consecutive bare chips. A facet row SHALL carry `role="group"` with an
accessible name equal to the facet label. The facet label SHALL be rendered
only when the facet holds two or more chips; a facet with one chip renders as
an unlabelled row. A `one` facet's chips SHALL render as a joined segmented
pill — members touch, share one border between them, and only the outer ends
carry the pill radius. An `any` facet's chips and bare chips SHALL render as
spaced pills that wrap within the row's chips cell. Every filter chip SHALL
expose `aria-pressed` reflecting its active state. The held-card ghost tag for
a chip in a labelled facet SHALL read `no longer matches {facet label} · {chip
label}`.

#### Scenario: Activating a sibling in a one facet swaps the active member

- **WHEN** chips A and B share a `one` facet, A is active, and the user clicks B
- **THEN** B becomes active, A becomes inactive, and the roster narrows to B's predicate in one projection change

#### Scenario: Clicking the active member of a one facet clears it

- **WHEN** chips A and B share a `one` facet, A is active, and the user clicks A
- **THEN** neither A nor B is active and the facet contributes no predicate

#### Scenario: Chips in an any facet toggle independently

- **WHEN** chips C and D share an `any` facet and the user clicks C then D
- **THEN** both are active and the composed predicate ANDs C and D

#### Scenario: Facets compose as AND with other chips

- **WHEN** `one`-facet member A is active and bare chip E is active
- **THEN** an entity appears only if it satisfies both A and E

#### Scenario: A one facet is at most one predicate

- **WHEN** chips A and B share a `one` facet and the user clicks A then B
- **THEN** the composed predicate contains B alone; A's predicate is never ANDed with B's

#### Scenario: Facet renders as a labelled group row

- **WHEN** a facet labelled "Mindscape" holds chips A and B
- **THEN** the filter row contains one `role="group"` element named "Mindscape" holding a visible "Mindscape" label and exactly the A and B buttons

#### Scenario: One facet renders as a joined segment

- **WHEN** a `one` facet holds chips A and B
- **THEN** A's leading edge and B's trailing edge are rounded, the shared edge is square, and the two buttons touch

#### Scenario: Single-chip facet renders without a label

- **WHEN** a facet declares exactly one chip
- **THEN** its row shows the chip with no label text and no group role

#### Scenario: Consecutive bare chips share one unlabelled row

- **WHEN** a game declares bare chips X and Y with no facet
- **THEN** the filter row contains one unlabelled row holding X and Y, matching the pre-facet rendering

#### Scenario: Label column aligns across rows

- **WHEN** two labelled facets render
- **THEN** both labels occupy the same column and both chip cells start at the same horizontal offset

#### Scenario: Chips expose pressed state

- **WHEN** a chip is active
- **THEN** its button has `aria-pressed="true"`; an inactive chip has `aria-pressed="false"`

#### Scenario: Ghost tag composes the facet label

- **WHEN** chip "No Inner" in the labelled facet "Mindscape" is active and a rendered entity's live data stops matching it
- **THEN** the held card's ghost tag reads `no longer matches Mindscape · No Inner`

#### Scenario: Ghost tag for a bare chip is unchanged

- **WHEN** bare chip "💠 Resonating" is active and a rendered entity's live data stops matching it
- **THEN** the held card's ghost tag reads `no longer matches 💠 Resonating`

### Requirement: Collapsible filter block

When the filter block has two or more matrix rows, the layout SHALL render a
disclosure header before the rows — a button labelled `Filters` carrying
`aria-expanded`, `aria-controls` naming the matrix container, and the count
of active chips when that count is non-zero — and SHALL render the matrix only
while the block is open. While the block is collapsed, the header row SHALL
also show one removable summary pill per active chip, in declaration order,
labelled with the chip's facet-composed label (`{facet label} · {chip label}`
for a chip in a labelled facet, otherwise the chip label) and an accessible
name of `Remove filter {that label}`; activating a summary pill SHALL
deactivate that chip. Summary pills SHALL NOT render while the block is open.
The block SHALL be open by default when the viewport is at least 600px wide
and closed by default below that; the open state is page-local, is not
persisted, and is not a projection change. A block with a single row SHALL
render no disclosure header and SHALL always show its row.

#### Scenario: Multi-row block renders a disclosure header

- **WHEN** a game's filter declaration yields two or more rows
- **THEN** a `Filters` button with `aria-expanded` precedes the matrix

#### Scenario: Single-row block has no disclosure

- **WHEN** a game's filter declaration yields one row
- **THEN** no `Filters` button renders and the row is always visible

#### Scenario: Collapsed block hides the matrix

- **WHEN** the block is collapsed
- **THEN** no facet row is rendered and the header's `aria-expanded` is `false`

#### Scenario: Header shows the active count

- **WHEN** two chips are active
- **THEN** the `Filters` button shows `2`; with no active chip it shows no count

#### Scenario: Collapsed block summarises active chips

- **WHEN** the block is collapsed and "No Outer" (facet "Mindscape") and bare chip "💠 Resonating" are active
- **THEN** the header row shows removable pills `Mindscape · No Outer` and `💠 Resonating`, in declaration order

#### Scenario: Removing a summary pill clears that chip

- **WHEN** the user activates the summary pill `Mindscape · No Outer`
- **THEN** the "No Outer" chip becomes inactive, the pill disappears, and the roster re-projects

#### Scenario: Open block shows no summary pills

- **WHEN** the block is open and chips are active
- **THEN** no summary pills render; the active chips are visible in the matrix

#### Scenario: Default open state follows the viewport

- **WHEN** the page mounts in a viewport 600px or wider
- **THEN** the block is open; mounted narrower than 600px it is collapsed

#### Scenario: Toggling the disclosure is not a projection change

- **WHEN** an entity is held and the user toggles the disclosure
- **THEN** the held state and every basis are unchanged

## MODIFIED Requirements

### Requirement: Filter chips are declared as data

A game that offers predicate filters SHALL declare each filter chip as a data
descriptor — a stable key, the chip's visible label, the boolean predicate over
the tracked entity, the tooltip shown while the chip is inactive, and
optionally a chip-specific no-match message — and pass the list to the shared
roster view. A list entry MAY instead be a facet (see "Chip facets") — a stable
key, a label, a mode of `any` or `one`, and its own ordered chip list — so that
chips belonging to one dimension are declared together. Chip keys SHALL be
unique across the whole list. The tooltip shown while the chip is active SHALL
default to `Show all {nounPlural}`. Game pages SHALL NOT hand-write chip on/off
state, predicate composition, facet exclusivity, held-card copy, no-match
message selection, or chip markup; all of these derive from the declared list.

#### Scenario: Chips render in declaration order

- **WHEN** a game declares chips A, B, C in that order
- **THEN** the filter row shows A, B, C left to right with their declared labels

#### Scenario: Active tooltip defaults from the plural noun

- **WHEN** a chip declares no active-state tooltip and the game's plural noun is "thieves"
- **THEN** the active chip's tooltip reads `Show all thieves`

#### Scenario: Facet membership is declared by nesting

- **WHEN** a game declares a facet entry holding chips B and C
- **THEN** the shared view treats B and C as members of that facet with no further page code

#### Scenario: Pages contain no hand-written chip code

- **WHEN** the game pages are searched for chip `useState` pairs, AND-composed predicate ladders, facet-exclusivity handlers, `describeHeld` ladders, or `.filter-chip` markup
- **THEN** none exists; every page passes a chip list and the shared view derives the rest

### Requirement: Active chips compose as a logical AND

When two or more declared chips are active, the composed predicate SHALL be the
logical AND of their predicates: an entity appears only if it satisfies every
active chip. Because a `one` facet has at most one active member, this
composition spans bare chips, `any`-facet chips, and at most one chip per `one`
facet. When no chip is active, no predicate SHALL be applied (the no-predicate
path is preserved).

#### Scenario: Two active chips intersect

- **WHEN** chips A and B are both active and an entity satisfies A but not B
- **THEN** that entity is excluded from the roster

#### Scenario: One-facet member and bare chip intersect

- **WHEN** `one`-facet member A and bare chip C are active and an entity satisfies C but not A
- **THEN** that entity is excluded from the roster

#### Scenario: No active chip applies no predicate

- **WHEN** every chip is inactive
- **THEN** the roster shows all entities matching the search term and sort, and no predicate is evaluated

### Requirement: Filter row within toolbar container

When a game declares predicate filter chips, the roster page layout SHALL render
a filter row (`.filter-row`) as a sibling of the roster controls
(`.roster-controls`) inside a shared parent container (`.roster-toolbar`) from
the row descriptors it is given — games SHALL NOT render the row themselves.
The parent is a flex column that vertically stacks the controls row and filter
row with consistent internal spacing. The filter row is a matrix (see "Chip
facets"): a label column and a chips column, one matrix row per facet or run
of bare chips. Chips are pill-shaped toggles — visually distinct from the
square action buttons but spatially grouped as part of the same control
cluster — and a row's spaced chips SHALL wrap within that row's chips cell
when they exceed the available width; a joined `one` facet never wraps
internally. The filter row SHALL only render when tracked entities exist and
at least one chip is declared. The chip accent colour is set per game on the
row and applies to every chip.

#### Scenario: Filter row renders within toolbar container

- **WHEN** the roster view has tracked entities and the game declares filter chips
- **THEN** a filter row appears directly below the roster controls within the same parent container

#### Scenario: Chip toggles filter on

- **WHEN** user clicks an inactive filter chip in the filter row
- **THEN** the chip's predicate joins the composed predicate passed to `getFilteredRoster` and the roster narrows

#### Scenario: Chip toggles filter off

- **WHEN** user clicks an active filter chip
- **THEN** the chip's predicate leaves the composed predicate and the roster (matching search, sort, and any other active chip) is shown

#### Scenario: Filter composes with search

- **WHEN** a filter chip is active and the user types a search term
- **THEN** results are the intersection — entities matching BOTH the predicate AND the search

#### Scenario: Filter row hidden when no tracked entities

- **WHEN** the roster has no tracked entities
- **THEN** the filter row is not rendered

#### Scenario: Filter row absent when no chips are declared

- **WHEN** a game declares no filter chips
- **THEN** no filter row is rendered

#### Scenario: Filter row wraps on narrow viewports

- **WHEN** an `any` facet's chips exceed the width of the chips cell
- **THEN** they wrap onto a further line inside that cell; the label column and the other rows are unaffected

#### Scenario: Facet chips take the row accent

- **WHEN** a chip in any row is hovered or active
- **THEN** it uses the same `--filter-chip-accent` colour treatment as every other chip

### Requirement: Held-card copy names the first failing active chip

The ghost-tag copy of a held card (see `roster-projection-stability`) SHALL
name the first active chip, in declaration order, whose predicate the entity's
live data fails: `no longer matches {label}` for a bare chip or a chip in an
unlabelled facet, and `no longer matches {facet label} · {label}` for a chip in
a labelled facet. Held detection SHALL run only while at least one chip is
active.

#### Scenario: First failing chip in declaration order

- **WHEN** chips A and B are active and a held entity fails both
- **THEN** its ghost tag names A

#### Scenario: Labelled facet chip composes the facet label

- **WHEN** the failing chip "No Outer" belongs to the labelled facet "Mindscape"
- **THEN** the ghost tag reads `no longer matches Mindscape · No Outer`

#### Scenario: No held detection without active chips

- **WHEN** every chip is inactive and an entity is edited
- **THEN** no entity is reported as held
