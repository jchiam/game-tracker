## ADDED Requirements

### Requirement: Roster page layout second-view slot is modality-neutral

`RosterPageLayout` SHALL accept its second-view content through a `secondView` prop (paired with the existing `secondViewLabel`), rendered when `view === 'second'`. The slot is modality-neutral: roster-modality pages pass their parties/lineups tab, collection-modality pages pass their completion view. No prop named `partiesTab` SHALL remain on the layout.

#### Scenario: Second view renders the slot content

- **WHEN** the layout is rendered with `view="second"` and a `secondView` node
- **THEN** that node renders in place of the roster grid and the tab button shows `secondViewLabel`

#### Scenario: No parties-specific slot name remains

- **WHEN** the codebase is searched for `partiesTab=` on `RosterPageLayout` usages
- **THEN** no occurrence exists; all six roster-modality pages and the layout stories pass `secondView`
