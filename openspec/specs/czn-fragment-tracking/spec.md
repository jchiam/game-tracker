# czn-fragment-tracking Specification

## Purpose

Per-combatant Memory Fragment tracking for Chaos Zero Nightmare: the six equipped pieces (set, main stat, substat names), the fragment build preferences (4-piece pick, 2-piece pick, slot 4–6 main-stat chains, substat chain, comments), the fragment editor modal, and the card's slot grid, set digest, and Target Build readout.

## Requirements

### Requirement: Equipped Memory Fragment tracking

The system SHALL track up to six equipped Memory Fragments per combatant, keyed by numeric slot 1–6. Each equipped piece records a set id, a main stat, and up to four substat names (no numeric values, no rarity, no upgrade level). Slots 1–3 carry fixed main stats (`Flat ATK`, `Flat DEF`, `Flat HP` respectively); slots 4–6 carry a main stat from that slot's pool. Persistence is one atomic equipment-slot upsert per `(combatant, slot)` — piece row upserted, substat rows replaced, in one statement — queued through the debounced save queue under per-slot keys. Removing a piece deletes the row and sets the local slot to `null`; the model SHALL NOT use an empty-piece sentinel object, so in-session state always matches a reload. A combatant with no rows SHALL load with all six slots `null`.

#### Scenario: Piece saved to a slot

- **WHEN** user assigns a set, main stat, and substats to slot 4 and closes the editor
- **THEN** the slot updates optimistically and a single upsert (piece + replaced substats) is queued under that combatant+slot key

#### Scenario: Piece removed

- **WHEN** user clears slot 4
- **THEN** the local slot becomes `null` immediately and a delete is queued; a subsequent reload shows the same `null` slot

#### Scenario: Fixed-main slot saved

- **WHEN** user saves slot 2 with a set selected
- **THEN** the persisted main stat is `Flat DEF` regardless of any transient editor state

#### Scenario: Legacy row without fragments

- **WHEN** a tracked combatant row predating this change loads
- **THEN** all six slots are `null` and the preferences are empty

### Requirement: Memory Fragment build preferences

The system SHALL track per-combatant fragment build preferences: a 4-piece set pick, a 2-piece set pick, ordered main-stat preference chains for slots 4–6 (with `>` / `>=` / `OR` operators), one global substat chain, and free-text comments. Saving SHALL replace all preference rows in one call, updating the set picks and comments as parent columns, and SHALL be queued whole-object (latest-wins) under a per-combatant key.

#### Scenario: Preferences saved

- **WHEN** user edits any preference field in the Build Preferences tab
- **THEN** the whole preferences object updates optimistically and one queued save replaces the preference rows and parent columns

#### Scenario: Preferences survive reload

- **WHEN** the roster reloads from the database
- **THEN** chains reconstruct in order with operators intact, and the set picks and comments come from the parent row

### Requirement: Memory Fragment editor modal

The system SHALL provide a fragment editor composed over the shared Equipment Editor Shell with an Equip tab and a Build Preferences tab. The Equip tab renders six slot cards headed by numeral and slot name: a set select over every catalog set labelled with name and piece type (`{name} [4-PC]`), a read-only fixed main stat for slots 1–3, a main-stat select over the slot's pool for slots 4–6, and a substat list of up to four names drawn from the shared pool excluding the main stat; stat controls are gated until a set is chosen (and, on slots 4–6, the substat list additionally until a main stat is chosen), and on save the main stat is pruned from the substat list. Opening the editor from a card slot SHALL scroll to that slot. The Build Preferences tab renders a 4-piece set select offering only 4-piece sets, a 2-piece set select offering only 2-piece sets, one preference chain per variable slot (options = that slot's main pool), the global substat chain (options = the substat pool), and build comments, all via the shared build-preference primitives.

#### Scenario: Editor opens anchored

- **WHEN** user clicks slot 5 on the combatant card
- **THEN** the editor opens on the Equip tab scrolled to the `V · Desire` slot card

#### Scenario: Gating before set chosen

- **WHEN** a slot has no set selected
- **THEN** its main-stat and substat controls are gated

#### Scenario: Main pruned from substats

- **WHEN** user saves slot 6 with `Ego Recovery` as main and `Ego Recovery` present in its substat list
- **THEN** the persisted substats exclude `Ego Recovery`

#### Scenario: Pick selects scoped by piece type

- **WHEN** the Build Preferences tab renders
- **THEN** the 4-piece pick lists only sets with `pieces` 4 and the 2-piece pick lists only sets with `pieces` 2

### Requirement: Memory Fragments card section

The combatant card SHALL render, in the collapsed body, a set digest line — equipped sets grouped by id as `{short name} ×{count}` ordered by count descending, or an em-dash placeholder when no piece is equipped — and, in the edit body after the Preferred Partners section, a labeled **Memory Fragments** group containing the six-cell slot grid (set icon when the slot holds a piece, otherwise the slot's Roman numeral glyph; active state when equipped; clicking a cell opens the editor anchored to that slot) and, when any preference or comment is set, a read-only Target Build readout (set pick badges, per-slot and substat chain readouts through the shared chain readout, comments).

#### Scenario: Digest line renders

- **WHEN** a combatant wears four pieces of one set and two of another
- **THEN** the digest reads the first set's short name `×4` then the second's `×2`

#### Scenario: Digest placeholder

- **WHEN** a combatant has no piece equipped
- **THEN** the digest line shows the em-dash placeholder

#### Scenario: Slot cell opens editor

- **WHEN** user clicks a slot cell in the edit body
- **THEN** the fragment editor opens anchored to that slot

#### Scenario: Target Build readout gated

- **WHEN** a combatant has no set picks, no chains, and no comments
- **THEN** the Target Build readout does not render
