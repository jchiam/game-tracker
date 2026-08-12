## Why

HSR characters now track an equipped Light Cone and a ranked Light Cone preference list, but the card's score badge and the score sort still measure relics only — a character wearing an off-build cone can read S-grade. The score should reflect the whole target build: relics _and_ cone choice.

## What Changes

- Add an HSR-only blended build score: `0.25 × coneTerm + 0.75 × relicScore`, renormalized when only one side is active (has preferences/data).
- Cone term maps the equipped cone's rank in `lightConePreferences` to a fixed-step score: `#1 → 1.0`, each rank down `−0.25`, floored at `0.25`; off-build or nothing equipped → `0`. Empty preference list = don't-care (cone side drops out; relic-only characters score exactly as today).
- `-1` insufficient-data sentinel only when _both_ sides are insufficient; a cone-preferences-only character now gets a numeric score (previously badge-less).
- Card header `ScoreBadge` and the roster score sort switch from `calculateRelicScore` to the blended score.
- Cone level and superimposition stay display-only — the score measures build match, not investment.
- Shared scoring core (`createEquipmentScore`, `SCORE_WEIGHTS`), N2E and P5X scorers, and the relic score formula itself are untouched; the blend is a wrapper above `calculateRelicScore`.

## Capabilities

### New Capabilities

- `hsr-build-scoring`: HSR overall build score — blend of the existing relic score and a new Light Cone preference-rank term, with active-side renormalization and insufficient-data semantics.

### Modified Capabilities

- `hsr-character-detail`: the score badge and the score sort now use the blended build score instead of the raw relic score.

## Impact

- **New code**: build-score wrapper in `src/utils/` (composes `calculateRelicScore`; no shared-core changes).
- **Modified**: `CharacterCard.tsx` (headerExtra / temperScore), `HsrPage.tsx` (sort comparator).
- **Unchanged**: `src/utils/scoring/` shared core, `relicScoring.ts` formula, `ScoreBadge`, N2E/P5X scorers, DB schema (no new persisted data).
- **Behavioral shift**: existing scores drop for characters with cone preferences set and an off-build/absent cone (max 75 with perfect relics); relic-only characters unaffected.
