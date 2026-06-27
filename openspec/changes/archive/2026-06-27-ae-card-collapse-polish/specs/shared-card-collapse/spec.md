## MODIFIED Requirements

### Requirement: Per-game height budgets via CSS custom properties

The collapsed-summary and expanded-edit-body maximum heights SHALL be controlled by the CSS custom properties `--game-card-summary-max-height` and `--game-card-edit-max-height`. `card.css` SHALL provide default values. Each game SHALL set its budgets as **inline custom properties on the card root element** (`style={{ '--game-card-summary-max-height': …, '--game-card-edit-max-height': … }}`), NOT via a shared `.game-card { … }` rule in route-split CSS. Inline custom properties are element-scoped, so per-game budgets cannot leak across games regardless of which route stylesheets are loaded; a `.game-card { … }` rule in one game's route-split CSS persists after navigation and would otherwise apply to every card on the page. Each game SHALL size its budgets to its own card's content; a game whose content fits the shared defaults MAY omit the override, but a game whose content is materially shorter than the defaults (e.g. AE, whose edit body is only a level slider and a potential row) SHALL set explicit budgets so the expand transition does not animate far past the real content height.

#### Scenario: A game sets its budgets inline on the card root

- **WHEN** a game's card needs a taller or shorter budget than the default
- **THEN** it sets `--game-card-summary-max-height` and/or `--game-card-edit-max-height` inline on the card's root element, and the canonical rules in `card.css` consume those values via the cascade into the card's descendants

#### Scenario: Per-game budgets do not leak across games after navigation

- **WHEN** a user navigates from one game's roster to another within the SPA (so both games' route stylesheets are loaded)
- **THEN** each game's cards retain their own collapsed-summary and edit-body heights, because the budgets are element-scoped inline properties rather than a shared `.game-card` rule

#### Scenario: Each game renders at its tuned heights

- **WHEN** an r1999 arcanist card, an N2E character card, or an AE operator card is rendered
- **THEN** the collapsed summary and expanded edit body occupy their intended heights (r1999 80px/700px, N2E 100px/1200px, AE ~80px summary with an edit budget sized to its level-slider-plus-potential-row content) regardless of prior navigation
