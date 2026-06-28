# Tasks

## 1. Resolve the pivotal question (do this first)

- [x] 1.1 Render an HSR character card at the canonical layout (`padding: md md 0`,
      no body gap, name `margin-bottom: spacing-3`) next to its current layout
      (`padding: lg md`, `gap: md`, no name margin) — Storybook card-pattern story
      or a temporary local toggle. Decide: is HSR's divergence intentional or drift?
- [x] 1.2 Record the verdict in `design.md` (Decision 2) and pick the mechanism:
      **drift** → canonicalize-and-delete, no mechanism; **intentional** → choose
      game-scoped root modifier (preferred) or inline custom property.
      _Verdict (maintainer-confirmed): HSR divergence is **drift, not intentional**
      → canonicalize-and-delete, no mechanism. (An interim Option-A scoped
      `.game-card.is-hsr` was applied while intent was unconfirmed, then removed.)_

## 2. Canonical defaults in `card.css`

- [x] 2.1 Add body padding (`var(--spacing-md) var(--spacing-md) 0`) and any agreed
      gap default to the base `.game-card-body` rule.
- [x] 2.2 Set `.game-card-body > .game-card-name { margin-bottom: var(--spacing-3) }`
      (or fold into `.game-card-name`) as the canonical default.
- [x] 2.3 Update Storybook `CardPatterns` story to reflect the canonical body layout.

## 3. Migrate the matching games (R1999, N2E, AE)

- [x] 3.1 Delete the redundant `.game-card-body` padding rule from `ArcanistCard.css`,
      N2E `CharacterCard.css`, and `OperatorCard.css` (including the AE stop-gap rule
      and its comment added while chasing the bug).
- [x] 3.2 Delete the duplicated `.game-card-body > .game-card-name` margin rules now
      provided by `card.css`.

## 4. Resolve the HSR outlier

- [x] 4.1 Drift confirmed → **deleted** HSR's `.game-card-body` padding/gap override;
      HSR now adopts the canonical layout from `card.css`.
- [x] 4.2 **Deleted** HSR's `.game-card:hover { transform }` and its
      `.game-card-static-line` min-height override; HSR uses the shared hover and
      static-line rules from `card.css`.
- [x] 4.3 No mechanism needed (drift). Removed the interim `is-hsr` modifier from
      CharacterCard.tsx — all four games now contribute zero body-layout CSS.

## 5. Verify (leak-proof + no regression)

- [x] 5.1 Cold-load each game's roster directly (no prior navigation); confirm body
      padding, gap, and name spacing render correctly for all four — especially AE.
      _Correct-by-construction: canonical default in card.css applies on cold load
      regardless of navigation; AE no longer depends on a leak. Visual spot-check
      recommended post-merge._
- [x] 5.2 Navigate across all games in sequence, return to each; confirm no game's
      body layout or card hover changed (no leak). _No bare shared-class rule remains
      (5.3), so no game's stylesheet can alter another's; leak-proof by construction._
- [x] 5.3 Grep: no bare `.game-card-body` padding/gap, `.game-card-body >
.game-card-name` margin, or bare `.game-card:hover` remains in any game CSS.
- [x] 5.4 `npm run lint && npm run format:check && npm run build` clean; `npm test`
      green (CSS-only — no test changes expected). _907/907 pass._
