# Delta: shared-equipment-scoring — achievable-stat-scoring

## MODIFIED Requirements

### Requirement: Sub-term denominator

The system SHALL score each slot's sub match against the best _legal_ item, not a fixed constant. For an occupied slot with a non-empty sub-preference chain, the achievable sum SHALL be: the game's substat pool, minus the slot's occupied main stat(s) (the equipped main, or the game-defined fixed main(s) including dual fixed mains), each distinct remaining pool stat scored via `bestMatch` against the sub-preference chain, and the top 4 match scores summed. The slot's sub match SHALL be `min(equipped sum, achievable) / achievable`, where the equipped sum is the sum of the best preference match per equipped sub stat. Partial matches count identically in the equipped sum and the achievable sum. An occupied slot with an empty sub-preference chain SHALL score 1.0 (don't-care: nothing preferred means any subs are as good as perfect). An occupied slot whose achievable sum is 0 despite a non-empty chain SHALL score 1.0 (a perfect legal item also achieves nothing there). An empty slot SHALL score 0. The per-slot sub matches SHALL be averaged over all of the game's slots.

#### Scenario: All achievable subs equipped is full marks

- **WHEN** the sub-preference chain is `[HP]` (flat), the substat pool contains `HP` (match 1.0) and `HP%` (match 1.0) and otherwise unrelated stats, and the equipped subs are `[HP, HP%]`
- **THEN** the achievable sum is 2.0, the equipped sum is 2.0, and the slot's sub match is 1.0

#### Scenario: Occupied main stat shrinks the achievable sum

- **WHEN** the slot's equipped main stat is `HP%`, the sub-preference chain is `[HP]`, and the equipped subs are `[HP]`
- **THEN** `HP%` is excluded from the pool, the achievable sum is 1.0, and the slot's sub match is 1.0

#### Scenario: Partial matches count on both sides

- **WHEN** the sub-preference chain is `[crit-rate]`, making the achievable sum 1.5 (crit-rate 1.0 + cross-crit crit-mult 0.5)
- **THEN** equipping only crit-rate scores 1.0/1.5 ≈ 0.67, equipping only crit-mult scores 0.5/1.5 ≈ 0.33, and equipping both scores 1.0

#### Scenario: Empty sub chain is don't-care on an occupied slot

- **WHEN** an occupied slot is scored and the sub-preference chain is empty
- **THEN** that slot's sub match is 1.0 regardless of its equipped subs

#### Scenario: Achievable-zero guard

- **WHEN** the sub-preference chain is non-empty but no stat in the main-excluded pool has a positive match against it
- **THEN** that occupied slot's sub match is 1.0

#### Scenario: Empty slot scores zero

- **WHEN** a slot holds no equipped item
- **THEN** that slot's sub match is 0, diluting the average

#### Scenario: Equipped sum is clamped to the achievable sum

- **WHEN** the equipped sub matches sum to more than the achievable sum (e.g. duplicate substat rows entered before UI guards)
- **THEN** the slot's sub match is capped at 1.0

### Requirement: Main-term averaging over slots

The system SHALL compute the main term as the average, over all of the game's equipment slots, of each slot's main match: an empty slot SHALL score 0; an occupied slot with a game-defined fixed main SHALL score 1.0; an occupied slot with an empty main-preference chain SHALL score 1.0 (don't-care: no preference expressed means any main is as good as perfect); an occupied slot with a non-empty chain SHALL score the best preference match against the equipped main stat, and 0 when the item has no main stat entered.

#### Scenario: Empty slot dilutes the term

- **WHEN** a slot holds no equipped item
- **THEN** that slot contributes 0 to the main-term average

#### Scenario: Fixed-main slot

- **WHEN** a slot has a game-defined fixed main and holds an item
- **THEN** that slot's main match is 1.0

#### Scenario: Empty main chain is don't-care on an occupied slot

- **WHEN** a variable-main slot holds an item and its main-preference chain is empty
- **THEN** that slot's main match is 1.0 regardless of the equipped main

#### Scenario: Chain set but main not entered

- **WHEN** a variable-main slot holds an item with no main stat entered and its main-preference chain is non-empty
- **THEN** that slot's main match is 0

### Requirement: Insufficient-data sentinel

The system SHALL return `-1` for any game's equipment score when the entity has no preferences at all or no equipment at all. Absent individual preference fields SHALL NOT void the whole score: an absent set preference zeroes the set term, while absent main/sub preference chains are don't-care (occupied slots score 1.0 for the corresponding term, per the main- and sub-term requirements).

#### Scenario: No preferences

- **WHEN** an entity has no set, main, or sub preferences
- **THEN** the score is `-1` regardless of equipment

#### Scenario: No equipment

- **WHEN** an entity has no equipped items in any slot
- **THEN** the score is `-1` regardless of preferences

#### Scenario: Partial preferences score numerically

- **WHEN** an entity has at least one preference and one equipped item, but some preference fields are absent
- **THEN** a numeric 0–100 score is returned, not `-1`: an absent set preference zeroes the set term and absent main/sub chains score don't-care on occupied slots
