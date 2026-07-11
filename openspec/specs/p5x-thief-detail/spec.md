## Purpose

Persona 5: The Phantom X (P5X) per-Thief tracked fields. Covers level (1–80),
Awareness (0–6 duplicate ranks, shown as A0–A6), weapon investment (rarity, level,
forge), Mindscape completion, aggregate skill progress (two coupled booleans —
skills leveled to the Lv8 incense cap and rose-maxed past the gate to Lv10 — with
a rose-gated derived state), favorite toggle, level-based sort, search keys (name,
codename, personaName, role, element), revelation card summary chip, revelation
editor modal, and the Thief card's collapsed-summary composition
(investment-gradient chips, role/element badges, bound-Persona static line, no
rarity indicator). Edit sections follow the dimension ordering Level → Weapon →
Revelations → Mindscape → Skills; the collapsed summary chips reorder Mindscape
ahead of Revelations (Level → Awareness → Weapon → Mindscape → Revelations →
Skills) so the width-capped Revelations chip starts the second line and the card
holds a fixed two-line summary height.
## Requirements
### Requirement: Thief level field

The system SHALL track a Thief's level as an integer in the range 1–80, defaulting
to 1 on add. Updates SHALL be clamped to this range before persisting. 80 is the
current live-game cap; a future cap raise is a paired slider-max + DB CHECK change.

#### Scenario: Level updated within range

- **WHEN** user sets a Thief's level to a value between 1 and 80 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets a Thief's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets a Thief's level above 80
- **THEN** level is clamped to 80 before update

### Requirement: Thief awareness field

The system SHALL track a Thief's Awareness (duplicate rank) as an integer in the
range 0–6, defaulting to 0 on add. Updates SHALL be clamped to this range before
persisting. Awareness 0 represents no duplicates; 6 is the maximum. The UI SHALL
present ranks as `A0`–`A6`.

The awareness control SHALL be a `SegmentedButtons` row with investment coloring.
Buttons SHALL stretch to equal width via `flex: 1` with no wrapping — all seven
buttons fit on a single line, matching the uniform-stretch pattern used by AE's
phase row and R1999's portrait row.

#### Scenario: Awareness updated within range

- **WHEN** user sets a Thief's awareness to a value between 0 and 6 inclusive
- **THEN** awareness is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Awareness clamped to range

- **WHEN** user sets a Thief's awareness below 0 or above 6
- **THEN** awareness is clamped to 0 or 6 respectively before update

#### Scenario: Default awareness state

- **WHEN** a Thief is added to the roster
- **THEN** awareness is 0

#### Scenario: Toggle buttons stretch uniformly

- **WHEN** the awareness row is rendered
- **THEN** all seven buttons (A0–A6) have equal width via `flex: 1` with no wrapping

### Requirement: Favorite toggle

The system SHALL allow toggling the favorite status of a tracked Thief. Updates are
optimistic and persisted via debounced save.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on a Thief
- **THEN** `isFavorited` is updated in local state immediately and queued for DB write

### Requirement: P5X roster sort by level

The system SHALL support sorting the P5X roster by Thief level (descending) and by calculated revelation score (descending), in addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by score selected

- **WHEN** user selects score sort
- **THEN** roster is ordered by `calculateRevelationScore(thief)` descending, with favorited-first still applied as the primary sort key, and insufficient-data (`-1`) Thieves ordered last among non-favorites

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the roster spec is applied with no level or score comparator

### Requirement: P5X roster search keys

The system SHALL search the P5X roster using Fuse.js with keys: name, codename,
personaName, role, element.

#### Scenario: Search by codename

- **WHEN** user searches for a codename (e.g., Panther, Joker)
- **THEN** Thieves matching that codename are returned via fuzzy search

#### Scenario: Search by Persona name

- **WHEN** user searches for a Persona name (e.g., Arsene)
- **THEN** Thieves whose bound Persona matches are returned via fuzzy search

#### Scenario: Search by role

- **WHEN** user searches for a role name (e.g., Healer, Debuffer)
- **THEN** Thieves matching that role are returned via fuzzy search

#### Scenario: Search by element

- **WHEN** user searches for an element name (e.g., Nuclear, Bless)
- **THEN** Thieves matching that element are returned via fuzzy search

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

### Requirement: Thief aggregate skill-progress fields

