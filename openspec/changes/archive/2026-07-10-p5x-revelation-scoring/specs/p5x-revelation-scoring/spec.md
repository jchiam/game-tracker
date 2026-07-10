## ADDED Requirements

### Requirement: Overall revelation score range

The system SHALL calculate an overall revelation score for a Thief in the range 0–100,
representing how well the five equipped revelation cards match the Thief's
`revelationPreferences` across three terms — emergent set composition, main stat, and sub
stats. The score is capped at 100 and floored at 0. A score of `-1` indicates insufficient
data (see "Insufficient-data sentinel").

#### Scenario: Perfect score

- **WHEN** the equipped Heavens cards form the preferred Heavens set at 4pc, the equipped Space card matches the preferred Space set, every variable main stat matches its preference, and every sub stat matches
- **THEN** score is 100

#### Scenario: Score floored and capped

- **WHEN** term contributions are computed
- **THEN** the returned score is never below 0 nor above 100

### Requirement: Insufficient-data sentinel

The system SHALL return `-1` (insufficient data) when the Thief has no revelation preferences
at all, or when no revelation cards are equipped. A Thief has preferences when any of
`heavensSetId`, `spaceSetId`, a Moon/Star/Sky main-stat chain, or the sub-stat chain is
non-empty. A Thief has cards when at least one of the five revelation slots holds a card.

#### Scenario: No preferences at all

- **WHEN** `heavensSetId` and `spaceSetId` are null and every main-stat and sub-stat preference chain is empty
- **THEN** score is `-1` regardless of equipped cards

#### Scenario: No cards equipped

- **WHEN** all five revelation slots are null
- **THEN** score is `-1` regardless of preferences

#### Scenario: Some preferences and at least one card

- **WHEN** the Thief has at least one preference and at least one equipped card
- **THEN** a numeric score in 0–100 is computed (not `-1`)

### Requirement: Score composition weights

The system SHALL compute the revelation score as a weighted combination of the three terms:
`setTerm × 0.35 + mainTerm × 0.30 + subTerm × 0.35`, each term normalized to 0–1, then scaled
to 0–100. These weights match N2E's cartridge-score weights.

#### Scenario: Weight application — all terms

- **WHEN** `setTerm` is 1.0, `mainTerm` is 1.0, and `subTerm` is 0.5
- **THEN** raw score is (1.0 × 0.35 + 1.0 × 0.30 + 0.5 × 0.35) × 100 = 82.5

#### Scenario: Wrong or absent set, perfect stats caps at 65

- **WHEN** `setTerm` is 0 but `mainTerm` and `subTerm` are both 1.0
- **THEN** score is (0 × 0.35 + 1.0 × 0.30 + 1.0 × 0.35) × 100 = 65

### Requirement: Set term scores emergent composition

The system SHALL compute the set term over the whole five-card hand as
`heavensMatch × 0.75 + spaceMatch × 0.25`, where the 0.75/0.25 split reflects four Heavens
cards against one Space card. The set term is never scored per-card.

#### Scenario: Both halves perfect

- **WHEN** `heavensMatch` is 1.0 and `spaceMatch` is 1.0
- **THEN** set term is 1.0

#### Scenario: Heavens satisfied, space unsatisfied

- **WHEN** `heavensMatch` is 1.0 and `spaceMatch` is 0
- **THEN** set term is 0.75

### Requirement: Heavens match is graded toward the preferred 4pc

The system SHALL score `heavensMatch` as `min(count of Heavens cards whose setId equals the
preferred heavensSetId, 4) / 4` — graded progress toward the preferred 4pc, so a third
matching card scores 0.75 even though in-game 2pc and 3pc grant the same bonus. When
`heavensSetId` is null, `heavensMatch` is 0.

#### Scenario: Four matching cards

- **WHEN** all four Heavens cards match the preferred Heavens set
- **THEN** `heavensMatch` is 1.0

#### Scenario: Two matching cards

- **WHEN** exactly two Heavens cards match the preferred Heavens set
- **THEN** `heavensMatch` is 0.5

#### Scenario: No Heavens preference set

- **WHEN** `heavensSetId` is null
- **THEN** `heavensMatch` is 0 (no credit)

