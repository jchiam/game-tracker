## ADDED Requirements

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

The collapsed-summary and expanded-edit-body maximum heights SHALL be controlled by the CSS custom properties `--game-card-summary-max-height` and `--game-card-edit-max-height`. `card.css` SHALL provide default values; each game SHALL override them on `.game-card` only where its content requires a different budget. r1999 SHALL preserve its 80px / 700px budgets and N2E its 400px / 1200px budgets.

#### Scenario: A game overrides only the two height variables

- **WHEN** a game's card needs a taller or shorter budget than the default
- **THEN** it sets `--game-card-summary-max-height` and/or `--game-card-edit-max-height` on `.game-card` in its route-scoped stylesheet, and the canonical rules in `card.css` consume those values

#### Scenario: r1999 and N2E render at their existing heights

- **WHEN** an r1999 arcanist card or an N2E character card is rendered after migration
- **THEN** the collapsed summary and expanded edit body occupy the same heights as before the change (r1999 80px/700px, N2E 400px/1200px)
