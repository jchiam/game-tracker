## MODIFIED Requirements

### Requirement: Build-preference editor modal layout pattern

The system SHALL enforce a canonical layout pattern for all build-preference editor
modals (HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, P5X
`RevelationEditorModal`, and any future game equivalents). Each modal SHALL use the
shared `Modal` component with a `className` for the game-specific body selector,
render `.modal-tabs` with `.tab-btn` buttons for "Equip" and "Preferences" tabs
(class names and styling inherited from `Modal.css`), render a single
`*-editor-body` container (`relic-editor-body`, `revelation-editor-body`, etc.)
that is a flex column with `gap: var(--spacing-lg)`, `overflow-y: auto`,
`max-height: 50vh`, and `padding: var(--spacing-lg)`, and return each tab's content
as a React fragment (`<>…</>`) so its children land directly inside the body container.

The body's **direct children** SHALL provide uniform inter-field spacing solely via the body's
`gap` — no margin, padding, or border-bottom on the children. Each direct child SHALL be one of:
a `FormGroup` (a labeled control), a per-slot **grouping container** (a bordered slot card that
arranges that slot's own `FormGroup`s — used by multi-slot editors that render every slot in one
body), or a thin **state wrapper** around a single primitive (e.g. an `is-gated` `<div>`
around a `SubStatList`). Single-slot editors (N2E) render `FormGroup`s directly; multi-slot
editors (HSR, P5X) group per slot using the shared `.equip-slot-card` / `.equip-slot-header`
classes from `controls.css`. The per-game CSS file SHALL define ONLY the body layout rule and
its mobile overrides — all other styling (tabs, form-group label/control layout, select
surfaces, preference-chain rows, substat rows, the slot grouping card, the shared
`.readonly-stat`/`.readonly-stat-row` and `is-gated` treatments) SHALL be inherited from `Modal.css` and
`controls.css`. A mobile breakpoint (`max-width: 600px`) SHALL reduce gap and padding to
`var(--spacing-md)` and raise max-height to `60vh`.

#### Scenario: Body children provide inter-field spacing via gap

- **WHEN** a build-preference editor modal's body renders multiple direct children
- **THEN** spacing between them is provided solely by the body's `gap` — no margin, padding, or
  border-bottom rules on the children

#### Scenario: Single-slot editors render FormGroups directly

- **WHEN** a single-slot editor body (N2E cartridge) is inspected
- **THEN** its `FormGroup`s (`.form-group`) are direct children of the `*-editor-body` container,
  with no intermediate grouping element between the body and the form groups

#### Scenario: Multi-slot editors group per slot

- **WHEN** a multi-slot editor body (HSR relics, P5X revelations) is inspected
- **THEN** each slot is a `.equip-slot-card` grouping container that is a direct child of the
  body and holds that slot's labeled `FormGroup`s, and the body's `gap` spaces the slot cards

#### Scenario: Per-game CSS is minimal

- **WHEN** a build-preference editor modal's CSS file is reviewed
- **THEN** it contains only the body layout rule (flex-direction, gap, overflow-y, max-height,
  padding) and its mobile overrides — all other styling (tabs, form-group, selects,
  preference-chain rows, substat rows, the `.equip-slot-card` grouping card, the shared
  `.readonly-stat`/`.readonly-stat-row` and `is-gated` treatments) resolves from `Modal.css` and `controls.css`

#### Scenario: Tabs inherit from Modal.css

- **WHEN** a build-preference editor modal renders its tab row
- **THEN** it uses `.modal-tabs` and `.tab-btn` class names without any per-game tab CSS overrides
