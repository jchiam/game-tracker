## MODIFIED Requirements

### Requirement: Modal provides the canonical overlay shell

The shared `Modal` component SHALL render a `.modal-overlay` containing a `.modal-content`
(optionally extended by a `className`), with a `.modal-header` (title `<h2>` + `.close-btn`), the
body, and an optional `.modal-footer`. Clicking the overlay SHALL close the modal; mousedown
on the content SHALL NOT. Pressing Escape SHALL invoke `onEscPress` when provided, otherwise
`onClose`. Picker/editor modals SHALL build on `Modal` rather than re-implementing the overlay
shell.

The body SHALL be a slot owned by `Modal`: when a `bodyClassName` prop is provided, `Modal`
SHALL wrap `children` in a `<div>` carrying that class; when omitted, children render bare —
the explicit opt-out reserved for full-bleed layouts (e.g. the entity picker's search + list).
`Modal.css` SHALL provide a canonical `.modal-body` base rule owning body padding, column
layout, `overflow-y: auto`, and a `max-height`, so composers pass `bodyClassName="modal-body"`
(optionally extended with a per-modal modifier class for overrides). Dialogs SHALL NOT
hand-roll a body wrapper div inside `children` to replicate what the slot provides.

#### Scenario: Escape closes the modal

- **WHEN** the user presses Escape with no `onEscPress` supplied
- **THEN** `onClose` is invoked

#### Scenario: Overlay click vs content click

- **WHEN** the user mouses down on the `.modal-overlay` outside the content
- **THEN** `onClose` fires; **WHEN** the mousedown is on `.modal-content`, it does not

#### Scenario: Body slot wraps children

- **WHEN** a modal passes `bodyClassName="modal-body"`
- **THEN** its children render inside `.modal-content > .modal-body`, which provides padding and vertical scrolling

#### Scenario: Bare children remain for full-bleed layouts

- **WHEN** a modal omits `bodyClassName`
- **THEN** children render directly inside `.modal-content` with no injected wrapper

#### Scenario: Composers do not duplicate the wrapper

- **WHEN** the party editor or Light Cone preferences dialog render
- **THEN** their body padding/scroll comes from the `Modal` body slot, not from a wrapper div they render inside `children`; the equipment editor shell — whose tab bar must stay outside the scroll region — keeps its own body div but reuses the canonical `.modal-body` class rather than re-declaring the rule
