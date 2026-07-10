## Why

Three games score equipment against build preferences — HSR relics, N2E cartridges, P5X revelations — with the **same algorithm shape** copied three times in three stat-id vocabularies, three divergent grade scales, and three different score badges. The scorers have drifted: HSR alone has **no set term** (relic 2pc/4pc set bonuses matter in-game but are ignored), uses main .40 / sub .60 weights where N2E/P5X use .35/.30/.35, decides "insufficient data" in the component instead of the scorer, and renders a 3-tier glossy badge where the others render a 5-grade flat pill. N2E and P5X compute a score you cannot sort the roster by. This change unifies the mechanism (holistically, including equip sets), the grade scale, and the badge visual across all three.

## What Changes

- **New shared scoring core** — one `getStatMatchScore` over a normalized stat shape, one `getScoreGrade` + one threshold set, one `createEquipmentScore` factory (weights, sub denominator, `-1` sentinel, main/sub terms) with the **set term as a per-game plugin**. HSR/N2E/P5X scorers become config adapters over it, mirroring the `createRosterPersistence` pattern.
- **HSR gains a set term** — **BREAKING (score-changing):** relic score becomes 3-term. Set term grades the two families toward their in-game breakpoints: `relicMatch × 0.67 + planarMatch × 0.33`, `relicMatch = min(matching 4-piece relic-set pieces, 4)/4`, `planarMatch = min(matching planar-ornament pieces, 2)/2`. Needs a **new HSR set-preference** (preferred relic set + preferred planar set) and inputs to set it.
- **Uniform weights** — all three adopt `set .35 / main .30 / sub .35`. **BREAKING (score-changing):** HSR moves off main .40 / sub .60, so every HSR score shifts.
- **Uniform grade scale** — all three use the 5-grade scale (S≥90, A≥70, B≥50, C≥30, D). **BREAKING (visible):** HSR re-tiers (an 82% goes tier-s → A); HSR drops its inline 3-tier `tierClass`.
- **Uniform `-1` sentinel** — the scorer owns the insufficient-data decision for all three; HSR stops deciding `hasPreferences` in the card.
- **Shared score badge** — one `<ScoreBadge>` component + one `--color-score-grade-*` token ramp, replacing `.score-badge.tier-*` (HSR), `.cartridge-score-badge.grade-*` (N2E), and `.score-badge.grade-*` (P5X) and the duplicate `--color-{hsr,n2e,p5x}-score-*` tokens. **BREAKING (visual):** HSR loses its glossy brand-gold badge for the flat pill.
- **Score-sort everywhere** — N2E and P5X roster views gain a `SCORE` sort mode (HSR already has one).

## Capabilities

### New Capabilities

- `shared-equipment-scoring`: Game-agnostic scoring core — normalized stat-match, `set/main/sub` weighting, `-1` insufficient-data sentinel, sub-score denominator, 5-grade scale + thresholds, and the `createEquipmentScore` factory with a per-game set-term plugin seam.
- `shared-score-badge`: Shared score-badge component and unified grade-color token ramp; one badge class system for all games.

### Modified Capabilities

- `hsr-relic-scoring`: Adds a two-family set term, adopts uniform `.35/.30/.35` weights, the `-1` sentinel in the scorer, and the 5-grade scale — all via the shared core.
- `hsr-character-detail`: New preferred-relic-set and preferred-planar-set inputs in the build-preferences editor; score badge adopts the shared 5-grade scale (roster re-tiers).
- `n2e-character-detail`: Roster view gains a `SCORE` sort mode.
- `p5x-thief-detail`: Roster view gains a `SCORE` sort mode.
- `shared-roster`: `useRosterView` generalized from a two-mode toggle to N-mode cycling (needed so N2E/P5X carry ALPHA + LEVEL + SCORE); two-mode consumers unaffected.

`n2e-cartridge-scoring` and `p5x-revelation-scoring` are **refactored onto the shared core with behavior frozen** (identical scores) — implementation-only, no spec-level change, so no delta spec.

## Impact

- **Code:** `src/utils/{relicScoring,cartridgeScoring,revelationScoring}.ts` collapse onto a new `src/utils/scoring/` core; `CharacterCard.tsx`/`ThiefCard.tsx` (×3) swap to `<ScoreBadge>`; `HsrPage`/`N2ePage`/`P5xPage` sort config; HSR relic-editor preferences UI.
- **Types:** new HSR set-preference fields on `HsrTrackedCharacter['buildPreferences']` (`src/types.ts`).
- **Data/DB:** HSR set preference needs persistence — either a new preference-row type or new columns (a Supabase migration); resolved in design.
- **Design tokens:** `design-tokens.json` gains a shared `color.score.grade-*` ramp; the per-game `color.{hsr,n2e,p5x}.score*` entries are removed; `npm run build:tokens` regenerates `tokens.css`.
- **Tests:** three scoring test suites refactor onto the shared core; new set-term tests for HSR; badge/sort tests updated. Storybook: `<ScoreBadge>` story + token-ramp story.
- **Not touched:** AE (no aggregate score today) and R1999 (no equip scoring).