### Requirement: Space match is gated on a Space preference

The system SHALL score `spaceMatch` as 1.0 only when a preferred Space set is set AND the
equipped Space card's setId equals it; otherwise 0. When `spaceSetId` is null, `spaceMatch` is
0 — the system SHALL NOT credit a null preference against a null equipped set via equality.

#### Scenario: Space card matches preference

- **WHEN** `spaceSetId` is set and the equipped Space card's setId equals it
- **THEN** `spaceMatch` is 1.0

#### Scenario: No Space preference and no Space card

- **WHEN** `spaceSetId` is null and no Space card is equipped
- **THEN** `spaceMatch` is 0 (never credited by null-equals-null)

#### Scenario: Space preference set but wrong card

- **WHEN** `spaceSetId` is set but the equipped Space card's setId differs (or no Space card)
- **THEN** `spaceMatch` is 0

### Requirement: Main-stat term averages per-slot matches over all five slots

The system SHALL compute `mainTerm` as the average over all five slots of each slot's main
match, so empty slots dilute the term. Sun and Space have fixed mains and SHALL score 1.0 when
a card is equipped in that slot. Moon, Star, and Sky score the best match among the Thief's
main-stat preference chain for that slot; an empty chain scores 0. An empty slot scores 0.

#### Scenario: All slots equipped with matching variable mains

- **WHEN** all five slots hold cards, and Moon/Star/Sky each match a preferred main stat
- **THEN** `mainTerm` is 1.0 (Sun and Space fixed at 1.0, the three variable slots at 1.0)

#### Scenario: Variable slots have empty preference chains

- **WHEN** all five slots hold cards but Moon/Star/Sky preference chains are all empty
- **THEN** `mainTerm` is (1.0 + 1.0 + 0 + 0 + 0) / 5 = 0.4 (only the fixed Sun and Space score)

#### Scenario: Empty slot dilutes the term

- **WHEN** a slot holds no card
- **THEN** that slot contributes 0 to the `mainTerm` average

### Requirement: Sub-stat term averages per-slot sub matches over all five slots

The system SHALL compute `subTerm` as the average over all five slots of each slot's sub
match. Each slot's sub match is the sum of the best preference match per equipped sub stat,
capped at 4 and divided by 4 — matching HSR's sub-score denominator. A slot with no card, no
equipped subs, or no sub preferences scores 0.

#### Scenario: All subs match across all slots

- **WHEN** every equipped card's sub stats all match a sub preference and each slot has four subs
- **THEN** each slot's sub match is 1.0 and `subTerm` is 1.0

#### Scenario: No sub preferences

- **WHEN** the sub-stat preference chain is empty
- **THEN** every slot's sub match is 0 and `subTerm` is 0

#### Scenario: Partial sub match in one slot

- **WHEN** one slot has two of four subs matching (each at 1.0) and the other slots are empty
- **THEN** that slot's sub match is 2/4 = 0.5 and it contributes 0.5/5 = 0.1 to `subTerm`

### Requirement: Partial preferences do not gate the score to insufficient data

The system SHALL compute a numeric score whenever any preference and any card exist, even if
some preference fields are absent — absent fields zero their own term (zero-and-cap) rather
than voiding the whole score. A stats-only Thief (no set preferences) with equipped cards
SHALL score normally with `setTerm` 0, not `-1`.

#### Scenario: Stat preferences present, set preferences absent

- **WHEN** `heavensSetId` and `spaceSetId` are null but main-stat/sub-stat chains are non-empty and cards are equipped
- **THEN** the score is computed with `setTerm` 0 (not `-1`)

#### Scenario: Heavens preference null, Space preference set

- **WHEN** `heavensSetId` is null and `spaceSetId` is set with a matching Space card
- **THEN** `heavensMatch` is 0 and `spaceMatch` is 1.0, giving `setTerm` 0.25

#### Scenario: Space preference null, Heavens preference set

- **WHEN** `spaceSetId` is null and `heavensSetId` is set with four matching Heavens cards
- **THEN** `spaceMatch` is 0 and `heavensMatch` is 1.0, giving `setTerm` 0.75
