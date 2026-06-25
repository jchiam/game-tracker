## Why

The card collapse mechanism — a read-only static summary that swaps for an editing body when `.game-card-body` gets `.is-editing` — is hand-rolled three times under three different name prefixes (`arcanist-`, `character-`, `operator-`) across r1999, N2E, and AE. The structural CSS (flex layout, `overflow: hidden`, the `max-height` transition, the `.is-editing` collapse/expand selectors) is duplicated, while only two numbers genuinely differ per game (the collapsed-summary and expanded-edit height budgets). This violates the CLAUDE.md L2 rule that card structure is canonical (`.game-card-*`) and must not be re-declared per game.

It has also already produced a latent defect: AE's `OperatorCard.tsx` references `.character-edit-body` / `.character-edit-body-inner`, which are defined **only** in N2E's route-split CSS. On a cold load of the AE route (before N2E's chunk is loaded), those rules are absent, so the AE edit body has no `max-height` and never collapses. Promoting the mechanism into the globally-imported `card.css` fixes this structurally.

## What Changes

- Add canonical collapse classes to `src/styles/card.css`: `.game-card-static-summary`, `.game-card-static-stats`, `.game-card-static-line`, `.game-card-edit-body`, `.game-card-edit-body-inner`, plus the `.game-card-body.is-editing` collapse/expand selectors.
- Parametrize the two per-game height budgets via CSS custom properties — `--game-card-summary-max-height` and `--game-card-edit-max-height` — with sensible defaults in `card.css`; each game sets its values on `.game-card`.
- Migrate r1999 `ArcanistCard`, N2E `CharacterCard`, and AE `OperatorCard` (and the one r1999 test) to the canonical class names; delete the bespoke per-game structural rules.
- **Behavior-preserving for r1999 and N2E** (same layout, same height budgets). **Behavior-fixing for AE**: its edit body now collapses reliably on any route; its summary picks up the canonical gap and transition (intended consistency, see design).
- Add a `CardPatterns` collapse story to Storybook documenting the canonical mechanism.

## Capabilities

### New Capabilities

- `shared-card-collapse`: The canonical card collapse/expand mechanism — a read-only static summary and an editing body whose visibility is driven by `.game-card-body.is-editing`, provided once by `card.css` with per-game height budgets via CSS custom properties.

### Modified Capabilities

<!-- None. r1999 and N2E observable behavior is preserved. AE's collapse fix is new behavior captured by the shared-card-collapse capability above, not a change to an existing spec requirement. -->

## Impact

- **Modified:** `src/styles/card.css` (+ canonical classes), `src/pages/reverse1999/components/ArcanistCard.{tsx,css}`, `src/pages/reverse1999/components/ArcanistCard.test.tsx`, `src/pages/neverness-to-everness/components/CharacterCard.{tsx,css}`, `src/pages/arknights-endfield/components/OperatorCard.{tsx,css}`.
- **Storybook:** `CardPatterns` story updated/added.
- **No DB, API, or data changes.** No design-token additions (the two heights are content-dependent budgets, not tokens — see design).
- **Builds on:** `extract-shared-progress-gradient` (Change A). **Unblocks:** the HSR collapse refactor (Change C), which will use these canonical classes instead of inventing a fourth copy; and the N2E summary slimming (Change D), which will lower N2E's summary height budget.
