## 1. imagekit.ts — Add getRelicIconUrl

- [x] 1.1 Add `getRelicIconUrl(localPath: string): string` to `src/lib/imagekit.ts`, mirroring `getPsychubeUrl` (no-transform CDN resolver, falls back to local path when `VITE_IMAGEKIT_URL` is unset)

## 2. Update script — Add ImageKit upload phase

- [x] 2.1 Read `scripts/update-r1999-data.mjs` (or `update-n2e-data.mjs`) to understand the ImageKit upload helper pattern used by other games
- [x] 2.2 Add ImageKit upload for character portraits in `scripts/update-hsr-data.mjs` — upload to `/honkai_star_rail/characters/{id}.webp`, skip if already exists
- [x] 2.3 Add ImageKit upload for relic icons in `scripts/update-hsr-data.mjs` — upload to `/honkai_star_rail/relics/{id}.{ext}`, skip if already exists

## 3. CharacterCard — Wire up imagekit resolution

- [x] 3.1 Import `getMugshotUrl` and `getRelicIconUrl` in `src/pages/honkai-star-rail/components/CharacterCard.tsx`
- [x] 3.2 Wrap `char.imageUrl` with `getMugshotUrl()` for the character portrait `<img>` src
- [x] 3.3 Replace the inline `iconUrl` construction logic (including GitHub raw URL fallback) with `getRelicIconUrl(set.icon)`

## 4. Migration — Upload and verify

- [x] 4.1 Run `scripts/update-hsr-data.mjs` (or trigger workflow dispatch) to populate ImageKit with all character portraits and relic icons — run manually: `node scripts/update-hsr-data.mjs`
- [x] 4.2 Verify character portraits render correctly in the browser (dev server, with `VITE_IMAGEKIT_URL` set)
- [x] 4.3 Verify relic icons render correctly in a CharacterCard with relics equipped
- [x] 4.4 Verify dev fallback works with `VITE_IMAGEKIT_URL` unset (local paths resolve correctly — note: local files still present at this point)

## 5. Cleanup — Remove local files from repo

- [x] 5.1 Delete `public/assets/honkai-star-rail/characters/` directory (82 files, ~14M)
- [x] 5.2 Delete `public/assets/honkai-star-rail/relics/` directory (58 files, ~1.6M)
- [x] 5.3 Confirm `public/assets/honkai-star-rail/selection-cover.png` is still present
- [x] 5.4 Run `npm run build` to confirm build succeeds without local image files

## 6. Tests and lint

- [x] 6.1 Run `npm run lint && npm run format:check` — fix any issues
- [x] 6.2 Run `npm test` — confirm no regressions
