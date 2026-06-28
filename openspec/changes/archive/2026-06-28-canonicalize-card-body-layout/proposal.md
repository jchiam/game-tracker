## Why

Game card stylesheets redefine shared `.game-card-*` structural classes (body
padding/gap, name margin, card hover) in their **route-split** CSS. In the SPA all
route stylesheets coexist in one document, so a bare rule on a shared class wins by
load order — the last-visited game's values leak onto every other game's cards.
This already shipped two live bugs: AE operator cards rendered with **no body
padding** on a fresh load (they own no `.game-card-body` rule, so they inherited
whatever leaked), and HSR's `.game-card:hover` transform applies to all games once
HSR is visited. The values are also near-duplicated (R1999/N2E/AE bodies are
identical), so the overrides are mostly copy-paste, not real per-game intent.

The `shared-card-collapse` capability already solved this exact leak for height
budgets by moving them to **element-scoped inline custom properties** and forbade
bare `.game-card {}` route rules. But `shared-card-base` still _sanctions_ the
leaky pattern: "games MAY only override body padding/gap and hover transforms." We
should close that hole consistently.

## What Changes

- **Canonicalize the common card-body layout in `card.css`.** The body padding,
  body gap, and name margin shared by R1999/N2E/AE become the single default on the
  base `.game-card-body` / `.game-card-name` rules. Games matching the default
  contribute **zero** body-layout CSS.
- **Forbid bare per-game overrides of shared `.game-card-*` structural classes** in
  route-split stylesheets. Any genuine per-game deviation MUST be leak-proof
  (element-scoped) — via the chosen mechanism (see design.md: game-scoped root
  modifier vs inline custom property).
- **Resolve the HSR outlier.** HSR diverges on every body axis (`lg md` padding,
  `gap: md`, no name margin) and leaks a card-level `:hover` transform. Determine
  by visual check whether that layout is intentional or drift; either fold HSR into
  the canonical default (delete its overrides) or express the deviation
  leak-proof. Move HSR's `.game-card:hover` out of the bare-class form regardless.
- **Migrate all four games** to the canonical defaults; delete the now-redundant
  body/name overrides (and the AE stop-gap rule added while chasing the bug).
- **BREAKING (visual only)**: card body padding/hover may shift for whichever game
  currently benefits from a leaked value; verify each game's roster visually.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-card-base`: tighten the override allowance. Today it permits per-game
  overrides of body padding/gap and hover; change it to mandate canonical defaults
  in `card.css` and require any per-game structural deviation to be **leak-proof**
  (element-scoped), never a bare rule on a shared `.game-card-*` class in
  route-split CSS. Cross-reference `shared-card-collapse`'s inline-property
  precedent.

## Impact

- **Specs**: `openspec/specs/shared-card-base/spec.md` (delta).
- **Shared CSS**: `src/styles/card.css` (add canonical body/name defaults).
- **Game CSS**: `CharacterCard.css` (HSR, N2E), `ArcanistCard.css` (R1999),
  `OperatorCard.css` (AE) — remove redundant body/name overrides; HSR hover.
- **Possibly TSX** (only if the inline-custom-property mechanism is chosen): card
  root elements gain a scoping class or `--game-card-body-*` inline props.
- **No DB / API / runtime-logic changes.** CSS + spec only. Verify via Storybook
  card-pattern stories and each game's roster on a cold route load.
