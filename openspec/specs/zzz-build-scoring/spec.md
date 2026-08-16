# zzz-build-scoring Specification

## Purpose

Overall build score for Zenless Zone Zero agents — blends the existing disc score with a W-Engine preference-rank term so the card score reflects the whole target build, not discs alone.

## Requirements

### Requirement: Blended agent build score

The system SHALL compute an overall ZZZ build score in `src/utils/zzzBuildScore.ts` blending the unchanged disc score with a W-Engine preference-rank term: when both sides are active, `0.25 × engineTerm + 0.75 × (discScore / 100)`, scaled to 0–100. A lone active side takes the whole score (active-side renormalization): an empty W-Engine preference list is don't-care (disc score passes through unchanged), and a `-1` disc score drops the disc side (engine term alone). The function SHALL return `-1` only when both sides are inactive. The disc scorer (`discScoring.ts`) SHALL NOT be modified by the blend.

#### Scenario: Both sides active

- **WHEN** an agent has a non-empty W-Engine preference list and a disc score of 80, with the ranked #1 engine equipped
- **THEN** the build score is `(0.25 × 1.0 + 0.75 × 0.8) × 100 = 85`

#### Scenario: Empty preference list is don't-care

- **WHEN** an agent has no W-Engine preferences and a disc score of 72
- **THEN** the build score is exactly 72

#### Scenario: Engine side alone

- **WHEN** an agent has W-Engine preferences but the disc score is `-1`
- **THEN** the build score is the engine term × 100

#### Scenario: Both sides inactive

- **WHEN** an agent has no W-Engine preferences and a `-1` disc score
- **THEN** the build score is `-1`

### Requirement: Engine preference-rank term

The engine term SHALL be a fixed-step rank decay over the agent's ranked W-Engine preference list: rank #1 scores 1.0, each rank down subtracts 0.25, floored at 0.25 so any listed engine stays strictly above off-build. An unequipped engine or an equipped engine absent from the list (off-build) SHALL score 0. Engine level and Phase SHALL never affect the score.

#### Scenario: Rank decay

- **WHEN** the equipped engine is ranked #2 of 4
- **THEN** the engine term is 0.75

#### Scenario: Floor holds deep ranks

- **WHEN** the equipped engine is ranked #6
- **THEN** the engine term is 0.25, not `1 − 0.25 × 5`

#### Scenario: Off-build engine

- **WHEN** the equipped engine is not in the preference list
- **THEN** the engine term is 0

#### Scenario: Level and Phase are display-only

- **WHEN** two agents differ only in engine level and Phase
- **THEN** their build scores are identical
