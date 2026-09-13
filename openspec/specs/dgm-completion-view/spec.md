# dgm-completion-view Specification

## Purpose

TBD - created by archiving change add-collectibles-home-modality. Update Purpose after archive.

## Requirements

### Requirement: Completion view derives per-line progress from the collection

`CompletionView` (`src/pages/digimon/components/CompletionView.tsx`) SHALL render, from `trackedDevices` and `ALL_DEVICES` alone, an overall row followed by one row per `DGM_LINES` entry in that order. Each row SHALL show the line name, `owned / total`, the integer percentage, and a `.completion-bar` whose `.completion-bar-fill` width equals that percentage and uses the shared progress gradient. **Owned** means a tracked device with `status === 'owned'`; wishlist devices SHALL NOT count. `total` is the catalog count for the line. The view SHALL NOT fetch or persist anything.

#### Scenario: Owned counts per line

- **WHEN** the catalog has 5 "Pendulum" devices and the user tracks 2 as owned and 1 as wishlist
- **THEN** the Pendulum row reads `2 / 5` and `40%`, with fill width `40%`

#### Scenario: Overall row

- **WHEN** the catalog has 40 devices and the user owns 10
- **THEN** the overall row reads `10 / 40` and `25%`

#### Scenario: Zero owned

- **WHEN** the user owns nothing in a line
- **THEN** that row still renders with `0 / total`, `0%`, and an empty fill

### Requirement: Completion view follows the shared load ladder

`CompletionView` SHALL receive the device roster's `session`, `isAuthLoading`, `isInitialLoad`, `isLoadError`, and `onRetry`, and SHALL render `LoadingState` while auth or the initial load is in flight, `ErrorState` with retry on load error, `AuthGate` when signed out, and the completion rows otherwise — never loading or error text inside `.empty-state`.

#### Scenario: Load error

- **WHEN** the roster load failed
- **THEN** the view renders an `ErrorState` (`role="alert"`) whose Retry calls `onRetry`

#### Scenario: Signed out

- **WHEN** there is no session
- **THEN** the view renders `AuthGate`
