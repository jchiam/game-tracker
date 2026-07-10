## MODIFIED Requirements

### Requirement: Consolidated revelation set summary

The system SHALL export a pure helper `getRevelationSummary(revelations)` returning
`{ spaceSet: { id, name } | null, heavensBonuses: { id, name, pieces }[] }`, the single source for
every revelation set display (summary chip and editor modal).

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
names remain available on the collapsed-summary chip and inside the editor modal.

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

## ADDED Requirements

### Requirement: Thief card Target Build readout

The Thief card's edit body SHALL render a read-only "Target Build" `ProgressSection` when any revelation preference is set (a preferred set, any main-stat chain entry, any substat chain entry, or comments), displaying the preferred Heavens/Space sets, the per-slot main-stat chains, the substat chain (stat badges with operator badges), and comments. When no preference is set, the section SHALL NOT render.

#### Scenario: Readout shows preference chains

- **WHEN** a Thief has a preferred Heavens set and a Moon main-stat chain and the card is in editing state
- **THEN** the Target Build section shows the set name and the Moon chain as stat badges with operator badges

#### Scenario: No readout without preferences

- **WHEN** a Thief has default (empty) revelation preferences
- **THEN** no Target Build section renders in the edit body
