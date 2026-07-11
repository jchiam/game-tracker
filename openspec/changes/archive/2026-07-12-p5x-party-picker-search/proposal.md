## Why

The P5X roster search matches phantom thieves by both name and codename (e.g. "Joker" finds Ren Amamiya) because it runs Fuse over `['name', 'codename', 'personaName', 'role', 'element']`. The create-party member picker uses a different, name-only exact-substring filter, so the same "Joker" search returns nothing. The two search surfaces for the same catalog behave inconsistently.

## What Changes

- Add an optional `searchKeys: string[]` seam to the shared `PartyViewConfig`, threaded through `PartiesView` into `PartyEditorModal`.
- Replace the member picker's name-only `.includes()` filter with a Fuse pass over `searchKeys` (threshold `0.3`, matching the roster). The existing already-added exclusion and per-slot `entityFilter` remain as post-filters.
- When a game omits `searchKeys`, the picker defaults to `['name']` — fuzzy name match. **BREAKING (behavioural):** games not opting in shift from exact-substring to fuzzy name matching; no game currently relies on substring-only semantics.
- Wire P5X to full roster parity: `searchKeys: ['name', 'codename', 'personaName', 'role', 'element']`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-parties`: the party member picker gains a configurable, multi-field fuzzy search (new requirement); currently only name-substring behaviour is implied by the slot-filter requirements.

## Impact

- `src/components/parties/PartiesView.tsx` — add `searchKeys` to `PartyViewConfig`, pass to editor.
- `src/components/parties/PartyEditorModal.tsx` — swap substring filter for Fuse over `searchKeys`.
- `src/pages/persona-5-phantom-x/components/partyConfig.ts` — set P5X `searchKeys`.
- All games' party pickers shift default matching from substring to fuzzy name (no config change on their part).
- Adds `fuse.js` import to `PartyEditorModal` (already a project dependency; used by roster search).
