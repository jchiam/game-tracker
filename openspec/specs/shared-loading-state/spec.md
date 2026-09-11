# shared-loading-state Specification

## Purpose

Shared `LoadingState` component and its adoption across every loading surface: the roster render ladder, the parties tab initial load, the selection page auth check, and the route-level Suspense fallback. Establishes the visual distinction between "system working" (animated, borderless) and "nothing here" (static, dashed `.empty-state`).

## Requirements

### Requirement: LoadingState renders an animated status indicator

The system SHALL provide a shared `LoadingState` component (`src/components/LoadingState.tsx`) that renders a `.loading-state` container holding three `.spinner-dot` elements (animated by the existing `spinner-bounce` keyframes) above a text label supplied via a required `label` prop. The container SHALL carry `role="status"` and `aria-live="polite"`; the dot row SHALL be `aria-hidden`. The component SHALL introduce no new keyframes and no new design tokens — it composes the existing `.spinner-dot` primitive and existing spacing/color tokens.

#### Scenario: Renders label and spinner

- **WHEN** `<LoadingState label="Loading your roster…" />` renders
- **THEN** the label text is visible, three `.spinner-dot` elements render in an `aria-hidden` row, and the container exposes `role="status"` with `aria-live="polite"`

#### Scenario: Reduced motion

- **WHEN** the user has `prefers-reduced-motion: reduce`
- **THEN** the global animation kill switch freezes the dots after one imperceptible iteration and the text label alone still communicates the loading state

### Requirement: Loading styling is visually distinct from empty styling

The `.loading-state` rule SHALL live in `src/styles/controls.css` beside `.spinner-dot`. It SHALL span the roster grid (`grid-column: 1 / -1`), center its content, and render **without** a dashed border or box background — the dashed-border `.empty-state` affordance is reserved for true empty and no-match states. No loading surface SHALL render its loading message inside `.empty-state`.

#### Scenario: No dashed box while loading

- **WHEN** any loading surface is in its loading phase
- **THEN** the rendered loading indicator has no dashed border and does not use the `.empty-state` class

#### Scenario: Empty state keeps its affordance

- **WHEN** a signed-in user has an empty roster or a search with no matches
- **THEN** the dashed `.empty-state` box renders as before, unchanged by this capability

### Requirement: Roster render ladder loading branches use LoadingState

`RosterPageLayout`'s auth-loading and initial-load branches SHALL render `LoadingState` instead of `.empty-state` text: `label="Checking sign-in…"` while auth is loading, and `label="Loading your roster…"` while the initial DB load is in flight for a signed-in session. Ladder order and the error / auth-gate / empty / no-match branches are unchanged.

#### Scenario: Auth in flight

- **WHEN** `isAuthLoading` is true
- **THEN** the roster grid area shows `LoadingState` with "Checking sign-in…"

#### Scenario: Initial roster load in flight

- **WHEN** auth has resolved with a session and `isInitialLoad` is true
- **THEN** the roster grid area shows `LoadingState` with "Loading your roster…"

### Requirement: Parties tab shows loading before empty

`PartiesView` SHALL accept an optional `isInitialLoad` boolean (default `false`). When true (and a session exists), the view SHALL render `LoadingState` — labelled `Loading your {nouns.partiesLower}…` — in place of the parties grid contents, before the error and empty-parties checks, while keeping the header and create button visible. Each game's `PartiesTab` adapter SHALL forward the **party hook's** `isInitialLoad` flag, not the roster hook's, so the parties tab reflects the parties fetch.

#### Scenario: Initial load no longer shows false empty

- **WHEN** a signed-in user opens the Lineups tab while the parties DB load is in flight
- **THEN** the tab shows the loading indicator, not the "No {parties} configured yet" empty message

#### Scenario: Roster loaded before parties

- **WHEN** the roster fetch has settled but the parties fetch is still in flight
- **THEN** the parties tab still shows the loading indicator

#### Scenario: Loaded and genuinely empty

- **WHEN** the parties load has completed and the user has no parties
- **THEN** the empty-parties `.empty-state` message renders as before

### Requirement: Selection page auth check uses LoadingState

`SelectionPage`'s auth-loading branch SHALL render `LoadingState` with `label="Checking sign-in…"` — the same copy as the roster ladder's auth branch — instead of static text.

#### Scenario: Selection page while auth resolves

- **WHEN** the selection page renders with `isAuthLoading` true
- **THEN** it shows `LoadingState` with "Checking sign-in…"

### Requirement: Route Suspense fallback is a visible loader

The route-level `Suspense` in `App.tsx` SHALL use `<LoadingState label="Loading…" />` as its fallback instead of `null`.

#### Scenario: Lazy route chunk loading

- **WHEN** a lazily-loaded game page's chunk is still downloading
- **THEN** the page shows the loading indicator rather than a blank screen

### Requirement: LoadingState is documented in Storybook

The component SHALL have a colocated `LoadingState.stories.tsx` demonstrating representative labels via the Controls addon.

#### Scenario: Story exists

- **WHEN** Storybook is browsed
- **THEN** a `LoadingState` story renders the component with an editable `label` control
