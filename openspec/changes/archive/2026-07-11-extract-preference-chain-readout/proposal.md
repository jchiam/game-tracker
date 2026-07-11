## Why

All three equipment-game cards (HSR `CharacterCard`, N2E `CharacterCard`, P5X `ThiefCard`) hand-render the Target Build chain rows — `.pref-display-row` → `.pref-display-label` + `.pref-display-chain` of `.pref-stat-badge` / `.pref-operator-badge` — six copies of the same ~15-line block (per-slot main chains + substat chain), each repeating the operator-glyph literal `p.operator === '>=' ? '≥' : p.operator`. ~90 LOC of structural duplication that escaped the Game Card Shell concentration; a glyph or layout tweak today needs six coordinated edits and three card tests re-assert the same badge markup. (Architecture review 2026-07-11, finding 4.)

## What Changes

- Add a shared presentational `PreferenceChainReadout` component (L3, `src/components/`) — the read-only twin of `PreferenceChain`. Props: `label`, `chain: StatPreference[]`, optional `formatStat` (P5X maps stat ids to in-game labels; HSR/N2E chains already store display strings). Renders one `.pref-display-row`; returns `null` for an empty chain, concentrating the per-row empty guard.
- Adopt it in all three cards for every chain row (HSR body/feet/sphere/rope + Subs; N2E Main + Subs; P5X Moon/Star/Sky + Subs). Set rows and comments rows stay per-game — they are not chains and carry game-specific extras (N2E rarity badge).
- Storybook story + component test per the L3 rules; card tests keep their scenario coverage but stop re-asserting badge internals.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-ui-components`: ADDED requirement — shared `PreferenceChainReadout` renders a read-only preference-chain row (label, stat badges, operator badges with the `≥` glyph mapping, empty-chain null).
- `shared-equipment-editor`: MODIFIED requirement "Target Build card readout" — chain rows SHALL render through the shared `PreferenceChainReadout`; cards SHALL NOT hand-write chain badge/operator markup.

## Impact

- **Code:** new `src/components/PreferenceChainReadout.tsx` (+ `.test.tsx`, `.stories.tsx`); `src/pages/honkai-star-rail/components/CharacterCard.tsx`, `src/pages/neverness-to-everness/components/CharacterCard.tsx`, `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` chain rows replaced; CLAUDE.md L3 table row.
- **CSS:** none — `.pref-display-*` / `.pref-stat-badge` / `.pref-operator-badge` already live in the shared `card.css`.
- **Behavior:** rendered markup identical; existing card tests pass unchanged.