The system SHALL track a Thief's Persona skill progress as two boolean fields —
`skillsLeveled` (skills brought up to the level-8 incense cap) and `roseMaxed`
(pushed past the rose gate from 8 to the level-10 max) — both defaulting to `false`
on add. Progress is tracked in **aggregate** for the Thief, not per individual skill.
Updates are optimistic and persisted via debounced save.

#### Scenario: Default skill-progress state

- **WHEN** a Thief is added to the roster
- **THEN** `skillsLeveled` is `false` and `roseMaxed` is `false`

#### Scenario: Mark skills leveled

- **WHEN** user marks a Thief's skills as leveled
- **THEN** `skillsLeveled` is set to `true` in local state immediately and queued for DB write via debounced save

#### Scenario: Mark rose maxed

- **WHEN** user marks a Thief's skills as rose-maxed
- **THEN** `roseMaxed` is set to `true` and `skillsLeveled` is `true`, and both are queued for DB write in one patch

### Requirement: Skill-progress invariant

The system SHALL prevent the invalid state where `roseMaxed` is `true` while
`skillsLeveled` is `false`. The invariant SHALL be enforced at the interaction layer
(coupled toggles), the hook updater (which normalizes against current state), and the
database (a `CHECK` constraint on `p5x_tracked_thieves`).

#### Scenario: Enabling rose implies leveled

- **WHEN** user sets `roseMaxed` to `true` on a Thief whose `skillsLeveled` is `false`
- **THEN** `skillsLeveled` is coerced to `true` in the same update so the persisted state is `(true, true)`

#### Scenario: Clearing leveled clears rose

- **WHEN** user sets `skillsLeveled` to `false` on a Thief whose `roseMaxed` is `true`
- **THEN** `roseMaxed` is coerced to `false` in the same update so the persisted state is `(false, false)`

#### Scenario: Database rejects the invalid combination

- **WHEN** a row with `rose_maxed = true` and `skills_leveled = false` is written to `p5x_tracked_thieves`
- **THEN** the `CHECK` constraint rejects the write

### Requirement: Rose-gated summary indicator

The collapsed (read-only) state of the Thief card SHALL derive a **rose-gated** state
as `skillsLeveled && !roseMaxed` and present it as a distinct 🌹 badge among the
summary chips. When `roseMaxed` is `true`, the card SHALL instead present a
"skills maxed" indicator. When both fields are `false`, the card SHALL present no
skill indicator, keeping the untouched card uncluttered.

#### Scenario: Rose-gated badge shown

- **WHEN** a Thief card renders its collapsed summary with `skillsLeveled` `true` and `roseMaxed` `false`
- **THEN** a 🌹 rose-gated badge is shown

#### Scenario: Maxed indicator shown

- **WHEN** a Thief card renders its collapsed summary with `roseMaxed` `true`
- **THEN** a "skills maxed" indicator is shown and no rose-gated badge is present

#### Scenario: No indicator when untouched

- **WHEN** a Thief card renders its collapsed summary with both `skillsLeveled` and `roseMaxed` `false`
- **THEN** no skill indicator is present

### Requirement: Skill-progress edit controls

The Thief card's edit body SHALL provide two coupled toggle controls for skill
progress, rendered in a "Skills" `ProgressSection` below the Mindscape section. The
toggles SHALL be self-styled (not `.btn`) and SHALL enforce the coupling described in
the skill-progress invariant so no interaction can produce the invalid combination.

#### Scenario: Skills section rendered below Mindscape

- **WHEN** a Thief card's edit body renders
- **THEN** a "Skills" `ProgressSection` with the two toggles appears below the Mindscape `ProgressSection`

#### Scenario: Toggle invokes skill-progress updater

- **WHEN** user activates either skill toggle
- **THEN** the card invokes the skill-progress update handler with the normalized `skillsLeveled` / `roseMaxed` values

### Requirement: Rose-gated roster filter

The P5X roster toolbar SHALL render a "🌹 Gated" filter chip that, when active,
narrows the displayed roster to only thieves in the rose-gated state
(`skillsLeveled && !roseMaxed`). The chip composes with existing search and sort.

#### Scenario: Filter chip shown in toolbar

- **WHEN** the P5X roster view renders
- **THEN** a "🌹 Gated" filter chip is visible in the toolbar area

#### Scenario: Activating the filter narrows roster

