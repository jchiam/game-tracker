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
NOT limited to the single dominant Heavens set.

Summary chip ordering SHALL be: Level → Awareness → Weapon → **Mindscape →
Revelations** → Skills. The Mindscape chip precedes the Revelations chip so the
short fixed-width chips pack the first row and the single variable-width
Revelations chip starts the second row. This deviates deliberately from the
edit-body section ordering (Level → Weapon → Revelations → Mindscape → Skills),
which is unchanged.

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

#### Scenario: Summary chip ordering places Mindscape before Revelations

- **WHEN** the summary stat chips render with every chip present
- **THEN** order is: Level → Awareness → Weapon → Mindscape → Revelations → Skills

## ADDED Requirements

### Requirement: Revelation summary chip width cap

The Revelations summary chip SHALL have a bounded maximum width and SHALL truncate
overflowing label text with an ellipsis (single line), so that even the widest
label (a Space set consolidated with multiple active Heavens bonuses, e.g.
`Meditation · Power 2pc · Peace 2pc`) occupies at most one chip slot and cannot
push the summary chip row onto a third line. The full, untruncated set name(s)
SHALL remain visible in the Revelation editor modal, so no information is lost.

#### Scenario: Long revelation label truncates in the summary

- **WHEN** a Thief's revelation chip label exceeds the chip's maximum width (e.g. a Space set consolidated with multiple Heavens bonuses)
- **THEN** the chip clips the label to a single line with an ellipsis and does not grow wider than its cap

#### Scenario: Full set name available in the editor

- **WHEN** the user opens the Revelation editor modal for a Thief whose summary chip is truncated
- **THEN** the full Heavens and Space set names are shown untruncated

### Requirement: P5X card fixed-height collapsed summary

The P5X Thief card SHALL reserve a fixed two-line height for its collapsed summary
chip row via the shared `GameCardShell` opt-in reserve (see `shared-card-collapse`),
so that cards whose chips occupy only one line report the same measured summary
height as cards whose chips occupy two lines. Combined with the Revelations chip
width cap (which bounds the worst case to two lines), this yields a uniform
collapsed body height across the P5X roster grid.

#### Scenario: One-line card reserves two chip lines

- **WHEN** a Thief card's summary chips fit on a single line
- **THEN** the chip row still reserves the height of two chip lines, matching a two-line card's summary height

#### Scenario: Uniform collapsed height across the grid

- **WHEN** the P5X roster renders a mix of Thieves with one-line and two-line chip rows
- **THEN** every collapsed card body has the same height
