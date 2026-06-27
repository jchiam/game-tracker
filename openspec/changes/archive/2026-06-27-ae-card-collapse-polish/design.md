## Context

`OperatorCard.tsx` already has the canonical collapse structure (`.game-card-static-summary` ⇄ `.game-card-edit-body` behind the `isEditing` ✎ toggle), so this is a polish pass, not a restructuring. Three gaps remain versus the other three game cards:

1. Summary chips render in flat default text — no investment color.
2. The level slider uses `className="character-slider"` with a hardcoded `var(--color-brand-primary)` fill. `.character-slider` is defined only in `src/pages/neverness-to-everness/components/CharacterCard.css`, which `OperatorCard.tsx` does not import — so on a cold AE load the slider is unstyled.
3. The card sets no inline height budgets, inheriting the shared defaults (200px summary / 1200px edit), which are far taller than AE's actual content (one chip row; a level slider + a potential-button row).

The shared building blocks already exist: `getProgressStyle(value, min, max)` (`src/utils/progressGradient.ts`) and the canonical `.level-slider` (`src/styles/controls.css`), whose thumb already consumes `--slider-fill-color` / `--slider-fill-glow`. HSR's `CharacterCard.tsx` is the reference wiring.

## Goals / Non-Goals

**Goals:**

- AE summary chips colored by investment via `getProgressStyle` (Lv over 1–90, P over 0–5).
- Level slider on the canonical `.level-slider` class, fill + glow driven by the shared gradient, with no dependency on N2E's CSS.
- Inline collapse height budgets sized to AE's real content so the expand transition feels snappy.

**Non-Goals:**

- No gear one-liner — AE operators have no equippable gear (`EndfieldTrackedOperator` = level + potential only).
- Rarity-star styling unchanged (rarity is intrinsic, not investment).
- No changes to badges, the potential-button row visuals, data, services, hooks, or types.
- Do not touch or delete `.character-slider` — N2E still uses it.

## Decisions

**Reuse `getProgressStyle` exactly as HSR does.** Compute `levelPs = getProgressStyle(level, 1, 90)` and `potentialPs = getProgressStyle(potential, 0, 5)` once in the component body, then pass `{ color, borderColor }` to each `StatChip` and `{ '--slider-fill-color': color, '--slider-fill-glow': glowColor }` to the slider. Rationale: single source of truth for the cross-game color language; no new tokens.

**Keep AE's existing slider track-fill formula `(level − 1) / 89`, do not copy HSR's `level/80`.** `getProgressStyle` normalizes as `(value − min)/(max − min)` = `(level − 1)/89` for the 1–90 range, so AE's fill percentage and its gradient color already track together. HSR has a latent fill-vs-color mismatch (`level/80` fill but `(level − 1)/79` color); copying it would _introduce_ a mismatch into AE. Only the class name and the thumb custom properties change; the track `linear-gradient` keeps its current math (with the literal color swapped to `levelPs.color`).

**Size the height budgets to AE's content rather than reusing HSR's 900px.** Summary is a single chip row with no static-line → ~80px (tighter than HSR's 100px, which reserves a one-liner). Edit body is two `ProgressSection`s (slider + potential row) → a budget in the ~320–400px range, verified by expanding the card in `npm run dev` and nudging until it doesn't clip or overshoot. Rationale: an oversized `max-height` ceiling makes the `max-height` transition animate past the real content height and feel laggy.

**Set budgets as inline custom properties on the card root** (`style={{ '--game-card-summary-max-height': …, '--game-card-edit-max-height': … }}`), per the `shared-card-collapse` element-scoping requirement — never via a `.game-card { … }` rule in route-split CSS.

## Risks / Trade-offs

- **Edit-budget guesswork** → Verify the chosen `--game-card-edit-max-height` against the rendered edit body in `npm run dev`; the potential row can wrap on narrow cards, so leave headroom.
- **Removing `.character-slider` from AE could regress if some other AE element relied on it** → Grep confirmed AE's only `.character-slider` reference is this slider; N2E's usages and CSS are independent and stay untouched.
- **Existing `OperatorCard.test.tsx` may assert the old slider class or markup** → Update affected assertions to the canonical `.level-slider` / new chip styling.

## Open Questions

- Exact `--game-card-edit-max-height` value — resolved empirically during apply (start ~360px, adjust against the rendered card).
