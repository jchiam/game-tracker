## ADDED Requirements

### Requirement: Operator card collapsed-summary composition

The collapsed (read-only) state of the operator card SHALL present investment as gradient-colored stat chips, and the expanded (edit) state SHALL drive its level slider with the same shared investment gradient. The card SHALL use the shared `getProgressStyle(value, min, max)` color language (rust → teal) so AE matches HSR, R1999, and N2E. Because AE operators have no equippable gear, the operator card SHALL NOT render a `.game-card-static-line` gear one-liner.

#### Scenario: Level chip colored by investment

- **WHEN** an operator card renders its collapsed summary
- **THEN** the `Lv {level}` `StatChip` text and border color are computed via `getProgressStyle(level, 1, 90)`, so a low-level operator reads rust and a level-90 operator reads teal

#### Scenario: Potential chip colored by investment

- **WHEN** an operator card renders its collapsed summary
- **THEN** the `P{potential}` `StatChip` text and border color are computed via `getProgressStyle(potential, 0, 5)`

#### Scenario: Level slider uses the canonical class and shared gradient

- **WHEN** an operator card's edit body renders the level slider
- **THEN** the input uses the canonical `.level-slider` class (not `.character-slider`) and sets `--slider-fill-color` and `--slider-fill-glow` from `getProgressStyle(level, 1, 90)`, with the track fill percentage computed as `(level − 1) / 89`

#### Scenario: No gear one-liner in the summary

- **WHEN** an operator card renders its collapsed summary
- **THEN** no `.game-card-static-line` equip digest is present, because AE operators track only level and potential and have no equippable gear

#### Scenario: Rarity stars are not gradient-colored

- **WHEN** an operator card renders the rarity indicator
- **THEN** the rarity stars retain their intrinsic per-rarity color and are NOT passed through `getProgressStyle`, because rarity is an intrinsic property rather than an investment level
