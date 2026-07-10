## ADDED Requirements

### Requirement: Unified relic editor modal

The system SHALL provide a single `RelicEditorModal` per character covering all six relic slots, replacing the per-slot modal. The modal SHALL follow the shared equipment editor contract (see `shared-equipment-editor`): the Equip tab renders six slot cards (head, hands, body, feet, sphere, rope) — each with a set `Select` filtered by slot family (`1*` relic sets for head/hands/body/feet; `3*` planar sets for sphere/rope), a main-stat `Select` (read-only fixed stat for head HP and hands ATK), and a `SubStatList` — and accepts an anchor slot from the card's relic grid, scrolling that slot card into view on mount. Selecting a slot card's set "None" option SHALL clear that slot (the existing per-slot remove path); the footer SHALL contain only "Done" (no "Un-equip Relic" button).

The Build Preferences tab SHALL show, together and in the shared composition order (see `shared-equipment-editor`): the preferred relic-set and planar-set `Select`s, the main-stat `PreferenceChain`s for all four variable slots (body, feet, sphere, rope), the global substat `PreferenceChain`, and `BuildComments` — no longer only the opened slot's main chain.

#### Scenario: All six slots editable in one open

- **WHEN** the user opens the relic editor from any relic grid slot
- **THEN** all six slot cards are editable on the Equip tab, with the clicked slot scrolled into view

#### Scenario: Slot family filtering per card

- **WHEN** the sphere or rope slot card renders its set `Select`
- **THEN** only planar sets (id prefix `3`) are offered; head/hands/body/feet cards offer only relic sets (id prefix `1`)

#### Scenario: Set None clears the slot

- **WHEN** the user selects "None" on the body slot card's set `Select`
- **THEN** the body relic is removed (delete queued) while the other five slots are unaffected and the modal stays open

#### Scenario: Preferences tab shows all four main chains

- **WHEN** the user opens the Build Preferences tab
- **THEN** the two preferred-set `Select`s appear first, followed by the body, feet, sphere, and rope main-stat chains all visible at once, the substat chain, and `BuildComments`

### Requirement: HSR card level slider uses LevelSlider

The HSR character card's edit-body level control SHALL be the shared `LevelSlider` component (1–80), not a raw `<input type="range">`.

#### Scenario: Level control is the shared primitive

- **WHEN** the HSR card's edit body renders the level control
- **THEN** it is a `LevelSlider` with min 1, max 80, carrying the shared investment gradient fill
