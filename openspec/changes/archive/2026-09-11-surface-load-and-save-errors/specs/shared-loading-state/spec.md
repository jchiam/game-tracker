## MODIFIED Requirements

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