- **WHEN** user activates the "🌹 Gated" filter chip
- **THEN** only thieves with `skillsLeveled === true` and `roseMaxed === false` are shown

#### Scenario: Deactivating the filter restores full roster

- **WHEN** user deactivates the "🌹 Gated" filter chip
- **THEN** all tracked thieves (matching current search/sort) are shown again

#### Scenario: Filter composes with level sort

- **WHEN** the rose-gate filter is active and sort is set to LEVEL
- **THEN** only rose-gated thieves are shown, sorted by level descending (favorites first)

#### Scenario: Filter composes with search

- **WHEN** the rose-gate filter is active and user searches "fire"
- **THEN** only rose-gated thieves matching "fire" are shown

#### Scenario: Empty state when no thieves are rose-gated

- **WHEN** the rose-gate filter is active but no thieves have `skillsLeveled && !roseMaxed`
- **THEN** an empty state message is shown (e.g., "No rose-gated thieves")

### Requirement: Thief Mindscape maxed field

The system SHALL track a Thief's Mindscape completion as a boolean field
`mindscapeMaxed`, defaulting to `false` on add. When `true`, the thief's
entire Mindscape node tree is fully unlocked. Updates are optimistic and
persisted via debounced save.

#### Scenario: Default mindscape state

- **WHEN** a Thief is added to the roster
- **THEN** `mindscapeMaxed` is `false`

#### Scenario: Mark mindscape maxed

- **WHEN** user marks a Thief's Mindscape as maxed
- **THEN** `mindscapeMaxed` is set to `true` in local state immediately and queued for DB write via debounced save

#### Scenario: Unmark mindscape maxed

- **WHEN** user unmarks a Thief's Mindscape as maxed
- **THEN** `mindscapeMaxed` is set to `false` in local state immediately and queued for DB write via debounced save

### Requirement: Mindscape summary indicator

The collapsed (read-only) state of the Thief card SHALL derive a visual
indicator from `mindscapeMaxed`. When `true`, a "MS ✓" chip or equivalent
SHALL appear among the summary chips. When `false`, no Mindscape indicator
is shown, keeping the untouched card uncluttered.

#### Scenario: Mindscape maxed indicator shown

- **WHEN** a Thief card renders its collapsed summary with `mindscapeMaxed` `true`
- **THEN** a Mindscape completion indicator is shown among the summary chips

#### Scenario: No indicator when not maxed

- **WHEN** a Thief card renders its collapsed summary with `mindscapeMaxed` `false`
- **THEN** no Mindscape indicator is present

### Requirement: Mindscape edit toggle

The Thief card's edit body SHALL provide a toggle control for Mindscape
completion, rendered in a "Mindscape" `ProgressSection` below the Weapon
section. The toggle SHALL be self-styled (not `.btn`).

#### Scenario: Mindscape section rendered below Weapon

- **WHEN** a Thief card's edit body renders
- **THEN** a "Mindscape" `ProgressSection` with the maxed toggle appears below the Weapon section

#### Scenario: Toggle invokes mindscape updater

- **WHEN** user activates the Mindscape toggle
- **THEN** the card invokes the field update handler with the new `mindscapeMaxed` value

### Requirement: Weapon rarity field

The system SHALL track the rarity of a Thief's equipped weapon as a nullable
integer in the set {2, 3, 4, 5}, defaulting to `null` on add. A `null` value
means the user has not started tracking weapon investment for this Thief.
Setting a rarity activates the weapon section (summary chip + edit controls).

#### Scenario: Default weapon rarity state

- **WHEN** a Thief is added to the roster
- **THEN** `weaponRarity` is `null`

#### Scenario: Weapon rarity set

- **WHEN** user selects a weapon rarity (2, 3, 4, or 5)
- **THEN** `weaponRarity` is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon rarity cleared via allowDeselect

- **WHEN** user deselects the active rarity button
- **THEN** `weaponRarity` is set to `null`, hiding the weapon summary chip

### Requirement: Weapon level field

The system SHALL track the level of a Thief's weapon as an integer in the range
1–80, defaulting to 1 on add. Updates SHALL be clamped to this range before
persisting. Weapon level is shared across all weapons on the same Thief in-game,
so this is effectively a per-Thief stat.

#### Scenario: Weapon level updated within range

