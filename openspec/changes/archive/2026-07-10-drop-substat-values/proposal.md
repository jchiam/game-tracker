## Why

Substats are tracked as `{ type, value }` in two games — HSR relics (`RelicStat.value: string`) and P5X revelations (`RevelationStat.value: number`) — but the numeric/text **value** is never used: relic and cartridge scoring match on stat **type** only, and no surface derives anything from the magnitude. N2E cartridges already track substats as bare type strings (`cartridgeSubStats: string[]`) and work fine. The value field is dead weight: extra editor inputs, extra DB columns/JSONB shape, and an inconsistent model across the three games that track substats.

This change stops tracking substat values everywhere. Substats become a plain list of stat **types**, matching N2E's existing model. Which stats a piece has is still tracked; how much of each stat is not.

## What Changes

- **HSR relics:** `EquippedRelic.subStats` goes from `RelicStat[]` (`{ type, value }`) to `string[]` (stat type ids). The `RelicStat` interface is removed.
- **P5X revelations:** `EquippedRevelation.subStats` goes from `RevelationStat[]` (`{ type, value }`) to `string[]`. The `RevelationStat` interface is removed.
- **N2E cartridges:** already `string[]` — unchanged.
- **Shared `SubStatList`:** the `stat-value` variant loses its last consumers (HSR + P5X switch to `stat-only`; N2E already `stat-only`). The `stat-value` variant, its `SubStatValue` interface, and the free-text value `<input>` are removed. `SubStatList` becomes a single-shape `stat-only` component.
- **Editors:** `RelicEditorModal` and `RevelationEditorModal` switch their `SubStatList` to `variant="stat-only"` and drop value handling. Card summaries (`CharacterCard`, `ThiefCard`) stop rendering substat values.
- **Scoring:** no logic change — `relicScoring` / `cartridgeScoring` already ignore values. Score % and tier badges are unaffected.
- **BREAKING (data):** substat values are persisted. Migrations drop them:
  - HSR: drop the `stat_value` column from `hsr_relic_substats` (rows keyed by `stat_type` survive).
  - P5X: reshape `p5x_revelation_cards.sub_stats` JSONB from `[{type,value}]` to `["type", …]` (array of id strings), preserving order.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `hsr-character-detail`: relic `subStats` shape changes from `{ type, value }[]` to `string[]`.
- `p5x-revelation-tracking`: revelation `subStats` shape changes to `string[]`; the `sub_stats` JSONB column shape changes; a migration reshapes existing rows.
- `shared-ui-components`: `SubStatList` drops the `stat-value` variant, becoming `stat-only`-only.

## Impact

- **Types:** `src/types.ts` (P5X patch/interface refs), `src/data/honkai-star-rail/relics.ts` (remove `RelicStat`), `src/data/persona-5-phantom-x/revelations.ts` (remove `RevelationStat`).
- **Component:** `src/components/SubStatList.tsx` + `.stories.tsx` + `.test.tsx` (remove `stat-value` variant).
- **Editors/cards:** `RelicEditorModal.tsx`, `RevelationEditorModal.tsx`, `CharacterCard.tsx` (HSR), `ThiefCard.tsx` (P5X), plus their tests.
- **Services:** `honkai-star-rail/characterService.ts` (drop `stat_value` from select/insert), `persona-5-phantom-x/thiefService.ts` (sub_stats mapping to `string[]`).
- **DB migrations:** one HSR (`ALTER TABLE hsr_relic_substats DROP COLUMN stat_value`), one P5X (JSONB reshape of `p5x_revelation_cards.sub_stats`).
- **Specs:** `hsr-character-detail`, `p5x-revelation-tracking`, `shared-ui-components`.
- **Non-goals:** main stats (already valueless), build-preference chains (already valueless, unchanged), N2E cartridges (already `string[]`), scoring logic.
