## Why

`src/styles/controls.css` already defines the canonical card-control primitives —
`.toggle-btn`, `.level-slider`, and `.game-select` — and the Storybook **Control
Patterns** story documents them as the shared vocabulary. But the game cards never
fully adopted them: R1999 and N2E still ship per-game duplicates of the same rules
under bespoke names. This violates the CLAUDE.md L2 rule that a rule already present in
`controls.css` must not be re-declared per game, and it means a token or hover-state
tweak to the canonical control has to be hand-mirrored into 5+ near-identical copies.

Concretely, the duplicates are:

- **Toggle buttons** — R1999 `.portrait-btn` / `.euphoria-btn` / `.amplify-btn` and N2E
  `.awakening-btn` / `.arc-tier-btn` re-declare `.toggle-btn`. `.portrait-btn` /
  `.euphoria-btn` / `.awakening-btn` are byte-for-byte the standard `.toggle-btn`;
  `.arc-tier-btn` / `.amplify-btn` are a **compact** variant (`padding: 5px 4px`,
  `font-size: 0.78rem`) that `.toggle-btn` has no modifier for yet.
- **Sliders** — R1999 `.resonance-slider` / `.psychube-slider` and N2E `.character-slider`
  re-declare `.level-slider` (track + `::-webkit-slider-thumb`). (R1999's main level
  slider already uses canonical `.level-slider`; HSR is already fully canonical.)
- **Selects** — R1999 `.psychube-select` and N2E `.character-select` re-declare
  `.game-select`.

## What Changes

- **Add a compact modifier to `.toggle-btn`** in `controls.css` (`.toggle-btn.compact`
  — `padding: 5px 4px; font-size: 0.78rem`), so the compact button size is expressed as
  a canonical variant instead of a duplicate rule. This is the one genuine design-system
  addition; everything else is convergence onto existing classes.
- **Migrate R1999 `ArcanistCard`** to canonical classes: `.toggle-btn` for portrait /
  euphoria, `.toggle-btn.compact` for amplify; `.level-slider` for resonance + psychube;
  `.game-select` for psychube. Keep R1999-only modifiers (`.portrait-reset`) as additive
  classes alongside `.toggle-btn`. Delete the bespoke rules from `ArcanistCard.css`.
- **Migrate N2E `CharacterCard`** to canonical classes: `.toggle-btn` for awakening,
  `.toggle-btn.compact` for arc-tier; `.level-slider` for the level + arc sliders;
  `.game-select` for arc / cartridge. Delete the bespoke rules from `CharacterCard.css`.
- **Update the one affected test** (`CharacterCard.test.tsx` asserts on `.awakening-btn`).
- **Behavior-preserving** — same pixels, same hover/active states. This is a rename +
  dedupe refactor, not a visual change.
- Update the Storybook **Control Patterns** story to show the `.toggle-btn.compact`
  variant, and drop the "not yet migrated" caveat from `src/styles/components.md`.

## Capabilities

### New Capabilities

- `shared-card-controls`: The canonical card-control primitives — toggle button (with a
  standard and a compact size), level slider, and custom select — defined once in
  `controls.css` and consumed by every game card; game stylesheets MUST NOT re-declare
  their rules.

## Impact

- **Modified:** `src/styles/controls.css` (+ `.toggle-btn.compact`),
  `src/pages/reverse1999/components/ArcanistCard.{tsx,css}`,
  `src/pages/neverness-to-everness/components/CharacterCard.{tsx,css}`,
  `src/pages/neverness-to-everness/components/CharacterCard.test.tsx`.
- **Storybook:** `ControlPatterns` story updated (compact toggle variant).
- **Docs:** `src/styles/components.md` convergence caveats removed.
- **No DB, service, hook, type, or data-catalog changes. No new tokens.**
- **Sequencing:** `ae-card-collapse-polish` migrates AE's `.character-slider` →
  `.level-slider` and explicitly leaves N2E's `.character-slider` untouched. This change
  is the one that finally retires N2E's `.character-slider`, so it MUST land **after**
  `ae-card-collapse-polish` to avoid editing the same class from two open changes.
- **Out of scope:** HSR `CharacterCard` (already canonical for controls), badge styles,
  the relic grid, and any data-model change.
