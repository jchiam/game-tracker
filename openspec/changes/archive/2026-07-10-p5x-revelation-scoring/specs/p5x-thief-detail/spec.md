## ADDED Requirements

### Requirement: Revelation score header badge

The Thief card SHALL render a revelation-score badge in `GameCardShell`'s `headerExtra` slot
when `calculateRevelationScore(thief)` returns a non-negative score, matching the HSR relic /
N2E cartridge header-badge convention. The badge SHALL display the score as a whole-number
percentage and carry a grade class derived from the score. When the score is `-1`
(insufficient data), no badge is rendered.

Grade thresholds SHALL match N2E's `getScoreGrade` scale (S ≥ 90, A ≥ 70, B ≥ 50, C ≥ 30, else
D). The `score-badge` and grade classes are defined in `ThiefCard.css` (per-game, mirroring the
duplicated HSR/N2E convention).

#### Scenario: Badge shown when a score is computed

- **WHEN** a Thief has revelation preferences and at least one equipped card, yielding a score ≥ 0
- **THEN** a score badge is rendered in the card header showing the score as a whole-number percentage with its grade class

#### Scenario: Grade class reflects the score

- **WHEN** the computed score is 82
- **THEN** the badge carries the A grade class (score ≥ 70 and < 90)

#### Scenario: No badge on insufficient data

- **WHEN** `calculateRevelationScore(thief)` returns `-1`
- **THEN** no score badge is rendered in the card header

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
(e.g. `Meditation · Power 2pc · Peace 2pc`). The chip is NOT limited to the single
dominant Heavens set. The chip SHALL be colored by the **revelation match score** via
`getProgressStyle(score, 0, 100)`, so its color reflects how well the equipped cards match
preferences (not raw piece count); when the score is insufficient (`-1` — no preferences or
no cards), the chip SHALL fall back to the top Heavens bonus piece count via
`getProgressStyle(pieces, 0, 4)`.

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

#### Scenario: Revelation chip colored by match score

- **WHEN** a Thief card renders its collapsed summary with an active revelation bonus and a computed score ≥ 0
- **THEN** the revelation `StatChip` text and border color are computed via `getProgressStyle(score, 0, 100)`

#### Scenario: Revelation chip color falls back to pieces when unscored

- **WHEN** a Thief has an active revelation bonus but the score is `-1` (e.g. no preferences set)
- **THEN** the revelation chip color falls back to `getProgressStyle(topHeavensPieces, 0, 4)`

#### Scenario: Summary chip ordering places Mindscape before Revelations

- **WHEN** the summary stat chips render with every chip present
- **THEN** order is: Level → Awareness → Weapon → Mindscape → Revelations → Skills
