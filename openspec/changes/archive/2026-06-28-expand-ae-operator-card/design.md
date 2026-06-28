## Context

This change reworks AE operator tracked fields. The decisions below were settled
in an explore session; this file records the _why_ so the rationale survives.

## Decisions

### Phase replaces potential (not added alongside)

The card already tracked `potential` 0–5 with a P0–P5 button row — structurally
identical to the requested "Phase" (0–5, portrait-style). Rather than carry two
near-identical dimensions, "Phase" reuses the existing one.

- **0-based** (Phase 0 = no investment / base, max Phase 5), matching the prior
  `potential` range and R:1999 portrait P0–P5. Default 0, no range change.
- **DB**: `RENAME COLUMN potential TO phase` rather than add-new + drop-old. This
  preserves existing rows but **reinterprets** stored `potential` values as
  `phase`. Acceptable because the two are semantically the same 0–5 investment
  axis for this app; the migration comment states the reinterpretation explicitly.

Alternative rejected: keep `potential` and add a separate `phase`. Rejected to
avoid two redundant 0–5 dimensions on the card.

### `weapon` field kept; equipped weapon is `weaponName` + `weaponLevel`

`AeOperator.weapon` already holds the weapon _class_ (Sword / Greatsword / Polearm
/ Handcannon / Arts Unit) and is rendered as a badge. The tracked equipped weapon is a separate
concept. Rather than rename `weapon` → `weaponType` (which would ripple through the
catalog, badge, and any party UI), the intrinsic field keeps its name and the
tracked item uses new field names.

- `weaponName: string | null` — stores the **display name** (mirrors R:1999
  `psychubeName`), not the weapon id. Consistent with existing code; the tradeoff
  is brittleness if a weapon is ever renamed in the catalog (acceptable for a
  hand-authored catalog).
- `weaponLevel: number` — 1–90 (AE weapon cap), default 1. Persists across
  un-equip, matching R:1999 psychube behavior.

### Weapon picker is filtered by class

AE restricts weapons to an operator's weapon class. The picker shows only
`ALL_WEAPONS` entries whose `type` exactly string-matches the operator's `weapon`
value. This makes `type` the join key and requires the two vocabularies to stay in
sync (enforced by the weapon-catalog spec's exact-match contract).

Alternative rejected: universal weapons (psychube-style, any-on-any). Rejected
because it misrepresents AE's equip rules.

### Weapons catalog: full launch list, hand-authored, name + rarity + type only

No structured AE data source exists, so `ALL_WEAPONS` is hand-authored like
`ALL_OPERATORS` — same tech debt tracked by `add-ae-data-pipeline`. Scope is the
full known launch weapon list. No `imageUrl` / image pipeline in this change: the
dropdown and card show text (name + rarity) only, matching R:1999 psychube
rendering.

### Skills maxing is a single boolean

Modeled on HSR's all-traces-attained flag — no per-skill granularity, per the
explicit request. One `skillsMaxed` boolean, surfaced as a `ConfirmCheckbox` in
edit mode and a `Skills ✓/✗` chip in the collapsed summary.

### Rarity stays in data; only the card chip is removed

Rarity is still a catalog field (potential future sort/badge), but the `★`
`rarity-indicator` chip is removed from the card because rarity is not an
investment signal and the card composition spec previously special-cased it.
