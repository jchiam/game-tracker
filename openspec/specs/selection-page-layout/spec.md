# selection-page-layout

## Purpose

Responsive column behaviour of the game selection grid: desktop column cap, card
minimum width, and graceful degradation on narrow viewports.

## Requirements

### Requirement: Selection grid renders up to three columns on desktop

The selection page SHALL widen beyond the global 1200px content shell via a
page-scoped modifier class (`selection-content`) capped at 1400px, and the
selection grid SHALL lay out game cards with `repeat(auto-fit, minmax(360px, 1fr))`
under a 1400px grid max-width, so that desktop viewports render exactly three
columns and no viewport ever renders four.

#### Scenario: Desktop shows three columns

- **WHEN** the selection page renders at a viewport whose content width is at least three 360px tracks plus gaps (~1176px)
- **THEN** the grid renders three columns of game cards

#### Scenario: Four columns never render

- **WHEN** the selection page renders at any viewport width, including ultra-wide monitors
- **THEN** the grid renders at most three columns, because a fourth 360px track cannot fit within the 1400px grid max-width

#### Scenario: Roster pages keep the standard shell

- **WHEN** any roster page renders
- **THEN** its content remains capped at the global 1200px `.main-content` width, unaffected by the selection page modifier

### Requirement: Selection grid degrades gracefully on narrow viewports

The selection grid SHALL reduce its column count automatically as the viewport
narrows — three to two to one — using CSS grid `auto-fit` behaviour alone, with
no viewport media queries governing column count.

#### Scenario: Medium viewport shows two columns

- **WHEN** the selection page renders at a content width that fits two 360px tracks plus gap but not three
- **THEN** the grid renders two columns

#### Scenario: Narrow viewport shows one column

- **WHEN** the selection page renders at a content width below two 360px tracks plus gap
- **THEN** the grid renders a single column
