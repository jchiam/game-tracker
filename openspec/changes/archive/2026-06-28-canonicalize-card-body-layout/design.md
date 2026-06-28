## Context

Four game card stylesheets (`CharacterCard.css` ×2, `ArcanistCard.css`,
`OperatorCard.css`) are loaded as route-split chunks into one SPA document. Each
redefines shared `.game-card-*` structural classes. Because the rules are bare
(class-scoped, not game-scoped) and coexist in one document, the cascade winner is
load-order-dependent — i.e. depends on which game the user visited last.

### Observed leak surface (evidence)

| Property                        | card.css base        | HSR                                               | R1999       | N2E         | AE (pre-fix)    |
| ------------------------------- | -------------------- | ------------------------------------------------- | ----------- | ----------- | --------------- |
| `.game-card-body` padding       | _none_               | `lg md`                                           | `md md 0`   | `md md 0`   | _none → leaked_ |
| `.game-card-body` gap           | _none_               | `md`                                              | _none_      | _none_      | _none_          |
| `.game-card-name` margin-bottom | `0`                  | _none_ (uses gap)                                 | `spacing-3` | `spacing-3` | `spacing-3`     |
| `.game-card:hover` transform    | border + image-scale | **`translateY(-5px) scale(1.02)`** (bare → leaks) | _none_      | _none_      | _none_          |

Two facts drive the design:

1. **R1999, N2E, and AE run one identical body layout** (`md md 0`, no gap, name
   `margin-bottom: spacing-3`). That is the de-facto canonical layout; the
   "variance" is almost entirely HSR.
2. **HSR is the lone outlier on every axis** and also owns a _bare_ `.game-card:hover`
   that leaks its card-level transform to all games once HSR's chunk loads.

## Pivotal open question (resolve during implementation)

**Is HSR's divergent body layout intentional, or drift?**

This decides whether the change needs _any_ override mechanism:

- **If drift** (HSR looks fine at the canonical `md md 0` + name margin): the best
  solution needs **no mechanism at all** — set one canonical layout in `card.css`,
  delete _every_ per-game body/name/hover override including HSR's. Zero overrides
  → zero leak surface → zero copy-paste. Strictly superior to any override scheme.
- **If intentional** (HSR's denser card genuinely needs `lg md` + gap): keep the
  canonical default for the other three and express HSR's deviation **leak-proof**
  (Decision 2 below).

This cannot be settled from source alone — it is a visual judgment. Implementation
MUST start with a side-by-side: render an HSR character card at the canonical
layout vs its current layout and decide. Do not build an override mechanism before
confirming one is needed.

## Decisions

### Decision 1 — Canonical body layout lives on the base rule in `card.css`

`card.css` sets the shared body padding (`var(--spacing-md) var(--spacing-md) 0`)
and name `margin-bottom: var(--spacing-3)` directly on `.game-card-body` /
`.game-card-body > .game-card-name`. Games matching it write nothing. This removes
the copy-paste and means a new game (and AE) gets correct padding for free — the
AE bug becomes structurally impossible.

### Decision 2 — Mechanism for a genuine outlier: scoped root modifier (preferred) vs inline custom property

Only needed **if** the HSR check returns "intentional." Two leak-proof options:

**Option A — Game-scoped root modifier class.** Add `is-{gameId}` to the card root
(`<div className="game-card is-hsr">`). Outlier rules become
`.game-card.is-hsr .game-card-body { padding: … ; gap: … }` and
`.game-card.is-hsr:hover { transform: … }`, living in HSR's route CSS. Scoped, so
they cannot leak regardless of load order.

- **+** One convention covers the _entire_ leak category at once: padding, gap,
  name margin, hover transform, and any future `.game-card-static-line` tweak —
  all just take an `.is-hsr` prefix. CSS stays in CSS files.
- **+** The `shared-card-collapse` argument does **not** rule this out: it rejected
  a _bare_ `.game-card {}` (leaks); a _scoped_ `.game-card.is-hsr {}` does not leak.
- **−** Introduces a new root-class convention (though `.is-editing` already shows
  root-modifier styling is an accepted pattern here).

**Option B — Per-property inline custom property.** Extend the height-budget
precedent: `card.css` reads `padding: var(--game-card-body-padding, <default>)`,
HSR sets `--game-card-body-padding` (and `--game-card-body-gap`) inline on the card
root.

- **+** Exactly mirrors the existing `--game-card-*-max-height` pattern.
- **−** One variable _per knob_. The leak category here is broad (padding, gap,
  name margin, hover). Plumbing a separate `--gc-*` var for each is verbose, and a
  hover-transform-as-custom-property is awkward. Fits one knob, not a category.

**Preference: Option A (scoped root modifier).** It leak-proofs the whole category
with a single convention and keeps layout in CSS. Option B is only competitive if
the sole surviving deviation is a single scalar (e.g. just padding) — in which case
reusing the height precedent verbatim is reasonable. Final pick is contingent on
how much of HSR survives the Decision-1 / pivotal-question pass; record the choice
here before implementing.

**VERDICT (final):** The pivotal question was settled by the maintainer: HSR's
divergence is **drift, not intentional**. So the change takes the "if drift" branch
— **canonicalize-and-delete, no override mechanism at all.** One canonical body
layout lives in `card.css` (`padding: md md 0`, name `margin-bottom: spacing-3`, no
body gap, shared border+shadow+image-scale hover); **all four games**, HSR included,
contribute zero body-layout CSS. HSR's three former deviations — `.game-card-body`
(`padding: lg md; gap: md`), `.game-card:hover` (card lift), and
`.game-card-static-line` (`min-height`) — are **deleted outright**, and the `is-hsr`
root modifier is removed. This is strictly superior to Option A/B: zero overrides →
zero leak surface → zero copy-paste. Option A (scoped `.game-card.is-hsr`) was an
interim implementation while HSR's intent was unconfirmed; once confirmed as drift,
the scoped overrides were dropped entirely. Net effect: HSR adopts the shared
layout/hover; the leak is gone because no game declares any bare or scoped
shared-class structural override.

### Decision 3 — HSR `.game-card:hover` is fixed regardless of the layout outcome

The bare `.game-card:hover { transform }` was an unambiguous leak. With HSR
confirmed as drift, it is **deleted**; HSR uses the shared border+shadow+image-scale
hover from `card.css` like the other three games. (Had HSR's layout been
intentional, this would instead have been scoped to `.game-card.is-hsr:hover` — but
that path was not taken.)

## Rejected alternatives

- **CSS Modules / scoped-by-tooling.** Correct in the abstract but a large
  migration; the codebase is committed to plain token-driven CSS. Out of scope.
- **Leave it; just patch each missing override** (what the AE stop-gap did).
  Treats the symptom, not the load-order leak; the next new game repeats the bug.
- **Keep the `shared-card-base` allowance as-is.** It is the literal sanction for
  the leak (lines 20–21). Leaving it means the spec contradicts
  `shared-card-collapse`'s own leak-proofing rationale.

## Out of scope

Game-prefixed class families (`.ae-class-*`, `.hsr-*`, badge tints) are already
game-scoped and do **not** leak — untouched. Party card hovers use `.party-card`,
a different class — untouched.
