# Delta — shared-equipment-editor

## MODIFIED Requirements

### Requirement: Unified all-slots editor modal

Each game SHALL provide exactly one equipment editor modal per tracked entity, covering all of the game's equipment slots in a single Equip tab (vertical slot cards using the shared `.equip-slot-card` / `.equip-slot-header` classes from `controls.css`). The modal SHALL accept an optional anchor slot; when provided, the corresponding slot card is scrolled into view on initial modal open via the shared `useScrollAnchor` hook (an optional-chained `scrollIntoView` call so non-DOM test environments do not throw). The anchor scroll SHALL apply only when the modal opens; navigating back onto the Equip tab via a tab switch SHALL land at the top of the tab. Games SHALL NOT hand-write the anchor-scroll effect. Per-slot editor modals SHALL NOT be used.

#### Scenario: All slots editable in one open

- **WHEN** the user opens the equipment editor modal
- **THEN** every equipment slot of the game is editable on the Equip tab without closing the modal

#### Scenario: Anchor slot scrolled into view

- **WHEN** the modal is opened with an anchor slot
- **THEN** that slot's card is scrolled into view on mount via `useScrollAnchor`; without an anchor, the tab opens at the top

#### Scenario: Tab-return lands at the top, not the anchor

- **WHEN** the modal was opened with an anchor slot and the user switches to Build Preferences and back to the Equip tab
- **THEN** the Equip tab is scrolled to the top, not to the anchor slot

#### Scenario: Slot cards use shared classes

- **WHEN** the Equip tab's slot sections are inspected
- **THEN** each is a `.equip-slot-card` with a `.equip-slot-header`, styled by `controls.css`

### Requirement: Equipment Editor Shell composition

Every game's equipment editor modal SHALL be composed from the shared `EquipmentEditorShell` component (`src/components/`), which SHALL own the modal chrome, the two-tab scaffold (the game's equip tab label and the constant "Build Preferences" label via `.modal-tabs`/`.tab-btn`), the active-tab state (only the active tab's content rendered), the body wrapper, and the footer "Done" action. The shell SHALL also own scroll reset on tab navigation: whenever the active tab changes after initial mount, the body wrapper SHALL scroll to the top (an optional-chained `scrollTo` call so non-DOM test environments do not throw); the reset SHALL NOT fire on initial mount, so an anchor-slot scroll on modal open is preserved. Games SHALL supply only `title`, `equipTabLabel`, class names, the two tab bodies, and an optional `equipFooterExtra` node, which the shell SHALL render before "Done" only while the Equip tab is active. Games SHALL NOT hand-write the modal/tab/footer scaffold or the tab-switch scroll reset.

#### Scenario: Shell owns the two-tab structure

- **WHEN** any game's equipment editor modal renders
- **THEN** the tab bar, active-tab switching, body wrapper, and Done footer come from `EquipmentEditorShell`, with the game contributing only its tab contents and labels

#### Scenario: Tab switch resets scroll to top

- **WHEN** the user navigates onto either tab from the other, in any game
- **THEN** the body wrapper is scrolled to the top

#### Scenario: No reset on initial mount

- **WHEN** the modal first mounts
- **THEN** the shell does not force the scroll position, so an anchor-slot scroll on open is preserved

#### Scenario: Footer extra only on the Equip tab

- **WHEN** a game supplies `equipFooterExtra` (e.g. the N2E "Un-equip Cartridge" button)
- **THEN** it renders before the "Done" action while the Equip tab is active and is absent on the Build Preferences tab

#### Scenario: Inactive tab unmounted

- **WHEN** the user switches tabs
- **THEN** the previously active tab's content is unmounted, matching the pre-shell conditional-render semantics