- **WHEN** user sets a Thief's weapon level to a value between 1 and 80 inclusive
- **THEN** weapon level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon level clamped below minimum

- **WHEN** user sets a Thief's weapon level below 1
- **THEN** weapon level is clamped to 1 before update

#### Scenario: Weapon level clamped above maximum

- **WHEN** user sets a Thief's weapon level above 80
- **THEN** weapon level is clamped to 80 before update

### Requirement: Weapon forge field

The system SHALL track the forge level (dupe-based upgrade) of a Thief's
equipped weapon as an integer in the range 0–6, defaulting to 0 on add.
Updates SHALL be clamped to this range before persisting.

#### Scenario: Default weapon forge state

- **WHEN** a Thief is added to the roster
- **THEN** `weaponForge` is 0

#### Scenario: Weapon forge updated within range

- **WHEN** user sets a Thief's weapon forge to a value between 0 and 6 inclusive
- **THEN** weapon forge is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon forge clamped to range

- **WHEN** user sets a Thief's weapon forge below 0 or above 6
- **THEN** weapon forge is clamped to 0 or 6 respectively before update

### Requirement: Weapon summary chip

The collapsed (read-only) state of the Thief card SHALL present weapon
investment as a single `StatChip` when `weaponRarity` is not `null`. The chip
SHALL display the equipped rarity and forge level (e.g., `⚔ 5★ F4`). The chip
color SHALL use `getProgressStyle` based on forge (0–6) to match the
investment-gradient language used by other chips. When `weaponRarity` is `null`,
no weapon chip is shown.

#### Scenario: Weapon chip shown when rarity set

- **WHEN** a Thief card renders its collapsed summary with `weaponRarity` set (e.g., 5) and `weaponForge` at 4
- **THEN** a `StatChip` with label `⚔ 5★ F4` is shown, colored via `getProgressStyle(weaponForge, 0, 6)`

#### Scenario: No weapon chip when rarity null

- **WHEN** a Thief card renders its collapsed summary with `weaponRarity` `null`
- **THEN** no weapon `StatChip` is present

### Requirement: Weapon edit section

The Thief card's edit body SHALL provide a "Weapon" `ProgressSection` after the
Awareness section, containing three controls:

1. **Rarity** — `SegmentedButtons` with options 2★, 3★, 4★, 5★ using
   `coloring="static"` and `allowDeselect` (clearing sets `weaponRarity` to
   `null`). Each option uses a rarity modifier class for per-star color coding.
2. **Level** — `LevelSlider` (1–80) with `getProgressStyle(weaponLevel, 1, 80)`
   gradient fill, matching the thief level slider.
3. **Forge** — `SegmentedButtons` with options F0–F6 using
   `coloring="investment"`, matching the awareness segmented-buttons pattern.

#### Scenario: Weapon section rendered after Awareness

- **WHEN** a Thief card's edit body renders
- **THEN** a "Weapon" `ProgressSection` appears below the Awareness section

#### Scenario: Rarity buttons use static coloring with allowDeselect

- **WHEN** the weapon rarity control renders
- **THEN** it is a `SegmentedButtons` with `coloring="static"`, `allowDeselect`, and four options (2★–5★)

#### Scenario: Level slider shows weapon level

- **WHEN** the weapon level slider renders
- **THEN** it uses `LevelSlider` with min=1, max=80, value=`weaponLevel`

#### Scenario: Forge buttons use investment coloring

- **WHEN** the weapon forge control renders
- **THEN** it is a `SegmentedButtons` with `coloring="investment"` and seven options (F0–F6)

#### Scenario: Weapon section value label reflects state

- **WHEN** `weaponRarity` is set (e.g., 5) with `weaponLevel` 45 and `weaponForge` 4
- **THEN** the `ProgressSection` value displays `5★ · Lv 45 · F4`
- **WHEN** `weaponRarity` is `null`
- **THEN** the `ProgressSection` value displays `—`

### Requirement: Revelation editor modal

The system SHALL provide a `RevelationEditorModal` opened from the Thief card's
revelation slot grid (each cell passes its slot as the anchor). The modal SHALL follow the
canonical build-preference editor modal layout pattern defined in the `shared-ui-components`
spec — `Modal` shell, `.modal-tabs` with `.tab-btn` for "Equip Cards" and "Build Preferences"
tabs, a `.revelation-editor-body` flex-column container, and `FormGroup` components grouped in
per-slot cards. Per-game CSS SHALL define only the body layout rule.

