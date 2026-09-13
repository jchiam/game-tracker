## MODIFIED Requirements

### Requirement: Selection grid renders up to three columns on desktop

The selection page SHALL widen beyond the global 1200px content shell via a
page-scoped modifier class (`selection-content`) capped at 1400px, and every
per-modality selection grid (`.selection-section > .selection-grid`, see
`shared-tracker-modality`) SHALL lay out game cards with
`repeat(auto-fit, minmax(360px, 1fr))` under a 1400px grid max-width, so that desktop
viewports render exactly three columns per section and no viewport ever renders four.
Sections stack vertically with `var(--spacing-2xl)` between them.

#### Scenario: Desktop shows three columns

- **WHEN** a selection section renders at a viewport whose content width is at least three 360px tracks plus gaps (~1176px)
- **THEN** that section's grid renders three columns of game cards

#### Scenario: Four columns never render

- **WHEN** any selection section renders at any viewport width, including ultra-wide monitors
- **THEN** its grid renders at most three columns, because a fourth 360px track cannot fit within the 1400px grid max-width

#### Scenario: Roster pages keep the standard shell

- **WHEN** any roster page renders
- **THEN** its content remains capped at the global 1200px `.main-content` width, unaffected by the selection page modifier

#### Scenario: Single-card section keeps the track width

- **WHEN** a modality section contains one game
- **THEN** its card occupies one grid track at the same width as cards in a three-card section, not the full row

### Requirement: Selection grid degrades gracefully on narrow viewports

Every per-modality selection grid SHALL reduce its column count automatically as the
viewport narrows — three to two to one — using CSS grid `auto-fit` behaviour alone,
with no viewport media queries governing column count.

#### Scenario: Medium viewport shows two columns

- **WHEN** a selection section renders at a content width that fits two 360px tracks plus gap but not three
- **THEN** its grid renders two columns

#### Scenario: Narrow viewport shows one column

- **WHEN** a selection section renders at a content width below two 360px tracks plus gap
- **THEN** its grid renders a single column
