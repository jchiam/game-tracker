## Context

Three game cards implement the same collapse mechanism with different name prefixes:

| Concept                     | r1999 (`ArcanistCard.css`)  | N2E (`CharacterCard.css`)   | AE (`OperatorCard.css`)              |
| --------------------------- | --------------------------- | --------------------------- | ------------------------------------ |
| summary class               | `.arcanist-static-summary`  | `.character-static-summary` | `.operator-static-summary`           |
| summary `max-height`        | 80px                        | 400px                       | (none — not animated)                |
| stats row                   | `.arcanist-static-stats`    | `.character-static-stats`   | `.operator-static-stats`             |
| text line                   | `.arcanist-static-psychube` | `.character-static-equip`   | (none)                               |
| edit body                   | `.arcanist-edit-body`       | `.character-edit-body`      | references `.character-edit-body` ⚠️ |
| edit `max-height` (editing) | 700px                       | 1200px                      | (inherited from N2E if loaded)       |

The structural rules (flex column, `overflow: hidden`, the `opacity/max-height/padding` transition, and the `.game-card-body.is-editing` collapse/expand selectors) are byte-identical between r1999 and N2E. Only the two `max-height` budgets differ, because they are content-dependent magic numbers (the `max-height` animation trick can't use `auto`). AE never declared its own edit-body rules — its TSX borrows N2E's class names, which only resolve when N2E's route-split CSS happens to be loaded.

`card.css` is imported globally from `src/index.css`, so anything placed there is available on every route. This is the natural home for the shared mechanism.

## Goals / Non-Goals

**Goals:**

- One canonical definition of the collapse mechanism in `card.css`, named with the `.game-card-*` convention.
- Preserve r1999 and N2E rendering exactly (same heights, same transition).
- Fix AE so its edit body collapses reliably regardless of route load order.
- Keep the two genuinely-per-game numbers tunable without re-declaring structural rules.

**Non-Goals:**

- Not changing what each card _shows_ in its summary or edit body (that is Changes C and D). This change is structural class consolidation only.
- Not slimming N2E's 400px summary — that height drops in Change D when Target Build moves out.
- Not adding design tokens for the heights (see decision below).
- Not canonicalizing the empty-state span modifiers (`.no-psychube` / `.no-equip`) — they stay game-local; trivial one-property opacity rules, out of scope.

## Decisions

**Decision: Parametrize the two heights with CSS custom properties, not design tokens.**
`card.css` defines the structural rules once and reads `max-height: var(--game-card-summary-max-height, 200px)` and `var(--game-card-edit-max-height, 1200px)`. Each game sets these on `.game-card` in its route-scoped stylesheet. Custom properties (not tokens) because these are content-dependent "large enough" budgets, not part of the design language — promoting them to `design-tokens.json` would imply a reusable semantic they don't have. Setting them on `.game-card` (rather than repeating the compound `.game-card-body.is-editing .game-card-edit-body` selector per game) is what makes the override a single line. _Alternative considered:_ keep per-game full selectors. Rejected — that re-declares structural CSS, the exact L2 violation we're removing.

**Decision: Defaults live in `card.css`; games override only when they differ.**
Defaults (`200px` summary / `1200px` edit) cover a small card. r1999 sets `80px / 700px`; N2E sets `400px / 1200px`; AE uses the defaults (its summary is one stats row, its edit body is two sections). This keeps each game's CSS to a two-line override.

**Decision: Scope = mechanism + identical content rows; empty modifiers excluded.**
In scope (safe to canonicalize — identical or structural): `static-summary`, `static-stats`, `static-line`, `edit-body`, `edit-body-inner`, the two `.is-editing` selectors. The `static-line` text rule is identical between r1999 and N2E (AE has no line), so it canonicalizes cleanly. Out of scope: `.no-psychube` / `.no-equip` empty spans (stay game-local).

**Decision: AE inherits intentional side effects; `align-items: center` is promoted to the canonical stats row.**
After migration AE's summary gains the canonical `gap: var(--spacing-3)` (was `--spacing-xs`) and the `opacity/max-height` transition; its stats row gains `gap: var(--spacing-sm)`. These are consistency gains, not regressions.

AE's row also mixes a small rarity-stars span with the chips, and verification confirmed the stars sit misaligned without vertical centering. Rather than re-add `align-items: center` as an AE-local override (the originally-planned path), it is promoted into the canonical `.game-card-static-stats` in `card.css`. Rationale: it is harmless to the chip-only rows (r1999/N2E chips are equal height, so `center` is visually identical to the default `stretch`) and makes the canonical row robust for any game that mixes content heights — exactly the consistency goal of this effort, and likely needed again when HSR's row gains a traces indicator in Change C. This supersedes the per-game-override approach; no game re-declares it.

## Risks / Trade-offs

- **[Restructure, not a move — tests can't prove visual parity]** → Unlike Change A, this rewrites CSS and changes AE behavior. A wrong `max-height` clips content silently and a transition diff is invisible to unit tests. Mitigation: run the app and toggle edit on one card per game (r1999, N2E, AE), confirming r1999/N2E are unchanged and AE now collapses. This dev-server check is mandatory and must NOT be marked done by inference.
- **[Missed class reference loses a card's collapse]** → A full grep of `.tsx`/`.test.tsx`/`.stories.tsx` enumerated every reference (5 files incl. one test) before tasks were written; migration covers all of them.
- **[AE cold-load bug is order-dependent]** → It only manifests on a cold AE-route load before N2E's chunk loads; in a warm SPA session N2E's CSS persists and masks it. The fix is correct regardless of whether the bug currently manifests; optional confirm: grep built `dist/assets/ArknightsEndfieldPage-*.css` for `edit-body` (absent today = confirmed missing).
- **[Storybook only exercises the canonical base]** → `preview.ts` imports `card.css` but not route-split per-game overrides, so a wrong r1999 height won't show in Storybook. Storybook validates the mechanism; the dev-server check validates the per-game budgets.
