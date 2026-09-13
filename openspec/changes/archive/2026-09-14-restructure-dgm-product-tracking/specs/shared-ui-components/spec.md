## ADDED Requirements

### Requirement: TabbedEditorShell provides the N-tab editor modal scaffold

`src/components/TabbedEditorShell.tsx` SHALL accept `title`, `tabs` (ordered `{ id, label, content, footerExtra?, disabled? }[]`, at least one), optional `initialTab` (defaults to the first enabled tab), optional `className`, `bodyClassName`, and `onClose`. It SHALL own the `Modal` chrome, a `.modal-tabs` bar with one `.tab-btn` per tab (`active` on the current one; a disabled tab renders its button `disabled` and never becomes active), the active-tab state (only the active tab's `content` renders), the top-scroll of the body on tab change (skipped on the first render), a body div classed `modal-body {bodyClassName}` kept outside the tab bar, and a footer rendering the active tab's `footerExtra` (when present) before a `btn primary-action` "Done" button that calls `onClose`. `EquipmentEditorShell` SHALL be a two-tab adapter over it with its existing props unchanged.

#### Scenario: Only the active tab renders

- **WHEN** the shell is rendered with three tabs and the second is clicked
- **THEN** the second tab's content is in the document and the first and third are not, and the second `.tab-btn` carries `active`

#### Scenario: Initial tab honoured

- **WHEN** the shell is rendered with `initialTab` naming the third tab
- **THEN** the third tab's content renders first

#### Scenario: Disabled tab cannot activate

- **WHEN** a tab is `disabled` and its button is clicked
- **THEN** the active tab does not change and the button is `disabled`

#### Scenario: Equipment editor unchanged

- **WHEN** an existing game renders `EquipmentEditorShell` with `equipTabLabel`, `equipContent`, `preferencesContent`, and `equipFooterExtra`
- **THEN** the rendered tab bar, footer, and body classes are identical to the previous implementation
