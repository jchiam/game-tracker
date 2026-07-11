## Context

Two shared build-preference primitives and three equipment editors allow stat selections
the games forbid. The current state, per component:

| Concern           | `SubStatList` (equip substats)              | `PreferenceChain` stat-chain (priority) |
| ----------------- | ------------------------------------------- | --------------------------------------- |
| Exclude main stat | `excludeValues` prop — HSR ✓, P5X ✓, N2E ✗  | n/a (chains aren't slot-scoped)         |
| Sibling dedupe    | ✗ everywhere                                | ✗ (ranked-list mode ✓, stat-chain ✗)    |
| Add-button picks  | `firstAllowed` (skips `excludeValues` only) | always `options[0]`                     |

The retroactive prune (drop a substat that equals a newly chosen main) already runs in HSR
(`validateAndSave`) and P5X (`handleMainStatChange`); N2E's `cartridgeMainStat` handler does
not prune. Gating substats behind the main was the user's chosen fix for the pick-substat-
before-main flow, over silent-prune and prune-plus-toast.

## Goals / Non-Goals

**Goals**

- No new build definition can contain a substat equal to the slot main, a duplicate
  substat, or a duplicate stat in a priority chain.
- Fix N2E to HSR/P5X parity (exclude main + prune on main change).
- Keep enforcement in the shared primitives where it's cross-cutting (sibling dedupe), and
  in the editors where it's slot-specific (main exclusion, main-gate, prune).

**Non-Goals**

- No scoring, persistence, schema, data-catalog, or CSP change.
- No bulk migration of already-saved collisions — guards prevent new ones; the next
  main-stat edit prunes an existing collision.
- No change to `PreferenceChain` ranked-list mode (already dedupes).

## Decisions

### D1 — Sibling dedupe lives inside `SubStatList`, stacking with `excludeValues`

A row's selectable options are `options` minus (`excludeValues` ∪ other rows' current
values), always keeping the row's own current value visible so a pre-existing collision
stays editable rather than vanishing. `firstAllowed` (used by the add button) skips the same
combined exclusion set; when nothing remains, the add button is suppressed (same treatment
as the `atCap` and `disabled` cases). Dedupe is by option **value** (works for both bare-
string and `{ value, label }` options). This mirrors the logic ranked-list already uses, so
the two modes converge rather than diverge.

**Rejected:** deriving sibling exclusions in each editor and passing them via `excludeValues`.
That would push identical cross-row bookkeeping into three call sites and leave the primitive
still able to emit duplicates — the opposite of depth.

### D2 — Stat-chain dedupe mirrors ranked-list, not a new abstraction

`PreferenceChain` stat-chain reuses ranked-list's shape: per-row options exclude other rows'
stats (own kept); `add()` appends the first not-yet-chosen option instead of `options[0]`;
the add button is `disabled` when every option is taken. The operator-fixup convention
(append sets prior tail's operator to `>`, remove clears the new tail) is unchanged.
Duplicate stats in a priority chain are meaningless regardless of operator (including `OR`),
so dedupe is unconditional.

### D3 — Substats gate behind the main only on variable-main slots

The gate keys off the slot's **main-stat type**, not `card.mainStat` truthiness. A slot with
a fixed main (HSR head/hands, P5X Sun/Space) always has a known main and stays _set-gated
only_. A variable-main slot (HSR body/feet/sphere/rope, P5X Moon/Star/Sky, N2E cartridge)
adds a second gate: substats stay disabled/dimmed until the main select has a value.

This distinction is load-bearing for **P5X Space**: its dual fixed mains (Attack + Defense)
are _derived, not stored_, so `card.mainStat` is empty even when the main is fully known.
Gating Space's substats on `card.mainStat` truthiness would lock them forever. The rule is
therefore "gate variable-main substats behind main," implemented as `disabled={!hasSet ||
(isVariableMain && !mainChosen)}`.

### D4 — The substats-exclude-main invariant is enforced in all three editors

Each editor passes the slot's equipped main as `excludeValues` to `SubStatList` (N2E adds
this) and prunes any substat equal to a newly chosen main in its main-stat handler (N2E adds
this to the `cartridgeMainStat` branch; HSR/P5X already do it). The gate (D3) prevents the
pick-before-main collision; the prune catches the change-main-after-subs collision the gate
can't. Both are needed.

## Risks / Trade-offs

- **Extra click:** users must pick a main before substats on variable-main slots. Accepted —
  the user chose gating over post-hoc pruning.
- **Existing collisions in saved data** stay until the main is next edited. Acceptable: they
  were already scored as-is, and the prune resolves them on edit. No migration.
- **`options[0]` fallback in an exhausted add:** the add button is suppressed before this can
  fire, so `firstAllowed` returning `''` is unreachable via the UI; retained as a defensive
  default.

## Migration Plan

Additive UI-only change, no data or schema migration. Ship in one PR.

## Open Questions

None.
