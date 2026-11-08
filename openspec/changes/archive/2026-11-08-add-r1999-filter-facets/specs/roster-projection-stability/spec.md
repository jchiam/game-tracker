## MODIFIED Requirements

### Requirement: Held-card affordance and exit animation

A card whose live data no longer matches an active predicate filter SHALL be visually marked as held: dimmed, with a ghost tag naming the filter it no longer matches (e.g. "no longer matches Resonance · In progress"). On release, an evicted card SHALL exit with a fade/collapse animation. All motion SHALL honour the global `prefers-reduced-motion` kill switch.

#### Scenario: Held card is marked

- **WHEN** a card becomes held under an active filter chip
- **THEN** the card dims and shows a ghost tag naming the no-longer-matched filter

#### Scenario: Held card returns to normal when matching again

- **WHEN** further edits make a held card's live data match the active predicate again
- **THEN** the dim and ghost tag are removed and the card is a normal member (no release needed)

#### Scenario: Reduced motion suppresses exit animation

- **WHEN** the user agent reports `prefers-reduced-motion: reduce` and a held card is released
- **THEN** the card is removed without animation
