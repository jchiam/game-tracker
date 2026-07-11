## MODIFIED Requirements

### Requirement: Target Build card readout

Every equipment-tracking game's card edit body SHALL render a read-only Target Build display of the entity's build preferences (set preference where applicable, main-stat chains, substat chain, comments) inside a `ProgressSection`, shown only when preferences exist. Every preference-chain row (per-slot main-stat chains and the substat chain) SHALL render through the shared `PreferenceChainReadout` component; cards SHALL NOT hand-write chain badge/operator markup. Set rows and comments rows remain per-game.

#### Scenario: Readout rendered when preferences exist

- **WHEN** a tracked entity has any build preference set and its card is in editing state
- **THEN** a "Target Build" `ProgressSection` renders the preference chains read-only (stat badges with operator badges)

#### Scenario: Readout hidden without preferences

- **WHEN** a tracked entity has no build preferences
- **THEN** no Target Build section renders

#### Scenario: Chain rows render through the shared readout

- **WHEN** a game card renders its Target Build main-stat or substat chain rows
- **THEN** each row is a `PreferenceChainReadout` with the game's row label and chain (and, where the chain stores stat ids, the game's stat-label resolver)
