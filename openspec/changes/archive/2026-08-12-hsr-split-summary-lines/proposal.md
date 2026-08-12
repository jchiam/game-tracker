# Proposal: hsr-split-summary-lines

## Why

The HSR character card packs the equipped Light Cone readout (icon, name, level, superimposition, match badge) and the relic set digest into the single ellipsized `.game-card-static-line`. Since the Light Cone icon and match badge shipped, the combined content routinely exceeds one line width — the relic sets (rendered last) get truncated and the match badge can clip. The two equipment kinds need dedicated lines.

## What Changes

- `GameCardShell`'s `summaryLine` slot accepts `ReactNode | ReactNode[]`. An array renders one `.game-card-static-line` per entry, each independently ellipsized; a single node keeps today's behaviour (no migration for other games).
- The HSR character card passes two lines: line 1 = Light Cone readout (icon, name, level, superimposition, match badge), line 2 = relic set digest.
- Empty states: both lines always render, each showing `—` with `.no-equip` when its equipment kind is absent. Always-two-lines preserves the existing uniform-collapsed-height requirement across HSR cards (a conditionally omitted line would make card heights ragged in the roster grid) and keeps each line's meaning positionally stable.
- The collapse height budget needs no change — the shell measures `scrollHeight` of the summary inner wrapper, which absorbs the extra line automatically.
- `GameCardShell` Storybook story gains a multi-line summary variant (design-system rule: shared component changes update Storybook).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared-ui-components`: the GameCardShell slot contract's `summaryLine` prop widens to `ReactNode | ReactNode[]`; array input renders one `.game-card-static-line` per entry.
- `hsr-character-detail`: the "Collapsed summary gear one-liner" and "Light Cone card section" summary requirements change — the Light Cone readout and the relic set digest move to two dedicated static lines with the empty-state rules above.

## Impact

- `src/components/GameCardShell.tsx` — slot type widening + per-entry rendering.
- `src/components/GameCardShell.stories.tsx` — multi-line variant.
- `src/pages/honkai-star-rail/components/CharacterCard.tsx` — split summary into a two-element array.
- `src/pages/honkai-star-rail/components/CharacterCard.test.tsx` — summary-line assertions updated for two lines.
- No CSS changes: `.game-card-static-line` rules apply per line unchanged.
- Other games (R1999, N2E, P5X, AE) unaffected; N2E/P5X can adopt the array form later if their combined lines overflow.
