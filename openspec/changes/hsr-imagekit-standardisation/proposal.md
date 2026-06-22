## Why

Honkai Star Rail is the only game that stores character portraits and relic icons locally in `public/assets/`, shipping ~16M of images with every build. All other games (Reverse: 1999, Neverness to Everness, Arknights: Endfield) upload their assets to ImageKit CDN and reference them at runtime.

## What Changes

- Add ImageKit upload phase to `scripts/update-hsr-data.mjs` for character portraits and relic icons
- Add `getRelicIconUrl()` to `src/lib/imagekit.ts` (no-transform CDN resolver, mirrors `getPsychubeUrl()`)
- Wrap `char.imageUrl` with `getMugshotUrl()` in `CharacterCard.tsx`
- Wrap relic `set.icon` with `getRelicIconUrl()` in `CharacterCard.tsx`, replacing the GitHub raw URL fallback logic
- Delete `public/assets/honkai-star-rail/characters/` and `public/assets/honkai-star-rail/relics/` from the repo after migration

## Capabilities

### New Capabilities

- `hsr-imagekit-upload`: Upload HSR character portraits and relic icons to ImageKit as part of the update script; resolve them via `imagekit.ts` at render time

### Modified Capabilities

- None

## Impact

- `scripts/update-hsr-data.mjs` — gains ImageKit upload phase for characters and relics
- `src/lib/imagekit.ts` — new `getRelicIconUrl()` function
- `src/pages/honkai-star-rail/components/CharacterCard.tsx` — image resolution updated for both character portraits and relic icons
- `public/assets/honkai-star-rail/characters/` — 82 files (~14M) removed from repo
- `public/assets/honkai-star-rail/relics/` — 58 files (~1.6M) removed from repo
- No DB schema changes, no API changes, no new external dependencies
