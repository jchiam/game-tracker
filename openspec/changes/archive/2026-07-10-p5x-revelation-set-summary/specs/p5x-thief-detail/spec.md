## MODIFIED Requirements

### Requirement: Thief card collapsed-summary composition

The collapsed (read-only) state of the Thief card SHALL present investment as
gradient-colored stat chips using the shared `getProgressStyle(value, min, max)`
color language (rust → teal), matching the other four games. The card SHALL render
the Thief's role and element as `GameBadge`s and the bound Persona's name as a
static line. The card SHALL NOT render a rarity-star indicator (rarity remains a
catalog field, matching AE).

When revelations are equipped, the summary SHALL show a single revelation `StatChip`
built from `getRevelationSummary` (see "Consolidated revelation set summary"): a
**Space-first, lossless** consolidation of every active set bonus — the Space set (bare
name) followed by each active Heavens bonus as `{name} {pieces}pc` — joined by `·`
(e.g. `Meditation · Power 2pc · Peace 2pc`), colored via investment gradient. The chip is
NOT limited to the single dominant Heavens set. Dimension ordering for chips:
Level → Weapon → Revelations → Mindscape → Skills.

#### Scenario: Level chip colored by investment

- **WHEN** a Thief card renders its collapsed summary
- **THEN** the `Lv {level}` `StatChip` text and border color are computed via `getProgressStyle(level, 1, 80)`

#### Scenario: Awareness chip colored by investment

- **WHEN** a Thief card renders its collapsed summary
- **THEN** an `A{awareness}` `StatChip` is shown, colored via `getProgressStyle(awareness, 0, 6)`

#### Scenario: Persona name line present

- **WHEN** a Thief card renders
- **THEN** the bound Persona's name is shown as a static line in the card body

#### Scenario: Level slider uses the canonical class and shared gradient

- **WHEN** a Thief card's edit body renders the level slider
- **THEN** the input uses the canonical `.level-slider` class and sets `--slider-fill-color` and `--slider-fill-glow` from `getProgressStyle(level, 1, 80)`, with the track fill percentage computed as `(level − 1) / 79`

#### Scenario: No rarity-star indicator

- **WHEN** a Thief card renders
- **THEN** no `.rarity-indicator` element is present

#### Scenario: Consolidated revelation chip is space-first and lossless

- **WHEN** a Thief has a Space set plus two Heavens sets at 2pc each (e.g. Meditation space, Peace×2, Power×2)
- **THEN** the revelation `StatChip` reads `Meditation · Peace 2pc · Power 2pc` — the Space set first, then both Heavens bonuses in `4pc → 2pc → name` order (neither dropped)

#### Scenario: Heavens 4pc shown at 4pc

- **WHEN** a Thief has four cards of one Heavens set and no Space set
- **THEN** the revelation chip shows `{Heavens} 4pc`

#### Scenario: No revelation chip when no active bonus

- **WHEN** a Thief has no revelation cards equipped, or only single-card Heavens sets with no Space set
- **THEN** no revelation chip is shown in the summary

#### Scenario: Dimension ordering includes revelations

- **WHEN** the summary stat chips render
- **THEN** order is: Level → Awareness → Weapon → Revelations → Mindscape → Skills

## ADDED Requirements

### Requirement: Consolidated revelation set summary

The system SHALL export a pure helper `getRevelationSummary(revelations)` returning
`{ spaceSet: { id, name } | null, heavensBonuses: { id, name, pieces }[] }`, the single source for
every revelation set display (summary chip and edit readout).

- **heavensBonuses**: group the four Heavens slot cards (`sun`, `moon`, `star`, `sky`) by `setId`;
  for each set with **≥2** matching cards emit a bonus with `pieces = 4` when exactly four cards
  match, otherwise `pieces = 2` (two or three cards → 2pc). Sets with a single card are omitted.
  Ordered `4pc` before `2pc`, then by set name.
- **spaceSet**: the Space slot card's set resolved to `{ id, name }`, or `null` when no Space card
  with a set is equipped.

Every surface that displays revelation sets SHALL render **Space first, then Heavens bonuses**, and
SHALL show **names and piece counts only** (no set-effect descriptions).

The edit-mode "Revelations" `ProgressSection` SHALL render a consolidated **readout** in its body:
the Space set on its own line tagged `(Space)` (when present), followed by one line per active
Heavens bonus as `{name} {pieces}pc`, above the "Edit Revelations" button. The section header
`value` SHALL show `—` when no set is active; when sets are active it SHALL be omitted (the
vertical body readout is the display), so a long one-line consolidation is never crammed into the
space-between header.

#### Scenario: Helper omits single-card sets and honors the 2/3-card breakpoint

- **WHEN** `getRevelationSummary` runs on Heavens cards of {Power, Power, Power, Peace}
- **THEN** `heavensBonuses` is `[{ Power, pieces: 2 }]` — Power at 2pc (three cards, not enough for 4pc), and the single Peace card omitted

#### Scenario: Helper resolves the space set independently

- **WHEN** a Space card with a set is equipped
- **THEN** `spaceSet` is its `{ id, name }` regardless of the Heavens bonuses

#### Scenario: Edit readout lists every active set, space-first

- **WHEN** the edit Revelations section renders with Meditation (space) + Peace 2pc + Power 2pc
- **THEN** the body readout lists `Meditation (Space)`, then `Peace 2pc`, then `Power 2pc` (Heavens in `4pc → 2pc → name` order), above the Edit button

#### Scenario: Edit readout empty state

- **WHEN** the edit Revelations section renders with no active set bonus
- **THEN** the section `value` shows `—` and no readout lines are rendered
