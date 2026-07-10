## ADDED Requirements

### Requirement: Opt-in fixed-height reserve for the summary chip row

The shared `GameCardShell` SHALL accept an optional opt-in that reserves a fixed
number of chip rows for a card's collapsed summary chip row
(`.game-card-static-stats`). When opted in, the reserve is applied by the shell
adding a modifier class to the card, and the corresponding `min-height` rule
SHALL live once in `src/styles/card.css` (keyed off that modifier class) — never
hardcoded per game and never re-declared in route-split CSS. When not opted in,
the summary chip row keeps its intrinsic content height, so existing games are
unaffected.

Because the reserve raises the measured content height of the never-clipped
`.game-card-static-summary-inner` wrapper, it composes with the existing
content-measured budget mechanism: the shell's layout effect measures the
reserved height and writes it to `--game-card-summary-max-height` exactly as it
does for intrinsic content, with no separate budget path.

#### Scenario: Reserve applied only when opted in

- **WHEN** a card composes `GameCardShell` without the fixed-height reserve opt-in
- **THEN** its summary chip row has no reserved `min-height` and sizes to its intrinsic content, unchanged from prior behavior

#### Scenario: Reserve reflected in the measured summary budget

- **WHEN** a card opts into the fixed-height reserve and its chips occupy fewer lines than the reserve
- **THEN** the shell measures the reserved height from `.game-card-static-summary-inner` and writes it to `--game-card-summary-max-height`, so the collapsed summary renders at the reserved height

#### Scenario: Reserve rule lives once in the shared stylesheet

- **WHEN** the codebase is searched for the reserve `min-height` rule
- **THEN** it is defined once in `card.css` keyed off the shell's modifier class, with no per-game duplication in route-split CSS
