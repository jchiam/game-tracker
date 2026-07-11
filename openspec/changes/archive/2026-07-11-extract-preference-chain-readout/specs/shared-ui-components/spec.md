## ADDED Requirements

### Requirement: PreferenceChainReadout renders a read-only preference-chain row

The system SHALL provide a shared presentational `PreferenceChainReadout` component (`src/components/`) — the read-only twin of `PreferenceChain` — that renders one `.pref-display-row`: a `.pref-display-label` with the supplied `label`, then a `.pref-display-chain` containing, per chain entry, a `.pref-stat-badge` with the stat text and, when the entry has an operator, a `.pref-operator-badge` rendering `>=` as `≥` and any other operator verbatim.

- Stat text SHALL be resolved through an optional `formatStat` prop (`(stat: string) => string`); when omitted, the stored stat value renders as-is.
- An empty `chain` SHALL render nothing (`null`).
- The component SHALL be the only implementation of the chain-row readout: game cards SHALL pass `label`/`chain`/`formatStat` and SHALL NOT hand-write the badge/operator markup.

#### Scenario: Chain row with operators

- **WHEN** a chain `[{ stat: 'ATK%', operator: '>=' }, { stat: 'CRIT DMG' }]` is rendered with label "Subs"
- **THEN** the row shows the "Subs" label, an `ATK%` stat badge followed by a `≥` operator badge, and a `CRIT DMG` stat badge with no trailing operator badge

#### Scenario: Stat labels resolved via formatStat

- **WHEN** a chain stores stat ids and a `formatStat` resolver is supplied
- **THEN** each stat badge shows the resolved label, not the stored id

#### Scenario: Empty chain renders nothing

- **WHEN** `chain` is empty
- **THEN** the component renders no row
