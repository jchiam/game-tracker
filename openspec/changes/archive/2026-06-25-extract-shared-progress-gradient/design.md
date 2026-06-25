## Context

The gradient helper (`COLOR_STOPS`, `lerpColor`, `getProgressStyle`, and the `ProgressStyle` interface) is duplicated verbatim — lines 11–58 of `src/pages/reverse1999/components/ArcanistCard.tsx` and lines 13–60 of `src/pages/neverness-to-everness/components/CharacterCard.tsx` are identical. Both produce inline `style` values (text color, border, slider glow, active-button background) keyed to how invested a stat is. HSR's `CharacterCard` does not yet use the gradient (it uses a flat `var(--color-brand-primary)`), and a forthcoming change will make it adopt the gradient — which would create a third copy unless the helper is extracted first.

This is the first change in the card-consistency effort and is deliberately scoped to a pure, behavior-preserving extraction so it can be reviewed and merged with near-zero risk.

## Goals / Non-Goals

**Goals:**

- Establish `src/utils/progressGradient.ts` as the single source of truth for the investment-progress color language.
- Migrate r1999 and N2E cards to the shared util with byte-for-byte identical runtime output.
- Add unit tests pinning the anchor colors and interpolation so future edits can't silently drift the language.

**Non-Goals:**

- No visual change, no CSS change, no new tokens.
- Not migrating HSR to the gradient (that happens in the HSR collapse change).
- Not promoting the colors into design-tokens.json. The gradient is a computed continuous interpolation, not a discrete token set; tokenizing it is out of scope and would be a separate discussion (the CLAUDE.md "rgba at X% opacity" known-gap territory).

## Decisions

**Decision: Plain util module under `src/utils/`, not a hook or a token.**
The helper is a pure synchronous function with no React or DOM dependency, matching the existing `src/utils/` convention (e.g. `relicScoring.ts`, `cartridgeScoring.ts`). A hook would add ceremony for no benefit; a design token can't express continuous interpolation. _Alternative considered:_ `src/lib/`. Rejected — `lib/` holds external-service clients (supabase, imagekit); `utils/` holds pure domain helpers, which is what this is.

**Decision: Export `getProgressStyle`, `ProgressStyle`, and the `COLOR_STOPS` anchors; keep `lerpColor` internal.**
`getProgressStyle` is the only call site used by cards. `ProgressStyle` is exported as the public return type so future consumers can annotate against it — the current cards rely on inference (`const x = getProgressStyle(...)`) and don't reference the name, but exporting it keeps the API surface complete. `COLOR_STOPS` is exported so tests (and future docs/Storybook) can assert against the canonical anchors. `lerpColor` stays module-private — it's an implementation detail. _Alternative considered:_ export everything. Rejected — narrower surface is easier to keep stable.

**Decision: Byte-for-byte identical behavior; verify by deletion, not reimplementation.**
The shared module is the _moved_ code, not a rewrite. r1999 and N2E import `getProgressStyle` and delete their local `COLOR_STOPS` / `lerpColor` / `getProgressStyle` / `ProgressStyle` definitions. Their existing tests must pass with no assertion changes — that is the regression guard.

## Risks / Trade-offs

- **[Subtle drift if the two copies were not actually identical]** → Diff the two source ranges before extraction to confirm they match; if they differ, the canonical version is the one that keeps both cards' current rendering, and any discrepancy is called out in the PR rather than silently resolved.
- **[Import path / alias mistakes]** → Use the `@/utils/progressGradient` alias per the import convention; `npm run build` (tsc) and existing card tests catch breakage.
- **[Scope creep toward tokenizing the gradient]** → Explicitly a non-goal; keep this change to a move.
