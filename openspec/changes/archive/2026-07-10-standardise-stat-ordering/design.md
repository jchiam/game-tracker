# Design

## Context

Stat dropdowns render options in catalog-array order. That order is currently arbitrary and
differs per game. We co-created a single game-agnostic semantic order (Offensive → Defensive →
Tempo → Supporting) and want it applied everywhere. This is display-only: no stored value moves,
so no migration.

## Goals / Non-goals

**Goals**

- One semantic ordering, identical logic across all games; documented once.
- Ordering is explicit data (the array _is_ the order); primitives render as-is.
- A new/unlisted stat fails loudly (sorts last + test breaks), never silently misplaced.

**Non-goals**

- No keyword classifier, no runtime sort helper. (See Decisions.)
- No persistence/migration — sequence-only change.
- Not re-pinning labels (done in the prior `standardise-stat-labels` change) — only order.

## Decisions

### D1 — Explicit list, not a classifier

Rejected a keyword classifier (~13 precedence rules mapping ~40 stat strings to buckets): it is
more code than the thing it orders and, worse, **silently misplaces** any stat its keywords don't
anticipate (`HP Recovery`→defensive, `Universal DMG`→unknown). Instead:

- **Hand-authored pools (HSR, P5X):** type the arrays in the confirmed order. Nothing infers.
- **Generated pool (N2E):** `update-n2e-data.mjs` holds an explicit array of N2E's stat labels in
  taxonomy order; it sorts the fetched stats by index in that list and **appends any unmatched at
  the end**. A new stat therefore appears last and the pinning test fails — a human then places it.
- **Enforcement:** a test pins each game's `SUB_STATS`/`MAIN_STATS` to a literal expected array. No
  classifier logic in the test; it just asserts the arrays. This also guards N2E regens.

Loud failure beats silent misclassification; an explicit list is verifiable by eye against one
array.

### D2 — The taxonomy (master order)

Bucket sequence Offensive → Defensive → Tempo → Supporting; within a bucket, flat before its
percent, else the order below. Judgment calls (user-decided): Break → Offensive; Speed/action-gauge
its own **Tempo** bucket after Defensive; debuff-application (Effect Hit Rate, Ailment Accuracy) →
Supporting; SP/Energy recovery → Tempo (resource-for-actions), distinct from HP Recovery → Supporting
(healing).

```
OFFENSIVE   ATK, ATK%, CRIT Rate, CRIT DMG/Mult, DMG bonus/multiplier, Break, Pierce
DEFENSIVE   HP, HP%, DEF, DEF%, Effect RES
TEMPO       Speed/SPD, action gauge, resource recovery (SP/Energy)
SUPPORTING  Healing (HP Recovery, Outgoing Healing, Healing Bonus), debuff application
```

### D3 — N2E generated file reconciled, pipeline not run

The N2E catalog is generated and network/ImageKit-heavy to regenerate. The generator's explicit
ordered list is the source of truth; the committed `cartridge-stats.ts` is reordered by hand to the
deterministic result of that list filtered to the present stats — verifiable against the one array,
not a freehand reordering. Next real regen reproduces it.

### D4 — Scope includes MAIN_STATS

The user's trigger was substat ordering (three sub orders confirmed). Mains follow the identical
rule; included under "across the board" but called out here so it can be vetoed. Fixed single-main
slots (HSR head/hands, P5X sun) and the P5X space dual (`attack, defense`, already
offensive-then-defensive) need no change.

## Risks

- **Low.** Display sequence only — no value moves, no migration. Worst case is a mis-typed array,
  caught by the pinning test and visible in review. HSR/N2E dropdowns visibly change order (the
  intended UX shift); editor behaviour tests assert content/behaviour, not sequence, so they stay
  green.
