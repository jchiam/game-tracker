## Why

Stat-option dropdowns (equip main/sub selectors, preference chains) render options in
catalog-array order, but that order is unspecified and inconsistent: HSR groups flat-then-percent,
N2E interleaves (straight from its data API), P5X was hand-ordered ad hoc. A player scanning three
different games sees three different sequences with no shared logic.

Give every game the **same game-agnostic semantic order** so the dropdowns read consistently:
offensive stats first, then defensive, then tempo, then supporting. This is a pure **display**
concern — option _sequence_ only. No stored value changes, so there is **no migration and no
persistence risk** (unlike the label change this builds on).

## What Changes

- **Define one semantic ordering taxonomy** (below), documented once and applied by every game's
  stat pools. Bucket sequence: **Offensive → Defensive → Tempo → Supporting**; within a bucket,
  flat before its percent variant, else master-list order.
- **Reorder the catalog pools** to match: HSR `relics.ts`, P5X `revelations.ts` (hand-authored —
  reorder the arrays), N2E `cartridge-stats.ts` (auto-generated — the generator gets an explicit
  taxonomy-ordered label list and sorts by it; the committed file is brought in line with that
  list, not freehand-edited).
- **Covers `MAIN_STATS` too**, not just `SUB_STATS` — same rule, every pool. _Decision: in scope
  (the ask was "across the board"); flag for veto if you only want substats._
- **Enforcement test** pins each game's pool to its literal expected order — doubles as the
  drift-guard when N2E regenerates.
- **No classifier / no runtime sort.** Ordering is explicit data, not inferred: an unlisted future
  stat sorts to the end and fails the test (loud), rather than being silently misplaced.

### Semantic ordering taxonomy (master order)

```
1  OFFENSIVE   flat ATK · ATK% · CRIT Rate · CRIT DMG/Mult · DMG bonus/multiplier
               (Damage Mult, elemental DMG, Universal DMG) · Break (Effect/Intensity) · Pierce/Pen
2  DEFENSIVE   flat HP · HP% · flat DEF · DEF% · Effect RES
3  TEMPO       Speed/SPD · action gauge (Cycle Intensity) · resource recovery (SP/Energy Regen)
4  SUPPORTING  Healing (HP Recovery, Outgoing Healing, Healing Bonus) · debuff application
               (Effect Hit Rate, Ailment Accuracy)
```

### Resulting sub-stat dropdowns

- **P5X:** ATK, ATK%, CRIT Rate, CRIT Mult, Damage Mult. +, Pierce Rate, HP, HP%, DEF, DEF%, Speed, SP Recovery, Ailment Acc.
- **HSR:** ATK, ATK%, CRIT Rate, CRIT DMG, Break Effect, HP, HP%, DEF, DEF%, Effect RES, SPD, Effect Hit Rate
- **N2E:** ATK, ATK %, CRIT Rate %, CRIT DMG %, Universal DMG Bonus %, Break Intensity, HP, HP %, DEF, DEF %, Cycle Intensity

⚠ This moves HSR/N2E off their in-game panel order — a deliberate, conscious UX shift toward the
shared semantic order.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `shared-ui-components`: add a **Semantic stat-option ordering** requirement — the 4-bucket
  taxonomy every game's stat pool (main + sub) follows; ordering is explicit in the catalog data,
  rendered as-is by the shared primitives (no runtime sort).
- `p5x-revelation-catalog`: the per-slot main pools and shared substat pool are pinned in the new
  semantic order.

## Impact

- `src/data/honkai-star-rail/relics.ts` — `MAIN_STATS` (per slot) + `SUB_STATS` reordered.
- `src/data/persona-5-phantom-x/revelations.ts` — `MAIN_STATS` (per slot) + `SUB_STATS` reordered.
- `src/data/neverness-to-everness/cartridge-stats.ts` — `CARTRIDGE_MAIN_STATS` + `CARTRIDGE_SUB_STATS` reordered to match the generator's new list.
- `scripts/update-n2e-data.mjs` — add an explicit taxonomy-ordered N2E label list; sort emitted stats by index in it, unmatched appended (so a new stat surfaces at the end, not silently placed).
- New `src/data/statOrder.test.ts` (or per-game catalog tests) — pins each game's `SUB_STATS`/`MAIN_STATS` to literal expected arrays.
- `CONTEXT.md` — extend Stat-Label Fidelity to **Stat Fidelity** (labels _and_ semantic order).
- No DB, service, hook, type, or migration changes. Existing editor/behaviour tests must stay green (only sequence changes).
