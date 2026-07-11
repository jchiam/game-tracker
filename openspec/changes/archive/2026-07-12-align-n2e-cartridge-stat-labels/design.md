## Context

N2E stat labels flow: everness.info GraphQL API (`mainStatCore.name`, `subStats.name`) → `orderN2eStats` (reorders only, never renames) → generated `cartridge-stats.ts` → cartridge editor / preference chain / scorer, all keyed off the raw string. The strings are also **persisted** in the DB (`cartridge_main_stat`, `cartridge_sub_stats[]`, and the `n2e_cartridge_preference_{main,sub}_stats.stat` child tables), so a rename is both a codegen change and a stored-data-compat change.

## The rename map

Confirmed against in-game display by the game owner. Not a single rule — two sub-rules:

| everness.info (old)                                                 | in-game (new)         | rule                                                |
| ------------------------------------------------------------------- | --------------------- | --------------------------------------------------- |
| `ATK %`, `HP %`, `DEF %`                                            | `ATK%`, `HP%`, `DEF%` | strip the space (keep `%`; flat counterpart exists) |
| `CRIT Rate %`                                                       | `CRIT Rate`           | drop ` %`                                           |
| `CRIT DMG %`                                                        | `CRIT DMG`            | drop ` %`                                           |
| `Cosmos/Anima/Incantation/Psyche/Chaos/Lakshana/Mental DMG Bonus %` | `… DMG Bonus`         | drop ` %`                                           |
| `Universal DMG Bonus %`                                             | `DMG%`                | game labels the universal substat plainly `DMG%`    |
| `Healing Bonus %`                                                   | `Healing Bonus`       | drop ` %`                                           |
| `ATK`, `HP`, `DEF` (flat), `Break Intensity`, `Cycle Intensity`     | unchanged             | —                                                   |

14 renamed, 6 unchanged. Because it is not a uniform transform, it is authored as an **explicit map** — consistent with the codebase's "explicit list, never keyword inference" stance in `statOrder.mjs`.

## Decision: normalize at generation time

The rename is applied inside `orderN2eStats` (via a new `N2E_STAT_RENAME` in `statOrder.mjs`, applied before ordering), and `N2E_STAT_ORDER` is rewritten in the new labels. Result: the generated `cartridge-stats.ts` carries in-game labels directly; no runtime translation for the _option lists_ or the _scorer vocabulary_ (its keys are just updated to the new strings).

- Existing safety holds: any API stat absent from `N2E_STAT_RENAME` passes through unchanged, and any label absent from `N2E_STAT_ORDER` trips the `unlistedStats` warning and sorts to the end — a newly-added in-game stat still surfaces for manual placement.

Rejected: a runtime display-only label map over the old generated strings. It would leave the _stored/scored_ vocabulary on the old strings and require translating on every render, permanently — more surface than normalizing once at the source.

## Decision: back-compat by read-time remap (not migration)

Existing DB rows hold old labels. Chosen approach: a small `N2E_STAT_RENAME` (TS) applied in the load path of `characterService.ts` — `fromRow` remaps `cartridge_main_stat` and each `cartridge_sub_stats[]` entry; the preference-chain mapping remaps each `stat`. After load, the rest of the app only ever sees in-game labels, so option lists, the scorer shape map, and the readout all match.

- **Chosen over a SQL migration** because it is reversible, writes nothing, and this is a live single-user personal deployment where a botched string `UPDATE` across an array column + two child tables is riskier than a pure read-time map. New saves already write new labels, so the legacy set is bounded and shrinks naturally.
- **Cost:** the rename pairs exist twice — once in `statOrder.mjs` (generation, `.mjs`) and once in TS (runtime back-compat), because the Node script cannot import the TS module. Mitigated by a unit test that imports both and asserts the TS map is a superset of the mjs pairs, so they cannot silently diverge.
- A future migration can retire the TS remap once no legacy-labelled rows remain; out of scope here.

## Regeneration scope

`node scripts/update-n2e-data.mjs` also rewrites `characters.ts` / `arcs.ts` / `cartridges.ts` from the live API. Only the `cartridge-stats.ts` label diff is in scope; a reviewer should confirm any incidental catalog diff is a legitimate upstream change before including it.
