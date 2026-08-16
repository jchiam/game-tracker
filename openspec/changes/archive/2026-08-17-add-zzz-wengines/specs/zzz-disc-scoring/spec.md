## MODIFIED Requirements

### Requirement: Score badge on agent card

The agent card SHALL render the blended build score (disc score + W-Engine preference-rank term, see zzz-build-scoring) via the shared `ScoreBadge` in the card header extra slot with the grade derived from the shared grade bands (S≥90, A≥70, B≥50, C≥30, else D), and pass the score as the card's temper score. The disc score itself SHALL remain computed as specified here and reach the badge only through the blend.

#### Scenario: Badge grade

- **WHEN** an agent's build score computes to 72
- **THEN** the header badge renders grade A with the score value

#### Scenario: Blend pass-through without engine preferences

- **WHEN** an agent has no W-Engine preferences and a disc score of 72
- **THEN** the badge shows exactly the disc score 72
