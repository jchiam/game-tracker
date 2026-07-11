## Context

`savePreferenceRows` (rosterPersistence.ts) is deliberately the only implementation of the delete-then-reinsert preference transaction. But the codec on both sides leaked per game: rows→chain (`toStatPreferences` byte-identical in HSR/N2E; P5X's `mapRow` category-switch) and chain→rows (three hand-built insert-row builders). Variance is column names plus one static column per chain (HSR `slot`, P5X `category`). The two sides also disagree on `order_index`: HSR/N2E re-derive from array position; P5X persists the UI's stored `orderIndex`, and the shared `StatChain` (`PreferenceChain.tsx:59-74`) never renumbers — `remove()` keeps stale indices, `add()` assigns `next.length` — so delete-then-add produces duplicate `order_index`. P5X's embedded select has no order clause on joined rows, so reload order of tied rows is nondeterministic, and since `operator` binds a stat to the _next_ one, a tie swap silently changes chain semantics.

Decisions below were grilled interactively (2026-07-11); user overrode the no-migration recommendation on decision 2.

## Goals / Non-Goals

**Goals:**

- One implementation of chain serialization (`chainToRows`) and reconstruction (`rowsToChain`), living beside `savePreferenceRows`.
- All three games' preference chains write normalized `order_index` (`0..n-1` from array position) and reload deterministically.
- Uniform operator column name (`operator_to_next`) across all preference tables — codec carries zero column-name knobs.
- HSR `defaultRelics` aliasing hardening (rider).

**Non-Goals:**

- No change to the non-atomic delete-then-reinsert transaction itself (Known Limitations entry stands; future RPC fix still has one site).
- No modeling of scalar values in the codec (parent-column updates, P5X set-category rows) — they stay per-game glue.
- No change to `StatPreference`'s `orderIndex` field in the domain type (dropping it in favor of pure array position touches UI + types; separate change if ever).
- No renumbering added to the `StatChain` UI — persistence normalizes, which is sufficient.

## Decisions

**1. `order_index` is re-derived from array position on write (`(pref, idx) => idx`).** Array order is the truth the user sees; stored `orderIndex` is UI bookkeeping that goes stale. Matches existing HSR/N2E behavior; for P5X it is a bugfix (duplicate-index reload nondeterminism + operator-semantics flip). Existing degenerate DB rows self-heal on next save via delete-then-reinsert. _Alternative — persist stored `orderIndex` and renumber in the UI:_ rejected; fixes one producer instead of the seam, and leaves HSR/N2E/P5X write semantics divergent.

**2. Migrate `p5x_revelation_preferences.operator` → `operator_to_next` (user decision, overriding the config-knob recommendation).** Buys a knob-free codec and a uniform schema vocabulary. Cost: one rename migration plus a deploy-ordering window where live code and schema disagree — accepted; migration and code land in one commit and the rename is instant in Postgres. The codec hardcodes `operator_to_next`.

**3. Codec models chains only.** A chain is the repeated, ordered, operator-linked structure duplicated across all three games on both sides — a real seam (3 adapters). Scalars already exist in two dialects (parent columns for HSR/N2E/P5X comments and set ids; child category rows for P5X heavens/space) and appear once each — extracting them fails the deletion test (complexity would reappear in one game, not N). _Alternatives rejected:_ a `scalarToRow` helper (single consumer = hypothetical seam); a declarative "preference document" schema (interface as complex as the three functions it replaces — textbook shallow, and it would freeze both scalar dialects into a shared grammar).

**Codec interface** (rosterPersistence.ts, exported beside `savePreferenceRows`):

```ts
export function rowsToChain(raw: PreferenceRowLike[]): StatPreference[];
// sort by order_index → { stat, operator: operator_to_next, orderIndex: order_index }

export function chainToRows(
  chain: StatPreference[],
  opts: { dbId: string; fkColumn: string; extra?: Record<string, unknown> },
): Record<string, unknown>[];
// { [fkColumn]: dbId, ...extra, stat, operator_to_next: operator, order_index: idx }
```

Call-site shapes: HSR main stats `MAIN_STAT_SLOTS.flatMap((slot) => chainToRows(prefs.mainStats[slot], { dbId, fkColumn, extra: { slot } }))`; P5X `chainToRows(prefs.mainStats.moon, { dbId, fkColumn: 'thief_row_id', extra: { category: 'moon_main' } })`. P5X read converges to HSR's shape: `rowsToChain(prefRows.filter((p) => p.category === 'moon_main'))` — the category-switch dies.

## Risks / Trade-offs

- **Deploy-ordering window (migration vs deployed code)** → land migration + code in one commit; window is the gap between applying the migration and Vercel finishing the deploy (or vice versa). During it, P5X preference saves/loads error and surface a toast; retry after both land succeeds. Accepted by decision 2.
- **P5X write behavioral change (normalized `order_index`)** → byte-identical rows for well-formed chains; degenerate chains now persist `0..n-1` — strictly better (deterministic reload). Covered by a regression test.
- **Codec is modest-depth (~10-line bodies)** → justified by the deletion test: deleting it re-scatters the ordering invariant across three games ×2 sides, where both real preference bugs (P5X aliasing, P5X reload-reorder) have lived.
- **`rowsToChain` keeps `orderIndex` on the domain type while writes ignore it** → mild redundancy, accepted (Non-Goal) to avoid a types/UI ripple.