The modal SHALL receive the current thief, an optional anchor slot (scrolled into view on
mount per the `shared-equipment-editor` contract), and callbacks for slot updates and
preference saves. It SHALL NOT be inline in the card's edit collapse body.

#### Scenario: Modal opens from slot grid

- **WHEN** user clicks a cell in the Thief card's revelation slot grid
- **THEN** the `RevelationEditorModal` opens showing the Equip tab with that slot's card scrolled into view

#### Scenario: Modal closes

- **WHEN** user clicks close or the overlay
- **THEN** the modal closes and no state is lost (changes are saved on interaction, not on close)

#### Scenario: Tab switching

- **WHEN** user clicks the "Preferences" tab
- **THEN** the preferences panel is shown; clicking "Equip" returns to the slot editors

### Requirement: Revelation modal — Equip tab

The Equip tab SHALL render per-slot card editors for all 5 slots (Sun, Moon, Star,
Sky, Space). Each slot editor presents: a `Select` for the set (Heavens catalog for
sun/moon/star/sky; Space catalog for space), a `Select` for main stat (filtered by
slot from `MAIN_STATS`; disabled for Sun and Space since they're fixed), and a
`SubStatList` for substats (stat-value variant, max 4 entries, stat options from
`SUB_STATS` pool excluding the card's main stat).

#### Scenario: Slot editor renders set dropdown

- **WHEN** the Equip tab renders a Heavens slot
- **THEN** a `Select` dropdown lists all Heavens sets plus a "None" option

#### Scenario: Main stat dropdown respects slot

- **WHEN** the Moon slot editor renders its main stat dropdown
- **THEN** only Moon-valid main stats are listed (ATK%, DEF%, HP%, HP Recovery%, DMG Multiplier%)

#### Scenario: Sun slot main stat is fixed

- **WHEN** the Sun slot editor renders
- **THEN** main stat is displayed as "Flat HP" without a dropdown (or a disabled dropdown)

#### Scenario: Substats exclude main stat

- **WHEN** a Moon card has main stat "ATK%"
- **THEN** the substat picker excludes "ATK%" from available options

#### Scenario: Substat limit enforced

- **WHEN** a card already has 4 substats
- **THEN** no additional substats can be added

### Requirement: Revelation modal — Preferences tab

The Preferences tab SHALL contain, in order: preferred Space set (`Select`),
preferred Heavens set (`Select`) — Space first, matching the Space-first rule for
every set-display surface — then a main stat `PreferenceChain` for Moon/Star/Sky
(each filtered to the slot's valid main stats), a substat `PreferenceChain` (full
`SUB_STATS` pool), and a `BuildComments` field for free-text build notes.

#### Scenario: Preferred set dropdowns

- **WHEN** the Preferences tab renders
- **THEN** Heavens and Space set dropdowns show all sets from their respective catalogs

#### Scenario: Main stat chain for Star slot

- **WHEN** user edits Star main stat preferences
- **THEN** only Star-valid stats are offered in the chain picker (ATK%, DEF%, HP%, Crit Rate%, Crit Multiplier%, Ailment Accuracy%)

#### Scenario: Substat preference chain

- **WHEN** user edits substat preferences
- **THEN** all 13 substats from the shared pool are available in the chain picker

#### Scenario: Comments edited

- **WHEN** user enters text in the `BuildComments` field
- **THEN** `revelationPreferences.comments` is updated and queued for persistence

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

### Requirement: Thief card Target Build readout

The Thief card's edit body SHALL render a read-only "Target Build" `ProgressSection` when any revelation preference is set (a preferred set, any main-stat chain entry, any substat chain entry, or comments), displaying the preferred Heavens/Space sets, the per-slot main-stat chains, the substat chain (stat badges with operator badges), and comments. When no preference is set, the section SHALL NOT render.

#### Scenario: Readout shows preference chains

- **WHEN** a Thief has a preferred Heavens set and a Moon main-stat chain and the card is in editing state
- **THEN** the Target Build section shows the set name and the Moon chain as stat badges with operator badges

#### Scenario: No readout without preferences

- **WHEN** a Thief has default (empty) revelation preferences
- **THEN** no Target Build section renders in the edit body

