## ADDED Requirements

### Requirement: Shared stat-matcher factory

The system SHALL provide a single `makeStatMatcher(shapeMap)` factory in the scoring core that binds a game's stat-id vocabulary map to the shared match rules and returns `{ getStatMatchScore, bestMatch }`:

- `getStatMatchScore(preferredStat, equippedStat)` SHALL resolve both ids through the vocabulary map (an unmapped id falls back to the identity shape `{ base: id, isPercent: false }`, so non-participants can only exact-match) and delegate to the shared shape matcher.
- `bestMatch(prefs, equipped)` SHALL return the highest `getStatMatchScore` of any preference in the chain against the equipped stat, and `0` for an empty chain.

The factory SHALL be the only implementation of vocabulary-bound matching: game scoring adapters SHALL supply only their vocabulary map and SHALL NOT hand-write the id-resolution or best-match mechanics.

#### Scenario: Adapter supplies only vocabulary

- **WHEN** a game adapter calls `makeStatMatcher` with its stat-shape map
- **THEN** the returned `getStatMatchScore` and `bestMatch` apply the shared match rules over that vocabulary with no game-side matching code

#### Scenario: Unmapped id exact-matches only

- **WHEN** a stat id absent from the vocabulary map is scored against itself and against a different unmapped id
- **THEN** the self-match scores 1.0 and the cross-match scores 0.0

#### Scenario: Best match over a chain

- **WHEN** a preference chain contains one exact match (1.0) and one partial match (0.5) for the equipped stat
- **THEN** `bestMatch` returns 1.0
