## MODIFIED Requirements

### Requirement: Retry on load failure

The system SHALL allow the user to retry a failed roster load without reloading the page. The roster page's Retry SHALL also retry the parties load, so one action recovers both data sets after a shared outage.

#### Scenario: Retry triggered

- **WHEN** user triggers a retry after a load error
- **THEN** `isLoadError` resets to false, `isInitialLoad` resets to true, and the DB fetch is attempted again

#### Scenario: Retry reaches parties

- **WHEN** user triggers the roster Retry
- **THEN** the parties load is retried as well, clearing any parties load error
