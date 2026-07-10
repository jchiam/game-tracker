# Design

## Context

Stat labels are player-facing text but also persisted identity. `EquippedRevelation.mainStat`,
`RevelationStat.type`, and the preference `stat` column all store the label string verbatim.
The current P5X labels are community-guide shorthand, not the in-game strings. Correcting them
by naive rename would orphan any already-saved row (its stored string no longer matches a
`Select` option → blank row). The user chose the robust path: decouple stored id from shown
label, in the shared primitives, so the fidelity rule holds for every current and future game.

## Goals / Non-goals

**Goals**

- P5X stat labels render verbatim in-game text (`Damage Mult. +`, `Crit Mult.`, `Attack%`, …).
- Stored value is a stable id; label is a pure display concern resolved through one map.
- The id/label seam lives in the shared build-preference primitives, not P5X-only.
- No saved P5X row breaks (backfill migration).

**Non-goals**

- Re-labelling HSR / N2E (they already match their own in-game text). Their call sites keep
  passing `string[]`; only the _option-type_ widens, behaviour is identical.
- Converting HSR/N2E to id/label storage now. The primitive supports it; adopting it per game
  is future work, not this change.
- Adding or removing stats beyond the confirmed corrections (no scoring or completeness pass).

## Decisions

### D1 — id/label seam in the shared primitives

`Select` and `PreferenceChain` ranked-list mode already accept
`readonly (string | { value, label })[]`. Widen `SubStatList` and `PreferenceChain`
**stat-chain** mode to the same union. Normalization is local: `normalizeOption(o)` →
`{ value, label }` where a bare string yields `{ value: o, label: o }`. Rows render `label`,
`onChange` emits `value`. `excludeValues` and the equipped-main filter compare against `value`
(the id). Because a bare `string[]` still normalizes to value === label, HSR and N2E are
untouched.

Alternative rejected — _P5X-local rename (D2)_: cheaper, but leaves storage coupled to labels,
so the fidelity rule can't be enforced for future games. The user's part-2 goal
("standardise across all current and future games") requires the seam to be shared.

### D2 — single label map, id arrays

`revelations.ts` exports:

- `STAT_LABELS: Record<string, string>` — the one source of truth for id → in-game label.
- `MAIN_STATS: Record<Uppercase<RevelationSlot>, string[]>` and `SUB_STATS: string[]` — **ids**.
- `toStatOptions(ids: readonly string[]): { value: string; label: string }[]` — maps ids to
  option objects via `STAT_LABELS`, for feeding `Select` / `SubStatList` / `PreferenceChain`.

Card summary and any other display resolves a stored id with `STAT_LABELS[id] ?? id` (the
fallback keeps an unknown/legacy id visible rather than blank).

Alternative rejected — arrays of `{ id, label }` objects inline: duplicates the label across
main and sub pools; a single map keeps one authority and a trivial reverse map for migration.

### D3 — ids are kebab-case, derived once

Ids (14): `attack`, `attack-pct`, `defense`, `defense-pct`, `hp`, `hp-pct`, `hp-recovery`,
`damage-mult`, `crit-rate`, `crit-mult`, `ailment-acc`, `speed`, `sp-recovery`,
`pierce-rate`. Stable forever; labels may be re-pinned without a migration once decoupled.

### D3a — Space slot has two fixed mains, not stored

In-game a Space card carries two fixed main stats, Attack and Defense (both flat), with no
player choice. `EquippedRevelation.mainStat: string | null` can hold only one string, and there
is nothing to persist for a fixed pair — so `MAIN_STATS.SPACE = ['attack', 'defense']` is a
**display constant**: the editor renders both as read-only rows (generalising Sun's single fixed
`hp`), `mainStat` stays `null` for Space cards, and no Space main is written. The fictional
`attack-and-defense` combined id is removed. Preferences already exclude Sun and Space, so the
preference layer is unaffected.

Alternative rejected — widen `mainStat` to `string[]`: churns the type, DB column, and every
slot's read/write path to model a constant that never varies. Deriving from the slot constant is
strictly simpler.

### D4 — backfill migration, old-string → id

A one-time SQL migration maps the old verbatim strings to new ids across:

- `p5x_revelation_cards.main_stat` (TEXT) — direct string replace per map entry.
- `p5x_revelation_cards.sub_stats` (JSONB array of `{type,value}`) — rewrite each element's
  `type`.
- `p5x_revelation_preferences.stat` **only where `category` in
  ('moon_main','star_main','sky_main','sub_stats')** — the `heavens_set` / `space_set`
  categories store set ids and are left untouched.

Old → new map (migration + any load-time safety net):
`ATK→attack`, `ATK%→attack-pct`, `DEF→defense`, `DEF%→defense-pct`, `HP→hp`, `HP%→hp-pct`,
`HP Recovery%→hp-recovery`, `DMG Multiplier%→damage-mult`, `Ailment Accuracy%→ailment-acc`,
`Crit Rate%→crit-rate`, `Crit Multiplier%→crit-mult`, `Speed→speed`, `SP Recovery%→sp-recovery`,
`Pierce Rate%→pierce-rate`. The obsolete Space main `'ATK & DEF'` has no id — Space card
`main_stat` is set to `NULL` (mains now fixed and derived); Space `sub_stats` are still rewritten
to ids.

## Risks

- **Migration correctness** is the only real risk — a JSONB rewrite over `sub_stats`. P5X is
  newly launched with a small roster, and the mapping is exhaustive over the old pool. Verify
  with a before/after row count and a spot query in a review step; the load-time
  `STAT_LABELS[id] ?? id` fallback means a missed row shows the raw id, never a crash.
- **Catalog accuracy** — the pool is the corrected old set (13 substats, `hp-recovery` main-only).
  `Attack Mult.` is a character effect, not a card substat, and is deliberately excluded.
