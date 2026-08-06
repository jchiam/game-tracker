## ADDED Requirements

### Requirement: Modules configured flag

The system SHALL track a single boolean `modulesConfigured` per character, defaulting to `false`
on add, representing whether the character's modules (a distinct N2E progression system, part of the
character's Console, tracked here as a done/not-done flag only — module contents are not modeled)
have been fully configured. The flag is toggled from the character card and persisted through the
debounced save queue via the shared field updater.

#### Scenario: Default modules-configured state

- **WHEN** a character is added to the roster
- **THEN** `modulesConfigured` is `false`

#### Scenario: Modules marked configured

- **WHEN** user toggles the Modules Configured control to true
- **THEN** `modulesConfigured` is set to true in local state immediately and queued for DB write
  via debounced save

#### Scenario: Modules marked not configured

- **WHEN** user toggles the Modules Configured control to false
- **THEN** `modulesConfigured` is set to false in local state immediately and queued for DB write

#### Scenario: Flag shown in card summary

- **WHEN** a character card renders its summary row
- **THEN** a Modules chip shows `✓` when `modulesConfigured` is true and `✗` when false

### Requirement: N2E Console group

The character card edit body SHALL render a labeled **Console** group — the N2E housing that
comprises the equipped cartridge and the character's modules — as a single container positioned
directly **after** the Arc section. The Console group SHALL carry a visible "Console" heading and
visually enclose its sub-sections, which SHALL appear in this order:

1. **Cartridge** — the clickable cartridge slot (opens `CartridgeEditorModal`).
2. **Modules** — the Modules Configured toggle.
3. **Target Build** — the read-only cartridge-preference readout, shown only when preferences exist.

The Console container SHALL be the shared, visually neutral **section-group** primitive
(`.card-section-group` + `.card-section-group-header` in `card.css`; see `shared-card-base`) with
its heading set to "Console" — not a game-local wrapper and not accent-tinted. Modules SHALL NOT
render as a standalone section outside the Console group.

#### Scenario: Console group renders after Arc

- **WHEN** the card is expanded (editing state)
- **THEN** a Console group with a "Console" heading renders immediately after the Arc section

#### Scenario: Sub-section order within Console

- **WHEN** the Console group renders
- **THEN** its sub-sections appear in the order Cartridge, Modules, Target Build

#### Scenario: Modules lives only inside Console

- **WHEN** the card edit body renders
- **THEN** the Modules toggle appears inside the Console group and nowhere else in the edit body

#### Scenario: Target Build inside Console is conditional

- **WHEN** the character has no cartridge preference set
- **THEN** the Console group renders Cartridge and Modules but omits the Target Build sub-section

## MODIFIED Requirements

### Requirement: N2E card edit body contains cartridge slot and Target Build

The cartridge slot section (clickable, opens `CartridgeEditorModal`) and the Target Build display
SHALL be rendered inside `.game-card-edit-body-inner`, visible only when the card is in editing
state, and SHALL both live inside the **Console** group (Cartridge is the group's first sub-section;
Target Build is its last). Both SHALL be wrapped in the shared `ProgressSection` ("Cartridge" and
"Target Build" respectively), matching the HSR card; the custom `.cartridge-slot-section` and
`.cartridge-target-build` section wrappers are replaced.

#### Scenario: Cartridge slot in edit body

- **WHEN** the card is expanded (editing state)
- **THEN** a "Cartridge" `ProgressSection` contains the clickable cartridge slot, which opens
  `CartridgeEditorModal`, as the first sub-section of the Console group

#### Scenario: Target Build in edit body

- **WHEN** the card is expanded and the character has any cartridge preference set
- **THEN** a "Target Build" `ProgressSection` renders the full preferences (Set, Main, Subs,
  comments) read-only, as the last sub-section of the Console group
