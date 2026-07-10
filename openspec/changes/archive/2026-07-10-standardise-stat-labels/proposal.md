## Why

P5X Revelation stat labels drifted from the in-game strings. They were seeded from a
community _build guide_, so the guide's shorthand leaked in: `DMG Multiplier%`,
`Pierce Rate%`, `Crit Multiplier%`, `ATK`. The game itself renders these as
`Damage Mult. +`, `Pierce Rate`, `Crit Mult.`, `Attack` — it keeps the
stat noun full and abbreviates the trailing modifier (Multiplier → `Mult.`, Accuracy →
`Acc.`), and puts `%` (no space) only on the plain Attack/Defense/HP percent variants.
The tracker should show what the player sees in-game.

The old catalog also mis-modelled the Space slot as a single `ATK & DEF` main stat. In-game a
Space card has **two fixed main stats — Attack and Defense** (both flat, non-selectable). That is
a structural fix, not just a relabel.

This also exposes a cross-game gap. HSR (`CRIT DMG`, `HP%`) and N2E (`CRIT DMG %`) already
match _their_ in-game text, but nothing enforces it, and stat labels are **stored verbatim
in the DB** (`main_stat`, `sub_stats[].type`, preference `stat`). A relabel silently breaks
every saved row that held the old string. For "match in-game across all current and future
games" to be a real standard rather than a one-off P5X patch, the id a row stores must be
decoupled from the label the UI shows — and that decoupling has to live in the shared
build-preference primitives, not in P5X alone.

## What Changes

- **Shared primitives gain id/label options.** Extend `SubStatList` and `PreferenceChain`
  (stat-chain mode) to accept `options: readonly (string | { value, label })[]`, mirroring
  what `Select` and `PreferenceChain` ranked-list mode already support: the option `value`
  is the stored id, the `label` is what's shown. `string` options keep value === label, so
  HSR and N2E call sites are unchanged.
- **P5X stat catalog decouples id from label.** `MAIN_STATS` / `SUB_STATS` in
  `revelations.ts` become stable kebab ids; a single `STAT_LABELS` map holds the verbatim
  in-game label per id. Every P5X surface (equip editor, preference chains, card summary)
  resolves id → label through that one map.
- **Labels corrected to the in-game strings** (pinned below). The old single mult entry becomes
  `Damage Mult. +` (`damage-mult`); there is no `Attack Mult.` substat (it is a character effect,
  not a card substat).
- **Space slot re-modelled** — two fixed main stats (Attack + Defense), non-selectable and not
  stored (`mainStat` stays `null`); derived for display from `MAIN_STATS.SPACE`. The fictional
  `attack-and-defense` id is dropped.
- **One-time DB backfill migration** rewrites existing `p5x_revelation_cards.main_stat`,
  `sub_stats[].type`, and `p5x_revelation_preferences.stat` from old label strings to the
  new ids, so no saved row breaks.
- **Stat-label-fidelity rule documented** in `CONTEXT.md` and enforced as a shared
  requirement: each game's stat labels are the verbatim in-game strings for that game;
  storage uses stable ids decoupled from labels.

### Pinned P5X labels (id → in-game label)

| id            | label         | id            | label            |
| ------------- | ------------- | ------------- | ---------------- |
| `attack`      | `Attack`      | `damage-mult` | `Damage Mult. +` |
| `attack-pct`  | `Attack%`     | `crit-rate`   | `Crit Rate`      |
| `defense`     | `Defense`     | `crit-mult`   | `Crit Mult.`     |
| `defense-pct` | `Defense%`    | `ailment-acc` | `Ailment Acc.`   |
| `hp`          | `HP`          | `speed`       | `Speed`          |
| `hp-pct`      | `HP%`         | `sp-recovery` | `SP Recovery`    |
| `hp-recovery` | `HP Recovery` | `pierce-rate` | `Pierce Rate`    |

14 stat ids total. Per-slot main pools: SUN `[hp]` (one fixed); MOON `[attack-pct, defense-pct,
hp-pct, hp-recovery, damage-mult]`; STAR `[attack-pct, defense-pct, hp-pct, crit-rate, crit-mult,
ailment-acc]`; SKY `[attack-pct, defense-pct, hp-pct, speed, sp-recovery]`; SPACE `[attack,
defense]` (two fixed, non-selectable, not stored). Substat pool: 13 ids — everything except
`hp-recovery` (main-only): `attack, attack-pct, defense, defense-pct, hp, hp-pct,
damage-mult, ailment-acc, crit-rate, crit-mult, speed, sp-recovery, pierce-rate`.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `shared-ui-components`: `SubStatList` and `PreferenceChain` (stat-chain mode) accept
  `{ value, label }` options in addition to bare strings; add a stat-label-fidelity
  requirement (in-game verbatim labels, id/label decoupled in storage).
- `p5x-revelation-catalog`: per-slot main pool and shared substat pool become id-keyed with
  a `STAT_LABELS` map holding verbatim in-game labels; corrected strings.
- `p5x-revelation-tracking`: `EquippedRevelation.mainStat` and `RevelationStat.type` store
  stat **ids**; DB backfill migration rewrites existing label strings to ids.
- `p5x-revelation-preferences`: main-stat and substat preference chains store stat ids;
  `savePreferenceRows` persists ids in `stat`.

## Impact

- `src/components/SubStatList.tsx`, `src/components/PreferenceChain.tsx` — option type
  widened to `string | { value, label }`; internal normalize; `excludeValues` compares ids.
- `src/components/SubStatList.stories.tsx`, `PreferenceChain.stories.tsx` — id/label variant.
- `src/data/persona-5-phantom-x/revelations.ts` — `MAIN_STATS`/`SUB_STATS` as ids +
  `STAT_LABELS` map + `toStatOptions` helper; corrected labels.
- `src/pages/persona-5-phantom-x/components/RevelationEditorModal.tsx` — pass
  `{ value, label }` options; resolve labels via `STAT_LABELS`.
- `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` — summary resolves stat ids to
  labels (only if it renders stat strings; verify).
- `supabase/migrations/<ts>_p5x_stat_label_backfill.sql` — old-string → id rewrite for
  `p5x_revelation_cards` (main_stat, sub_stats JSONB) and `p5x_revelation_preferences`
  (stat, main/sub categories only — set categories store set ids, untouched).
- `CONTEXT.md` — add the stat-label-fidelity rule.
- HSR relic + N2E cartridge editors — **no change** (still pass `string[]`); their tests
  must stay green. Existing P5X revelation tests updated to the id/label shape.
