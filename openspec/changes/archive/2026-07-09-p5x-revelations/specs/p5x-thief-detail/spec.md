## MODIFIED Requirements

### Requirement: Thief card collapsed-summary composition

The collapsed (read-only) state of the Thief card SHALL present investment as
gradient-colored stat chips using the shared `getProgressStyle(value, min, max)`
color language (rust → teal), matching the other four games. The card SHALL render
the Thief's role and element as `GameBadge`s and the bound Persona's name as a
static line. The card SHALL NOT render a rarity-star indicator (rarity remains a
catalog field, matching AE).

When revelations are equipped, the summary SHALL show a revelation chip displaying
the Heavens set name (e.g. "Strife 4pc") colored via investment gradient. If a
Space set is also equipped, it SHALL be appended (e.g. "Strife 4pc + Meditation").
Dimension ordering for chips: Level → Weapon → Revelations → Mindscape → Skills.

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

#### Scenario: Revelation set chip shown when cards equipped

- **WHEN** a Thief has at least one Heavens card equipped with a set
- **THEN** a `StatChip` shows the Heavens set name with "Xpc" suffix (count of cards with that set) colored via investment gradient (progress = equipped count / 4 for Heavens)

#### Scenario: Space set appended to chip

- **WHEN** a Thief has a Space card equipped with a set AND a Heavens 4pc
- **THEN** the revelation chip shows "{Heavens} 4pc + {Space}"

#### Scenario: No revelation chip when empty

- **WHEN** a Thief has no revelation cards equipped
- **THEN** no revelation chip is shown in the summary

#### Scenario: Dimension ordering includes revelations

- **WHEN** the summary stat chips render
- **THEN** order is: Level → Awareness → Weapon → Revelations → Mindscape → Skills

## ADDED Requirements

### Requirement: Revelation editor modal

The system SHALL provide a `RevelationEditorModal` opened from the Thief card
(via an edit-toggle button or dedicated "Revelations" button in the card's edit
body). The modal SHALL follow the canonical build-preference editor modal layout
pattern defined in the `shared-ui-components` spec — `Modal` shell, `.modal-tabs`
with `.tab-btn` for "Equip Cards" and "Build Preferences" tabs, a
`.revelation-editor-body` flex-column container, and `FormGroup` components as
direct children of the body (no intermediate wrapper divs). Per-game CSS SHALL
define only the body layout rule.

The modal SHALL receive the current thief, and callbacks for slot updates and
preference saves. It SHALL NOT be inline in the card's edit collapse body.

#### Scenario: Modal opens from card

- **WHEN** user clicks the revelation editor trigger on a Thief card
- **THEN** the `RevelationEditorModal` opens showing the Equip tab by default

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

The Preferences tab SHALL contain: preferred Heavens set (`Select`), preferred
Space set (`Select`), main stat `PreferenceChain` for Moon/Star/Sky (each filtered
to the slot's valid main stats), and a substat `PreferenceChain` (full `SUB_STATS`
pool).

#### Scenario: Preferred set dropdowns

- **WHEN** the Preferences tab renders
- **THEN** Heavens and Space set dropdowns show all sets from their respective catalogs

#### Scenario: Main stat chain for Star slot

- **WHEN** user edits Star main stat preferences
- **THEN** only Star-valid stats are offered in the chain picker (ATK%, DEF%, HP%, Crit Rate%, Crit Multiplier%, Ailment Accuracy%)

#### Scenario: Substat preference chain

- **WHEN** user edits substat preferences
- **THEN** all 13 substats from the shared pool are available in the chain picker
