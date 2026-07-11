## MODIFIED Requirements

### Requirement: Thief card collapsed-summary composition

The collapsed (read-only) state of the Thief card SHALL present investment as
gradient-colored stat chips using the shared `getProgressStyle(value, min, max)`
color language (rust → teal), matching the other four games. The card SHALL render
the Thief's role and element as `GameBadge`s and the bound Persona's name on a
static line. The card SHALL NOT render a rarity-star indicator (rarity remains a
catalog field, matching AE).

When at least one revelation card is equipped, the summary SHALL show a single
**set-independent count** revelation `StatChip` labelled `Rev {n}/5`, where `n` is
the number of equipped revelation cards (across the five slots) and `5` is the slot
count. The chip's width does NOT depend on which sets are equipped. The chip SHALL be
colored by the **revelation match score** via `getProgressStyle(score, 0, 100)`, so
its color reflects how well the equipped cards match preferences (not raw piece
count); when the score is insufficient (`-1` — no preferences or no cards), the chip
SHALL fall back to the top Heavens bonus piece count via `getProgressStyle(pieces, 0, 4)`.
When no card is equipped, no revelation chip is shown.

The equipped **set names** SHALL NOT appear on any chip. Instead, when an active set
bonus exists, the card's `summaryLine` SHALL render the **Space-first, lossless**
consolidation from `getRevelationSummary` (see "Consolidated revelation set summary")
— the Space set (bare name) followed by each active Heavens bonus as `{name} {pieces}pc`,
joined by `·` (e.g. `Meditation · Power 2pc · Peace 2pc`) — on the **same line** as the
bound-Persona name but **visually distinct** from it: the set text SHALL carry the
revelation-score gradient color (the same color as the `Rev {n}/5` chip) in normal
(non-italic) weight, a divider glyph SHALL separate the set text from the Persona name,
and the Persona name SHALL keep its dim italic treatment. When no active set bonus
exists, the `summaryLine` SHALL show the Persona name alone (no divider).

Summary chip ordering SHALL be: Level → Awareness → Weapon → **Mindscape →
Revelations** → Skills. The Mindscape chip precedes the Revelations chip so the short
fixed-width chips pack the first row consistently. This deviates deliberately from the
edit-body section ordering (Level → Weapon → Revelations → Mindscape → Skills), which
is unchanged.

#### Scenario: Level chip colored by investment

- **WHEN** a Thief card renders its collapsed summary
- **THEN** the `Lv {level}` `StatChip` text and border color are computed via `getProgressStyle(level, 1, 80)`

#### Scenario: Awareness chip colored by investment

- **WHEN** a Thief card renders its collapsed summary
- **THEN** an `A{awareness}` `StatChip` is shown, colored via `getProgressStyle(awareness, 0, 6)`

#### Scenario: Persona name line present

- **WHEN** a Thief card renders with no active revelation set bonus
- **THEN** the bound Persona's name is shown alone on the `summaryLine`, in its dim italic treatment, with no divider or set text

#### Scenario: Set summary joins the Persona line, visually distinct

- **WHEN** a Thief card renders with an active revelation set bonus (e.g. Meditation space + Power 2pc)
- **THEN** the `summaryLine` shows the set summary (`Meditation · Power 2pc`) in the revelation-score gradient color, non-italic, followed by a divider glyph and then the bound-Persona name in its dim italic treatment

#### Scenario: Level slider uses the canonical class and shared gradient

- **WHEN** a Thief card's edit body renders the level slider
- **THEN** the input uses the canonical `.level-slider` class and sets `--slider-fill-color` and `--slider-fill-glow` from `getProgressStyle(level, 1, 80)`, with the track fill percentage computed as `(level − 1) / 79`

#### Scenario: No rarity-star indicator

- **WHEN** a Thief card renders
- **THEN** no `.rarity-indicator` element is present

#### Scenario: Revelation count chip shows equipped-card count

- **WHEN** a Thief has three revelation cards equipped
- **THEN** a `StatChip` labelled `Rev 3/5` is shown in the summary, its width independent of the equipped set names

#### Scenario: No revelation chip when no cards equipped

- **WHEN** a Thief has no revelation cards equipped
- **THEN** no revelation `StatChip` is shown in the summary and the `summaryLine` shows the Persona name alone

#### Scenario: Set summary is space-first and lossless

- **WHEN** a Thief has a Space set plus two Heavens sets at 2pc each (e.g. Meditation space, Peace×2, Power×2)
- **THEN** the `summaryLine` set text reads `Meditation · Peace 2pc · Power 2pc` — the Space set first, then both Heavens bonuses in `4pc → 2pc → name` order (neither dropped)

#### Scenario: Heavens 4pc shown at 4pc on the summary line

- **WHEN** a Thief has four cards of one Heavens set and no Space set
- **THEN** the `summaryLine` set text shows `{Heavens} 4pc`

#### Scenario: No set summary when no active bonus

- **WHEN** a Thief has revelation cards equipped but only single-card Heavens sets with no Space set (no active bonus)
- **THEN** no set text is rendered on the `summaryLine` (Persona name alone), while the `Rev {n}/5` count chip still reflects the equipped-card count

