# Design: temper-audit

## Context

Enforcement sweep after the three Temper changes. The token discipline (`shared-design-tokens`) sanctions literal `rgba()` only for neutral white/black glass; the audit found five hue-carrying blue-slate literals predating Temper, one hardcoded darkened gold, one divergent fallback, and a missing CardPatterns entry for the anodized edge. No requirement changes — every fix lands the code on the spec as written.

## Goals / Non-Goals

**Goals**: retint hue-carrying glass to token derivations; derive the darkened gold; drop the divergent fallback; document the edge pattern in CardPatterns; pin the ramp-inheritance verification.

**Non-Goals**: white/black literals (sanctioned); any visual redesign — retints and tokenisations must be value-identical or near-imperceptible.

## Decisions

### D1 — Glass retints via color-mix over `--color-bg-base`, not new tokens

`rgba(20,20,30,0.9)` ≈ "90% of a near-Ink dark". Each becomes `color-mix(in srgb, var(--color-bg-base) N%, transparent)` with N = the literal's alpha × 100, except stops whose job is pure darkening over imagery (`.game-card-overlay`, selection overlay tops) — those may use true-neutral `rgba(0,0,0,…)`, which the exception sanctions. Choice per stop: if the surface sits over the app ground (badge, card body), track Ink via the token; if it darkens arbitrary art, neutral black is more correct than any hue. `--color-bg-base` is opaque (`#0e1014`), so `color-mix` with transparent yields exactly "Ink at N%". No new tokens: these are one-off surface derivations, precisely what `color-mix` is specced for. One stronger form: where an existing semantic bg token already expresses the surface (`.requires-login-badge`'s glass ≈ `--color-bg-elevated`), the token is used directly instead of a `color-mix` derivation.

### D2 — `.primary-action` gradient end derives from brand

`#b8960c` is roughly brand gold darkened ~25% and slightly hue-rotated. Replacement: `color-mix(in srgb, var(--color-brand-primary) 78%, black)` ≈ `#a58a2b`-family — visually equivalent as the dark end of a 135° gradient under the same border/glow. Exact percentage tuned in Storybook against the current render; the goal is derivation, not pixel identity.

### D3 — CardPatterns gains an "Anodized edge" pattern block

CardPatterns documents `card.css` patterns with static markup; add a `.game-card.has-temper-edge` demo with an inline `--temper` (one low, one high score example) and a caption pointing at `GameCardShell`'s `temperScore`. No new stories file; extends the existing `CardPatterns.stories.tsx` the same way other patterns are shown.

### D4 — Selection scene gradients: colour tokens per game, shared fade

The five `.bg-*-sel` gradients each run `start → mid → #0a0a1a`. Start/mid are game-identity hues → `color.{gameId}.selStart` / `.selMid` per the namespacing requirement; the end stop is byte-identical across all five games — a shared scene-fade neutral, not a game colour — so it becomes one `color.bg.selectionFade`. The gradient shape (135°, 0/50/100%) stays in `index.css`; only colours move. Alternative — five `gradient.{gameId}Sel` string tokens — hides game hues outside `color.{gameId}`, fighting the namespacing spec. Values copied verbatim: zero visual change.

### D5 — Verification is a task, not code

Ramp inheritance is structural: sliders/chips/segments/slots all colour through `getProgressStyle` at runtime; `COLOR_STOPS` is comment-locked to the temper tokens. The audit task re-runs the greps (ramp hexes outside `tokens.css`/`COLOR_STOPS`/its stories; `rgba(` with hue outside sanctioned files) and records the result in the task checkbox — a paper trail, not a test file, since the existing e2e/unit suites already pin the computed styles that matter.

## Risks / Trade-offs

- [Retinted glass shifts a surface visibly] → each value's before/after composite checked over Ink; alpha preserved; visual pass on selection page + roster before sign-off.
- [`color-mix` output differs across browsers in srgb] → already used throughout badges/edge; no new compatibility surface.

## Migration Plan

Single deploy; pure CSS + Storybook. Rollback = revert.

## Open Questions

None.
