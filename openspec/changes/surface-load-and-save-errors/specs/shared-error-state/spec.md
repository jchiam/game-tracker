## Purpose

Shared error presentation for every page-level failure surface in the tracker: the `ErrorState` component contract (warning glyph, cause-neutral message, optional Retry, alert semantics), the `.error-state` styling that makes an error visually distinct from both the dashed empty box and the borderless loading indicator, and its adoption across the roster render ladder, the parties tab, the party editor, and the route-level error boundary. An error must never read as "nothing here".

## ADDED Requirements

### Requirement: ErrorState renders an alert with an optional retry action

The system SHALL provide a shared `ErrorState` component that renders a warning glyph (hidden from assistive tech), a message, and — when a retry handler is supplied — a button that invokes it. The container SHALL carry `role="alert"` so the failure is announced immediately. The retry button SHALL use the canonical styled primary button classes (`btn primary-action`); its label defaults to "Retry" and is overridable.

#### Scenario: Message and retry rendered

- **WHEN** `ErrorState` renders with a message and an `onRetry` handler
- **THEN** the message text is visible inside an element with `role="alert"`, and a button labelled "Retry" invokes the handler when activated

#### Scenario: No retry handler

- **WHEN** `ErrorState` renders without an `onRetry` handler
- **THEN** no button is rendered; the glyph and message still render

#### Scenario: Custom action label

- **WHEN** `ErrorState` renders with `retryLabel="Reload"`
- **THEN** the button is labelled "Reload"

### Requirement: Error styling is visually distinct from empty and loading styling

The `.error-state` rule SHALL live in `src/styles/controls.css` beside `.loading-state`. It SHALL span the roster grid (`grid-column: 1 / -1`), center its content, and render a **solid** border and tinted fill derived from the existing danger tokens (`--color-ui-danger` at reduced opacity via `color-mix()`, `--color-ui-danger-bg`) with primary-weight text. It SHALL NOT use a dashed border, and no error surface SHALL render its message inside `.empty-state` or `.loading-state`.

#### Scenario: Error box is not the empty box

- **WHEN** any error surface is in its error phase
- **THEN** the rendered container has the `error-state` class, a solid danger-hued border, and does not have the `empty-state` or `loading-state` class

#### Scenario: Empty and loading keep their affordances

- **WHEN** a surface is genuinely empty or still loading
- **THEN** the dashed `.empty-state` box and the borderless `.loading-state` indicator render as before, unchanged by this capability

### Requirement: Error copy is cause-neutral

Load-failure messages SHALL name what could not be loaded and SHALL NOT attribute a cause the client cannot know. The roster ladder uses "Couldn't load your roster."; the parties tab uses "Couldn't load your {parties noun}."; the route boundary uses "Something went wrong loading this page."

#### Scenario: Roster load error copy

- **WHEN** the roster load fails
- **THEN** the error surface reads "Couldn't load your roster." with a Retry button, and does not mention the user's connection

#### Scenario: Parties load error copy

- **WHEN** the parties load fails for a game whose parties noun is "lineups"
- **THEN** the error surface reads "Couldn't load your lineups." with a Retry button

### Requirement: Roster render ladder error branch uses ErrorState

`RosterPageLayout`'s load-error branch SHALL render `ErrorState` with the roster copy and the layout's `onRetry` handler. Ladder order is unchanged: auth loading → initial load → load error → auth gate → empty → no match → cards. The add button stays disabled while in the error branch.

#### Scenario: Roster load failed

- **WHEN** `isLoadError` is true and auth has resolved
- **THEN** the roster grid area shows `ErrorState` reading "Couldn't load your roster." with a Retry button, and no `.empty-state` box is rendered

### Requirement: Parties tab shows an error rung before empty

`PartiesView` SHALL accept `isLoadError` (default `false`) and `onRetry`. When `isLoadError` is true and a session exists, the view SHALL render `ErrorState` — "Couldn't load your {nouns.partiesLower}." with a Retry that invokes `onRetry` — in place of the grid contents, after the loading check and before the empty-parties check, while keeping the header and create button visible.

#### Scenario: Parties load failed

- **WHEN** a signed-in user opens the parties tab after the parties load rejected
- **THEN** the tab shows the error surface, not the "No {parties} configured yet" empty message

#### Scenario: Parties retry

- **WHEN** the user activates Retry on the parties error surface
- **THEN** the view's `onRetry` handler is invoked once

#### Scenario: Loaded and genuinely empty

- **WHEN** the parties load completed without error and the user has no parties
- **THEN** the dashed empty-parties message renders as before

### Requirement: Party editor stays open on save failure

When a party save resolves without a party id, `PartiesView` SHALL keep the editor modal open with the user's entries intact. The modal closes only after a save that returns a party id.

#### Scenario: Save failed

- **WHEN** the user saves a party and the save resolves with no party id
- **THEN** the editor modal remains open with the entered name, tier, notes, and members unchanged

#### Scenario: Save succeeded

- **WHEN** the save resolves with a party id
- **THEN** the editor modal closes

### Requirement: Route-level error boundary replaces the blank page

The app SHALL wrap the lazy route `Suspense` in an error boundary. When a route element throws during render or chunk load, the boundary SHALL render `ErrorState` reading "Something went wrong loading this page." with a "Reload" action that reloads the document. The navbar remains rendered above it.

#### Scenario: Route chunk fails to load

- **WHEN** a lazily-loaded game page's chunk request fails
- **THEN** the page shows the error surface with a Reload button instead of a blank screen

#### Scenario: Reload activated

- **WHEN** the user activates Reload on the route error surface
- **THEN** the document is reloaded

### Requirement: ErrorState is documented in Storybook

The component SHALL have a colocated `ErrorState.stories.tsx` demonstrating the message, the retry variant, the no-retry variant, and a custom action label via the Controls addon. The `RosterPageLayout` and `PartiesView` stories SHALL include an error variant.

#### Scenario: Story exists

- **WHEN** Storybook is browsed
- **THEN** an `ErrorState` story renders the component with editable `message` and `retryLabel` controls, and the roster layout and parties view stories each have an error variant
