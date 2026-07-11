## ADDED Requirements

### Requirement: Equipment Editor Shell composition

Every game's equipment editor modal SHALL be composed from the shared `EquipmentEditorShell` component (`src/components/`), which SHALL own the modal chrome, the two-tab scaffold (the game's equip tab label and the constant "Build Preferences" label via `.modal-tabs`/`.tab-btn`), the active-tab state (only the active tab's content rendered), the body wrapper, and the footer "Done" action. Games SHALL supply only `title`, `equipTabLabel`, class names, the two tab bodies, and an optional `equipFooterExtra` node, which the shell SHALL render before "Done" only while the Equip tab is active. Games SHALL NOT hand-write the modal/tab/footer scaffold.

#### Scenario: Shell owns the two-tab structure

- **WHEN** any game's equipment editor modal renders
- **THEN** the tab bar, active-tab switching, body wrapper, and Done footer come from `EquipmentEditorShell`, with the game contributing only its tab contents and labels

#### Scenario: Footer extra only on the Equip tab

- **WHEN** a game supplies `equipFooterExtra` (e.g. the N2E "Un-equip Cartridge" button)
- **THEN** it renders before the "Done" action while the Equip tab is active and is absent on the Build Preferences tab

#### Scenario: Inactive tab unmounted

- **WHEN** the user switches tabs
- **THEN** the previously active tab's content is unmounted, matching the pre-shell conditional-render semantics

## MODIFIED Requirements

### Requirement: Unified all-slots editor modal

Each game SHALL provide exactly one equipment editor modal per tracked entity, covering all of the game's equipment slots in a single Equip tab (vertical slot cards using the shared `.equip-slot-card` / `.equip-slot-header` classes from `controls.css`). The modal SHALL accept an optional anchor slot; when provided, the corresponding slot card is scrolled into view on mount via the shared `useScrollAnchor` hook (an optional-chained `scrollIntoView` call so non-DOM test environments do not throw). Games SHALL NOT hand-write the anchor-scroll effect. Per-slot editor modals SHALL NOT be used.

#### Scenario: All slots editable in one open

- **WHEN** the user opens the equipment editor modal
- **THEN** every equipment slot of the game is editable on the Equip tab without closing the modal

#### Scenario: Anchor slot scrolled into view

- **WHEN** the modal is opened with an anchor slot
- **THEN** that slot's card is scrolled into view on mount via `useScrollAnchor`; without an anchor, the tab opens at the top

#### Scenario: Slot cards use shared classes

- **WHEN** the Equip tab's slot sections are inspected
- **THEN** each is a `.equip-slot-card` with a `.equip-slot-header`, styled by `controls.css`
