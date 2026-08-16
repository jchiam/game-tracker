## Context

See `proposal.md` — Why. Current mechanics that shape the design:

- The grid is a live projection: `useRoster.filterRoster` (Fuse + favorited-first sort, `src/hooks/useRoster.ts`) is a `useCallback` over `trackedEntities`, so every edit changes its identity; pages layer predicate gates on top (`Reverse1999Page.tsx` `filteredGetRoster`); `useRosterView` memoizes `filterRoster(term, sortBy)` into `filteredRoster`. An edit therefore re-projects the grid synchronously.
- Cards are keyed by entity `id`, and `isEditing` lives inside `GameCardShell` — re-sorting preserves edit state; only unmount destroys it. `GameCardShell` has no entity id in its props.
- Filter state is page-local by spec (`roster-predicate-filter`); only R1999 and P5X have predicate filters, but LEVEL/SCORE sorts exist in all six games.
- `applyPatch` writes are optimistic against live state and debounce to the DB via `usePendingSaves` — persistence is untouched by this change.

## Goals / Non-Goals

**Goals:**

- One shared implementation of basis-aware projection in `useRosterView`; per-game wiring is config + a few call-site callbacks.
- Zero change to the data layer (`useRoster` state, services, persistence) beyond making `filterRoster` identity-stable.
- Non-filter games get order stability with wiring only (tracked array + commit signal); held affordance appears only where predicate filters exist.

**Non-Goals:**

- No persistence of held state or basis snapshots — page-local, resets on navigation (consistent with filter-state-is-page-local).
- No FLIP/positional animation of reordering cards; only the evicted-card exit is animated.
- No change to add/remove UX — adds appear immediately, removes leave immediately.

## Decisions

### D1 — Basis lives in `useRosterView`, not `useRoster`

The basis snapshot is a projection concern (view state), not a data concern. `useRoster` stays the single source of live truth; `useRosterView` keeps a `Map<id, TEntity>` of basis entities. Alternative — basis in `useRoster` — rejected: it would leak view semantics into the data hook shared by parties and would outlive the page-local lifetime the filter spec mandates.

### D2 — `filterRoster` gains an entities override and becomes identity-stable

`useRoster.filterRoster(searchTerm, secondaryCompare, entities?)` runs over `entities ?? trackedRef.current` and drops `trackedEntities` from its deps (the ref already exists). This is load-bearing twice over:

1. `useRosterView` can run the same projection against the basis array (membership/order) and against live entities (held detection) without duplicating Fuse/sort/predicate logic.
2. Page-level `filteredGetRoster` identity then changes **only** when a filter chip toggles — which is exactly the refresh-all-bases trigger. Without this, every edit would cascade a new `filterRoster` identity into the hook and refresh bases, silently defeating the whole mechanism.

### D3 — Refresh-all is keyed off existing memo deps

All bases refresh when `[filterRoster identity, searchTerm, sortBy]` change — chip toggle, search typing, sort cycling, and page remount all flow through these already. No new "projection changed" plumbing. View switch and DB reload also land here (remount / new tracked array with fresh ids).

### D4 — Membership from basis, content from live, by id join

```
basisMembership = filterRoster(term, sort, basisEntities)      → ordered ids
filteredRoster  = basisMembership.map(id → liveById.get(id))   → live objects
```

- Live object missing (entity removed) → drops from the grid immediately.
- Live entity absent from the basis map (newly added) → auto-enrolled with basis = live, so adds appear immediately.
- The rendered object is always live — this is the trap the explore session flagged: splicing back stale objects makes sliders snap back under the finger. Never render from the basis.

### D5 — Held detection by membership diff, not predicate introspection

`heldIds = basisMembership − liveMembership` (the same projection run against live entities). The hook never needs to know which gate failed; pages that want ghost-tag copy pass `describeHeld?: (entity) => string | null` (they own the gates and their labels). Non-filter games pass nothing and can never produce a held card (their basis/live memberships only diverge on order).

### D6 — Commit signal: optional `onEditCommit` on `GameCardShell`

Shell fires it on the ✓ collapse (isEditing true→false). The entity id stays at the call site — `onEditCommit={() => refreshBasis(arcanist.id)}` — keeping the shell entity-agnostic. Equipment-modal close and favorite toggle are page-level wiring: the page calls `refreshBasis(id)` in its close handler / wraps its favorite updater. Alternative — shell takes `entityId` — rejected: adds a prop with exactly one consumer pattern and no other use.

### D7 — Exit animation via a transient exiting set

On a release that evicts, the id moves to an `exiting` set; the card renders (from its last basis-membership slot) with an `is-exiting` class and is dropped on `animationend` with a timeout fallback. The keyframes live in `animations.css` under the existing global `prefers-reduced-motion` kill switch. Alternative — immediate unmount, no animation — kept as the reduced-motion path.

### D9 — `trackedEntities` is a required config field (implementation-revealed)

Once `filterRoster` is identity-stable (D2), `useRosterView` has no dep left that changes on entity edits — an "unwired" game's memo would go stale and its grid would stop reflecting edits. The live tracked array is therefore required config, passed by all six pages in this change; the optional fields are only the held/commit extras (`describeHeld`, and the page-side wiring).

### D8 — Delivery order

Shared mechanics + R1999 first (the reported case: both a predicate filter and a LEVEL sort), then P5X (second filter game), then wiring-only passes for HSR/N2E/AE/ZZZ (order stability + modal-close releases). Each game lands independently because every new prop/config field is optional.

## Risks / Trade-offs

- [Projection runs twice per render (basis + live) — Fuse instantiated twice] → Same asymptotics as today (Fuse was already rebuilt per call); skip the live pass entirely when no predicate filter is configured, since order-only divergence needs no held detection.
- [`filterRoster` identity-stability regression — someone re-adds a dep and every edit refreshes bases] → Scenario "Entity edit does not re-project" in the `shared-roster` delta is the regression test; hook test asserts referential stability across edits.
- [Held card confuses the user into thinking the filter is broken] → The dim + ghost tag names the filter; releasing via ✓ is the same gesture that already ends editing.
- [Newly qualifying entities don't appear until a basis refresh] → Accepted and specified; in practice unreachable (you edit rendered cards), and any chip/search/sort touch heals it.
- [Exiting cards can be interacted with mid-animation] → `is-exiting` sets `pointer-events: none`.
- [Favorite-toggle instant reorder while the same card is mid-edit] → Favorite is outside edit mode by design (header star); if both happen, basis refresh on the toggle re-evaluates membership too — consistent, specified behaviour.

## Open Questions

- Exact ghost-tag copy per game (R1999: "no longer matches 💠 Resonating", P5X equivalents) — settle at implementation with the page's existing chip labels.
- Whether the held dim uses a dedicated token or an existing overlay token — decide in `card.css` against the token-first rule.
