## Why

P5X endgame revolves around Revelation Card optimisation — choosing sets, farming main stats, and rolling substats across 5 card slots per Thief. The tracker currently has no way to record this, leaving a major investment dimension invisible. This mirrors HSR relics (already tracked per-slot) and brings P5X to feature parity.

## What Changes

- Add per-Thief Revelation Card tracking: 5 slots (Sun, Moon, Star, Sky, Space), each storing set, main stat, and up to 4 substats with values.
- Add a static catalog of Revelation Card sets (12 Heavens, 8+ Space) with their set effects.
- Add a static catalog of valid main stats per slot and the shared substat pool.
- Add DB schema (migration) for revelation card storage.
- Add UI: per-slot card editor on ThiefCard (edit mode), summary chips showing equipped sets (collapsed mode).
- Add build-preference tracking: preferred Heavens set, preferred Space set, preferred main stats per slot (Moon/Star/Sky), preferred substats — using the existing `StatPreference` / `savePreferenceRows` pattern.

## Capabilities

### New Capabilities

- `p5x-revelation-catalog`: Static catalog of Revelation Card sets (Heavens + Space), per-slot main stat pools, and shared substat pool.
- `p5x-revelation-tracking`: Per-Thief per-slot equipped Revelation Card state (set, main stat, substats) — DB schema, service, hook integration, and card UI.
- `p5x-revelation-preferences`: Build-preference chains for preferred sets and stat priorities — reuses shared `savePreferenceRows` pattern.

### Modified Capabilities

- `p5x-thief-detail`: Add revelation slots to the tracked thief type, card summary chips, and edit sections.

## Impact

- **Types**: Extend `P5xTrackedThief` and `P5xThiefPatch` with revelation fields.
- **Data layer**: New file `src/data/persona-5-phantom-x/revelations.ts` (sets + stat pools).
- **DB**: New migration adding revelation columns or a `p5x_revelation_cards` table + preference rows table.
- **Service layer**: Extend `thiefService.ts` with revelation CRUD (or new `revelationService.ts`).
- **Hook layer**: Extend `useThieves.ts` with revelation updaters.
- **UI**: Extend `ThiefCard.tsx` with revelation summary + edit section; possibly a dedicated `RevelationEditor` component.
- **Update script**: Extend `update-p5x-data.mjs` to scrape set catalog from Prydwen if sets change over time.
