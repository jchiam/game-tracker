## ADDED Requirements

### Requirement: Build preferences — set preferences

The system SHALL track a preferred relic set and a preferred planar set on a character's build preferences, each a single nullable set id (not an ordered chain). The Build Preferences editor SHALL expose them as two `Select` controls. These preferences feed the relic-scoring set term (see hsr-relic-scoring "Relic and planar set term").

#### Scenario: Set preferences saved

- **WHEN** the user chooses a preferred relic set and a preferred planar set
- **THEN** each is persisted as a single scalar set id on the character's build preferences

#### Scenario: No set preference

- **WHEN** the user leaves a preferred set unset
- **THEN** its value is null and its half of the relic-scoring set term scores 0

#### Scenario: Set preference controls use the shared Select

- **WHEN** the Build Preferences editor renders the set-preference inputs
- **THEN** each is a shared `Select` control, not a raw `<select>`
