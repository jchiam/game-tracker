## Context

`useThieves.getFilteredRoster(searchTerm, sortBy, predicate?)` already accepts an optional roster predicate, and `P5xPage` already wires one filter chip through it: `roseGateFilter` state → `🌹 Gated` chip → predicate `(t) => t.skillsLeveled && !t.roseMaxed`, composed in `filteredGetRoster`. The `RosterPageLayout` renders a `filterRow` slot; the P5X page passes a `.filter-row` with the rose chip. This change adds a second chip of the same shape.

After `p5x-require-weapon-rarity` lands, `weaponRarity` is a non-null integer in {2,3,4,5}, so "weak weapon" is exactly `weaponRarity < 5`.

## Goals / Non-Goals

**Goals:**

- Add a `⚔ <5★` roster filter, composing with search, sort, and the rose filter (AND).

**Non-Goals:**

- No hook/service/DB change — the predicate seam already exists.
- No change to the shared `roster-predicate-filter` mechanism — it already supports multiple page-local chips.
- No weapon-rarity model change — that is the prerequisite `p5x-require-weapon-rarity` change.

## Decisions

**Compose the two chip predicates into the single `predicate` slot.** `getFilteredRoster` takes one predicate, so `P5xPage` builds it by AND-ing the active chips: `(t) => (!rose || rosePred(t)) && (!weapon || weaponPred(t))`. Passing `undefined` when neither chip is active preserves the current fast path. Alternative — widen `getFilteredRoster` to take an array of predicates — rejected as unnecessary; composition at the page is trivial and keeps the hook signature stable.

**Bare `weaponRarity < 5`, no null guard.** Correct only because `p5x-require-weapon-rarity` removes `null`. The proposal states the hard ordering dependency; a null guard here would be dead code once the prerequisite lands and could mask an accidental pre-ordering.

**`noMatchMessage` reflects active filters.** With two independent toggles the empty-state copy branches on which filter(s) are active (e.g. weak-weapon vs rose vs plain search). Keep it a small conditional in the page, consistent with the current rose-only branch.

## Risks / Trade-offs

- **Applied before the prerequisite** → `null < 5 === true` in JS would make untracked thieves match spuriously. Mitigated by the explicit ordering dependency in `proposal.md`; do not implement until `p5x-require-weapon-rarity` is archived.
- **Two chips, more empty-state combinations** → Minor; the branch stays readable.

## Open Questions

None — chip label (`⚔ <5★`), AND composition, and the `< 5` predicate are decided.
