## Context

All games except HSR upload their image assets to ImageKit CDN during the update script phase and resolve CDN URLs at render time via `src/lib/imagekit.ts`. HSR downloads character portraits (~14M, 82 files) and relic icons (~1.6M, 58 files) directly into `public/assets/` and serves them as static files. This inflates the build artifact and diverges from the established pattern.

The imagekit.ts library already handles the local-path → CDN-URL resolution pattern. `getMugshotUrl()` applies a `fo-top,ar-1-1` crop for variable-aspect sources (R1999). `getPsychubeUrl()` is a no-transform CDN resolver for already-square artwork. HSR images are already square icons — the no-transform pattern is the right fit.

## Goals / Non-Goals

**Goals:**

- Upload HSR character portraits and relic icons to ImageKit during `update-hsr-data.mjs`
- Resolve them via `imagekit.ts` at render time in `CharacterCard.tsx`
- Remove the ~15.6M of static image files from `public/assets/honkai-star-rail/`
- Keep the data layer unchanged (local paths stay in `characters.ts` / `relic_sets.ts`)

**Non-Goals:**

- Changing HSR selection cover (all games keep this local — intentional)
- Adding image transforms for HSR (source images are already square icons)
- Touching R1999 / N2E / Endfield image pipelines
- Changing the Supabase schema or any data layer types

## Decisions

**Use `getMugshotUrl()` for character portraits, not a new function.**
Character portraits are already square icons; `getMugshotUrl()` with no effective transform resolves them via CDN just as `getPsychubeUrl()` does. A dedicated `getCharacterIconUrl()` would add noise — the existing function already works. Precedent: N2E characters go through `getMugshotUrl()` and their source images are also pre-cropped squares.

**Add `getRelicIconUrl()` as a new named function, not a generic `getCdnUrl()`.**
Mirrors `getPsychubeUrl()` naming convention. Each asset type having its own named function keeps callsites explicit and readable. A generic function would obscure intent and require callers to understand that "no transform" is the right choice.

**Integrate upload into `update-hsr-data.mjs`, not a separate seed script.**
Endfield used a one-shot `seed-endfield-images.mjs`. HSR already has a weekly GitHub Actions workflow — integrating upload there means new characters and relics auto-land on ImageKit without manual intervention. Mirror the R1999 / N2E pattern.

**Delete local copies after upload is wired up.**
No fallback-to-local needed: imagekit.ts already falls back to the raw local path if `VITE_IMAGEKIT_URL` is not set (dev without ImageKit configured still works). Once images are on ImageKit and the upload phase is in the script, the local files are redundant.

**ImageKit folder naming: snake_case, matching existing conventions.**
Existing paths: `/reverse_1999/arcanists_mugshots/`, `/neverness_to_everness/characters/`. HSR: `/honkai_star_rail/characters/` and `/honkai_star_rail/relics/`.

## Risks / Trade-offs

**Risk: Existing deployed images may not yet be on ImageKit when the component change ships.**
→ Mitigation: Run the upload phase of the update script manually (or via workflow dispatch) before merging the component changes. Sequence: upload first, delete local files second.

**Risk: ImageKit unavailable in dev without `VITE_IMAGEKIT_URL` set.**
→ Non-issue: `imagekit.ts` already falls back to local path when the env var is unset. Local files can be kept during development and only removed from the repo after upload is confirmed.

**Risk: Relic icon upload skipped for already-uploaded files (idempotency).**
→ Mitigation: Script checks ImageKit for existing files before uploading (same pattern as N2E / Endfield scripts). Re-running is safe.

## Migration Plan

1. Extend `update-hsr-data.mjs` with ImageKit upload for characters and relics
2. Run the script (or workflow dispatch) to populate ImageKit
3. Add `getRelicIconUrl()` to `imagekit.ts`
4. Update `CharacterCard.tsx` to use `getMugshotUrl()` and `getRelicIconUrl()`
5. Verify renders correctly in dev (with and without ImageKit URL set)
6. Delete `public/assets/honkai-star-rail/characters/` and `public/assets/honkai-star-rail/relics/`
7. Commit and push

Rollback: revert CharacterCard changes + restore local files from git. No DB changes to roll back.
