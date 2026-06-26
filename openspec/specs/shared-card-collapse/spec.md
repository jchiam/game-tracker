## Purpose

A single canonical card collapse/expand mechanism, defined once in `src/styles/card.css`, that all game cards share. A read-only static summary and an editing body swap visibility based on the `.is-editing` class on `.game-card-body`, with each game tuning only its two height budgets via CSS custom properties.

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

### Requirement: Per-game height budgets via CSS custom properties

The collapsed-summary and expanded-edit-body maximum heights SHALL be controlled by the CSS custom properties `--game-card-summary-max-height` and `--game-card-edit-max-height`. `card.css` SHALL provide default values. Each game SHALL set its budgets as **inline custom properties on the card root element** (`style={{ '--game-card-summary-max-height': …, '--game-card-edit-max-height': … }}`), NOT via a shared `.game-card { … }` rule in route-split CSS. Inline custom properties are element-scoped, so per-game budgets cannot leak across games regardless of which route stylesheets are loaded; a `.game-card { … }` rule in one game's route-split CSS persists after navigation and would otherwise apply to every card on the page. A game that needs only the defaults (e.g. AE) SHALL set no override.

#### Scenario: A game sets its budgets inline on the card root

- **WHEN** a game's card needs a taller or shorter budget than the default
- **THEN** it sets `--game-card-summary-max-height` and/or `--game-card-edit-max-height` inline on the card's root element, and the canonical rules in `card.css` consume those values via the cascade into the card's descendants

#### Scenario: Per-game budgets do not leak across games after navigation

- **WHEN** a user navigates from one game's roster to another within the SPA (so both games' route stylesheets are loaded)
- **THEN** each game's cards retain their own collapsed-summary and edit-body heights, because the budgets are element-scoped inline properties rather than a shared `.game-card` rule

#### Scenario: r1999 and N2E render at their existing heights

- **WHEN** an r1999 arcanist card or an N2E character card is rendered
- **THEN** the collapsed summary and expanded edit body occupy their intended heights (r1999 80px/700px, N2E 400px/1200px) regardless of prior navigation
