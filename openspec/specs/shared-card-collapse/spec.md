## Purpose

A single canonical card collapse/expand mechanism, defined once in `src/styles/card.css`, that all game cards share. A read-only static summary and an editing body swap visibility based on the `.is-editing` class on `.game-card-body`, with the two height budgets measured from real card content by the shared `GameCardShell` and set as element-scoped custom properties on the card root.

## Requirements

### Requirement: Canonical collapse mechanism in shared card styles

The card collapse/expand mechanism SHALL be defined exactly once, in `src/styles/card.css`, using canonical `.game-card-*` class names: `.game-card-static-summary`, `.game-card-static-stats`, `.game-card-static-line`, `.game-card-edit-body`, and `.game-card-edit-body-inner`. Game-specific card stylesheets SHALL NOT re-declare the structural rules of this mechanism (layout, overflow, transition, or the `.is-editing` selectors); they MAY only set the per-game height budgets and game-unique content styles.

#### Scenario: Mechanism lives in the global stylesheet

- **WHEN** any game's card is rendered on a cold load of its route
- **THEN** the collapse classes resolve from `card.css` (which is globally imported via `src/index.css`), so collapse/expand works without depending on another game's route-split CSS

#### Scenario: No bespoke per-game structural duplication remains

- **WHEN** the codebase is searched for the bespoke names `arcanist-static-summary`, `character-static-summary`, `operator-static-summary`, `*-edit-body`, `*-edit-body-inner`, `*-static-stats`
- **THEN** no such class definitions or usages remain; all cards reference the canonical `.game-card-*` names

### Requirement: Edit toggle drives collapse via `.is-editing`

When a card body carries the `.is-editing` class, the static summary SHALL collapse to zero height and the editing body SHALL expand; without `.is-editing`, the static summary SHALL be visible and the editing body collapsed. The transition SHALL animate via `max-height` so the change is smooth.

#### Scenario: Default (collapsed) state shows the summary

- **WHEN** `.game-card-body` does not have `.is-editing`
- **THEN** `.game-card-static-summary` is visible and `.game-card-edit-body` has `max-height: 0` (hidden)

#### Scenario: Editing state shows the edit body

- **WHEN** `.game-card-body` has `.is-editing`
- **THEN** `.game-card-static-summary` collapses to `max-height: 0` with `opacity: 0` and `pointer-events: none`, and `.game-card-edit-body` expands to its game height budget

### Requirement: Height budgets measured from content by the card shell

The collapsed-summary and expanded-edit-body maximum heights SHALL be controlled by the CSS custom properties `--game-card-summary-max-height` and `--game-card-edit-max-height`. `card.css` SHALL provide default values. The shared `GameCardShell` (`shared-ui-components`) SHALL measure both budgets from the card's rendered content (`scrollHeight` of the static summary and of the edit-body inner wrapper) in a layout effect after every render, and SHALL set them as **inline custom properties on the card root element** — NOT via a shared `.game-card { … }` rule in route-split CSS. Inline custom properties are element-scoped, so budgets cannot leak across games regardless of which route stylesheets are loaded; a `.game-card { … }` rule in one game's route-split CSS persists after navigation and would otherwise apply to every card on the page. Because budgets are measured, no game SHALL hardcode per-game budget constants; conditional slot content (target-build displays, preference rows) can never clip the bottom, and the expand transition never animates far past the real content height. The summary budget SHALL be measured only while the card is not editing: the collapsed summary loses its padding, so a mid-collapse measurement would shrink the reopen budget.

#### Scenario: Budgets track measured content

- **WHEN** any game's card renders, including conditional edit sections of varying height
- **THEN** the shell writes `--game-card-summary-max-height` and `--game-card-edit-max-height` inline on the card root from the measured content, and the canonical rules in `card.css` consume those values via the cascade into the card's descendants — the expanded edit body neither clips its content nor animates far past it

#### Scenario: Budgets do not leak across games after navigation

- **WHEN** a user navigates from one game's roster to another within the SPA (so both games' route stylesheets are loaded)
- **THEN** each card retains its own measured collapsed-summary and edit-body heights, because the budgets are element-scoped inline properties rather than a shared `.game-card` rule

#### Scenario: No hardcoded per-game budgets remain

- **WHEN** the game card components are searched for inline `--game-card-summary-max-height` / `--game-card-edit-max-height` values or per-game measurement code
- **THEN** none exists outside `GameCardShell`; every game's budgets come from the shell's measurement

#### Scenario: Summary budget survives the collapse

- **WHEN** a card enters edit mode and its collapsed summary shrinks to zero height
- **THEN** the shell does not re-measure the summary while editing, so the previously measured (expanded) budget is retained and the summary reopens to its full height
