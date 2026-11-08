## MODIFIED Requirements

### Requirement: Chip facets

A game MAY nest chips under a facet — a declared dimension with a stable key, a
label, a mode, and an ordered chip list. Mode `any` chips SHALL toggle
independently, except that a chip MAY be declared `exclusive`: activating an
exclusive chip SHALL deactivate every other active member of its facet, and
activating any member SHALL deactivate every active exclusive member, while
the non-exclusive members continue to intersect. The `exclusive` flag SHALL
have no effect on a bare chip or inside a `one` facet. Mode `one` chips SHALL
be radio-exclusive: activating one member SHALL deactivate every other active
member of that facet in the same toggle, and activating the already-active
member SHALL deactivate it, leaving the facet with no active member. A chip
toggle that changes facet membership SHALL still be a single projection change
(one fresh active-key set). Chips in different facets, non-exclusive chips in
an `any` facet, and bare chips SHALL continue to compose as a logical AND.

The layout SHALL render the filter row as a matrix of rows with an aligned
label column: one row per facet, and one unlabelled row per run of
consecutive bare chips. A facet row SHALL carry `role="group"` with an
accessible name equal to the facet label. The facet label SHALL be rendered
only when the facet holds two or more chips; a facet with one chip renders as
an unlabelled row. A `one` facet's chips SHALL render as a joined segmented
pill — members touch, share one border between them, and only the outer ends
carry the pill radius. An `any` facet's chips and bare chips SHALL render as
spaced pills that wrap within the row's chips cell; in an `any` facet a
vertical divider SHALL stand between the exclusive chips and the non-exclusive
chips. Every filter chip SHALL
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

#### Scenario: Exclusive chip clears its any-facet siblings

- **WHEN** chips N (exclusive), C, and D share an `any` facet, C and D are active, and the user clicks N
- **THEN** N is active, C and D are inactive, and the composed predicate contains N alone, in one projection change

#### Scenario: Any sibling clears the exclusive chip

- **WHEN** chips N (exclusive), C, and D share an `any` facet, N is active, and the user clicks C
- **THEN** C is active and N is inactive; clicking D then leaves C and D both active and ANDed

#### Scenario: Exclusive flag is inert outside any facets

- **WHEN** a bare chip or a `one`-facet member is declared `exclusive`
- **THEN** its toggle behaviour and rendering are those of an ordinary bare chip or `one` member

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

#### Scenario: Exclusive chip is divided from its siblings

- **WHEN** an `any` facet holds exclusive chip N followed by chips C and D
- **THEN** the row renders N, a vertical divider, then C and D as spaced pills; the divider is not a button

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

- **WHEN** bare chip "🐹 Gated" is active and a rendered entity's live data stops matching it
- **THEN** the held card's ghost tag reads `no longer matches 🐹 Gated`

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

- **WHEN** the block is collapsed and "No Outer" (facet "Mindscape") and bare chip "🐹 Gated" are active
- **THEN** the header row shows removable pills `Mindscape · No Outer` and `🐹 Gated`, in declaration order

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
