# Proposal: temper-audit

## Why

The three Temper changes (tokens `78a1de1`, score-badge rail `84a9a4a`, anodized edge `d871deb`) landed the language, but a codebase audit found leftovers that violate the already-specced token discipline, plus a Storybook gap: pre-Temper hue-carrying "neutral" literals (blue-slate glass values that no longer match Ink), a hardcoded darkened-gold hex, a divergent colour fallback, and no CardPatterns documentation for the new anodized-edge pattern. This change is the cleanup sweep — enforcement of existing requirements, no new requirements.

## What Changes

- **Hue-carrying glass literals retinted to token derivation** — `rgba(10,10,15,…)`, `rgba(20,20,30,…)`, `rgba(40,40,55,…)` in `src/index.css` (selection-card overlay/body/badge) and `src/styles/card.css` (`.game-card-overlay` bottom stop) carry the old blue-slate hue. The sanctioned literal exception covers only neutral white/black; these become `color-mix(in srgb, var(--color-bg-base) X%, transparent)` (or true-neutral black rgba where the darkening is what matters) so glass surfaces track the Ink ground.
- **`#b8960c` in `.primary-action` (App.css)** — hardcoded darkened brand gold; becomes a `color-mix` derivation of `--color-brand-primary`.
- **`var(--color-brand-accent, #6c63ff)` (RosterPageLayout.css)** — the fallback diverges from the token (`#8b5cf6`) and the token is always defined; fallback dropped.
- **CardPatterns story** — documents the anodized-edge pattern (`has-temper-edge` + `--temper`), satisfying the "every design-system change updates Storybook" rule that the edge change missed.
- **Verification (no code change)** — confirm ramp surfaces (LevelSlider, StatChip investment colours, SegmentedButtons, equip slots) inherit the ramp exclusively through runtime `getProgressStyle`/`COLOR_STOPS`, with no re-hardcoded ramp hexes anywhere (already grep-verified clean at proposal time; the task pins it).
- **`.bg-*-sel` selection-header gradients tokenised** — each game's scene gradient start/mid stops become `color.{gameId}.selStart` / `color.{gameId}.selMid` tokens; the shared final stop (`#0a0a1a`, identical across all five games) becomes `color.bg.selectionFade`. `index.css` keeps the `linear-gradient` shapes, referencing the vars. Removes the last hue literals from component CSS.
- Neutral `#fff`/`#000` and true white/black rgba glass stay literal per the sanctioned exception.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shared-design-tokens`: the single-source-of-truth requirement gains a "glass surface tracks the ground" scenario — translucent ground-reading surfaces derive from `--color-bg-base` via `color-mix`; hue-approximating rgba() literals are out. Codifies what the audit enforces.

## Impact

- `src/index.css` — selection-card glass rgba values.
- `src/styles/card.css` — `.game-card-overlay` bottom stop.
- `src/App.css` — `.primary-action` gradient.
- `src/components/RosterPageLayout.css` — fallback removal.
- `src/styles/CardPatterns.stories.tsx` — anodized-edge pattern section.
- Visual deltas are near-imperceptible retints of glass surfaces; no behaviour, DB, or API changes.