#### Scenario: Revelation count chip colored by match score

- **WHEN** a Thief card renders its collapsed summary with an equipped card and a computed score ≥ 0
- **THEN** the `Rev {n}/5` `StatChip` text and border color are computed via `getProgressStyle(score, 0, 100)`

#### Scenario: Revelation chip color falls back to pieces when unscored

- **WHEN** a Thief has an equipped card but the score is `-1` (e.g. no preferences set)
- **THEN** the `Rev {n}/5` chip color falls back to `getProgressStyle(topHeavensPieces, 0, 4)`

#### Scenario: Summary chip ordering places Mindscape before Revelations

- **WHEN** the summary stat chips render with every chip present
- **THEN** order is: Level → Awareness → Weapon → Mindscape → Revelations → Skills

### Requirement: Consolidated revelation set summary

The system SHALL export a pure helper `getRevelationSummary(revelations)` returning
`{ spaceSet: { id, name } | null, heavensBonuses: { id, name, pieces }[] }`, the single source for
every revelation set display (summary line and editor modal).

- **heavensBonuses**: group the four Heavens slot cards (`sun`, `moon`, `star`, `sky`) by `setId`;
  for each set with **≥2** matching cards emit a bonus with `pieces = 4` when exactly four cards
  match, otherwise `pieces = 2` (two or three cards → 2pc). Sets with a single card are omitted.
  Ordered `4pc` before `2pc`, then by set name.
- **spaceSet**: the Space slot card's set resolved to `{ id, name }`, or `null` when no Space card
  with a set is equipped.

Every surface that displays revelation sets SHALL render **Space first, then Heavens bonuses**, and
SHALL show **names and piece counts only** (no set-effect descriptions).

The edit-mode "Revelations" `ProgressSection` SHALL render a five-cell slot grid (see
`shared-equipment-editor` "Slot-grid card entry") in place of the previous text readout and
"Edit Revelations" button: one `.equip-slot-cell` per slot (Sun, Moon, Star, Sky, Space) showing a
per-slot glyph (no set art exists in the catalog), active-styled when the slot holds a card with a
non-null `setId`. Clicking a cell opens the `RevelationEditorModal` anchored to that slot. The
section header `value` SHALL show `—` when no card is equipped and be omitted otherwise. Full set
names remain available on the collapsed-summary line and inside the editor modal.

#### Scenario: Helper omits single-card sets and honors the 2/3-card breakpoint

- **WHEN** `getRevelationSummary` runs on Heavens cards of {Power, Power, Power, Peace}
- **THEN** `heavensBonuses` is `[{ Power, pieces: 2 }]` — Power at 2pc (three cards, not enough for 4pc), and the single Peace card omitted

#### Scenario: Helper resolves the space set independently

- **WHEN** a Space card with a set is equipped
- **THEN** `spaceSet` is its `{ id, name }` regardless of the Heavens bonuses

#### Scenario: Edit section renders the slot grid

- **WHEN** the edit Revelations section renders for a Thief with cards in Sun and Space
- **THEN** a five-cell slot grid renders with the Sun and Space cells active and the Moon, Star, and Sky cells inactive, and no text readout or "Edit Revelations" button is present

#### Scenario: Clicking a cell opens the modal anchored

- **WHEN** the user clicks the Star cell in the slot grid
- **THEN** the `RevelationEditorModal` opens on the Equip tab with the Star slot card scrolled into view

#### Scenario: Edit section empty state

- **WHEN** the edit Revelations section renders with no cards equipped
- **THEN** the section `value` shows `—` and all five grid cells render inactive

### Requirement: P5X card fixed-height collapsed summary

The P5X Thief card SHALL reserve a fixed two-line height for its collapsed summary
chip row via the shared `GameCardShell` opt-in reserve (see `shared-card-collapse`),
so that cards whose chips occupy only one line report the same measured summary
height as cards whose chips occupy two lines. Because every summary chip — including
the `Rev {n}/5` count chip — now has a fixed, set-independent width, the worst-case
chip row is bounded to two lines, so this reserve yields a uniform collapsed body
height across the P5X roster grid.

#### Scenario: One-line card reserves two chip lines

- **WHEN** a Thief card's summary chips fit on a single line
- **THEN** the chip row still reserves the height of two chip lines, matching a two-line card's summary height

#### Scenario: Uniform collapsed height across the grid

- **WHEN** the P5X roster renders a mix of Thieves with one-line and two-line chip rows
- **THEN** every collapsed card body has the same height

## REMOVED Requirements

### Requirement: Revelation summary chip width cap

**Reason**: The revelation summary chip no longer carries variable-width set names — it is now a set-independent `Rev {n}/5` count chip with a fixed, predictable width. With no variable label to clip, a `max-width` cap and `text-overflow: ellipsis` truncation are unnecessary, and no information is lost on the collapsed card.

**Migration**: The full set names, previously truncated on the chip, now render untruncated on the card's `summaryLine` (joined with the Persona name) and remain available in the Revelation editor modal. The `.p5x-revelation-chip` `max-width` / `white-space: nowrap` / `overflow` / `text-overflow` rules (base and `@media (max-width: 768px)`) are deleted from `ThiefCard.css`.
