# Design — drop-substat-values

## Context

Three games track equipped substats. Only two carry a value:

| Game | Field                         | Shape today                                    | Value used by anything?                 |
| ---- | ----------------------------- | ---------------------------------------------- | --------------------------------------- |
| HSR  | `EquippedRelic.subStats`      | `RelicStat[]` = `{ type, value: string }`      | No — `relicScoring` reads `.type` only  |
| P5X  | `EquippedRevelation.subStats` | `RevelationStat[]` = `{ type, value: number }` | No — no revelation score exists         |
| N2E  | `cartridgeSubStats`           | `string[]` (type ids)                          | No — `cartridgeScoring` reads type only |

N2E is already the target shape. The change makes HSR and P5X match it.

## Decision 1 — substat shape is `string[]`, not `{ type }[]`

`string[]` (bare stat-type ids) over `{ type: string }[]`:

- Byte-identical to N2E — one substat model across all three games.
- Kills the `RelicStat` and `RevelationStat` interfaces entirely rather than hollowing them out.
- The `{ type }[]` wrapper only earns its keep if we expect to re-add a per-substat field later; there is no such plan, and re-widening later is a mechanical change if it ever comes.

## Decision 2 — remove the `SubStatList` `stat-value` variant

After HSR + P5X switch to `stat-only`, no consumer uses `stat-value`. Rather than leave a dead variant (and its `SubStatValue` interface, value `<input>`, `placeholder` prop, and story/test), remove it. `SubStatList` collapses to a single shape: an ordered, bounded list of stat `Select` rows over `string[]`. The `shared-ui-components` spec is updated to match.

## Decision 3 — migrate stored values, don't leave them

Values are persisted; leaving them stranded would be inconsistent and confusing on next schema read.

- **HSR** — `hsr_relic_substats` is a child table with one row per substat (`stat_type`, `stat_value`). Drop the `stat_value` column; the `stat_type` rows are exactly the `string[]` we now load.
- **P5X** — `p5x_revelation_cards.sub_stats` is JSONB `[{type,value}, …]`. Reshape in place to `["type", …]` with `jsonb_agg(elem->>'type')` preserving element order, per row. Idempotent: re-running on an already-string array is a no-op (guard on element type / shape).

## What does NOT change

- Main stats (`mainStat`) — already a bare `string | null`, no value.
- Build-preference chains (`StatPreference` = `{ stat, operator, orderIndex }`) — already valueless.
- Scoring — score % and tier badges are logically untouched (matching is on stat type). One mechanical edit: `relicScoring.ts` read the type via `equippedSub.type`, now reads the bare string `equippedSub`. `cartridgeScoring` already matched on the bare string.
- N2E cartridge tracking — already `string[]`.

## Risks

- **P5X JSONB reshape** touches live rows. Migration must be order-preserving and idempotent; a bad rewrite could reorder or drop substats. Mitigate with `jsonb_agg(… ORDER BY ordinality)` over `jsonb_array_elements WITH ORDINALITY` and a shape guard.
- **Editor value-input removal** must not leave dangling `placeholder`/value props on `SubStatList` calls (TypeScript will catch via the discriminated-union collapse).
