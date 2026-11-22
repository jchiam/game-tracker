# Proposal

## Why

CZN combatant art is too small for desktop: 32 of 40 portraits are Prydwen's 262×358 card art (the card crop wants 480 px) and the other 8 are Game8's 150×150 icons with an orange frame baked in. Prydwen's origin has been frozen since May 2026, so every new unit lands on the framed icon. CZN Meta Decks (`cdn.czndecksmeta.com`) serves the game's own 804×924 transparent portraits and 124² face icons for all 40 combatants; a local dry run on this branch confirmed the roster and party views look right with them.

## What Changes

- Combatant portraits come from CZN Meta Decks first: the 804×924 transparent portrait, with its transparent margin trimmed so the default top-anchored card crop lands on the figure. The existing chain (Prydwen card art, then Game8 icon) stays as the fallback for a unit Meta Decks lacks or when the site is unreachable.
- A second asset per combatant, a square **face crop**, is produced by the update script and uploaded to ImageKit `chaos_zero_nightmare/combatant-faces`. The game's face icon locates the head in the portrait and the crop is cut from the portrait at full resolution; the icon itself is the fallback when the match is weak.
- Party slots and the party picker list show the face crop instead of the full-body portrait, through a new `getCznCombatantFaceUrl` resolver that derives the face path from `imageUrl`. `CznCombatant` keeps its shape.
- Combatants join to Meta Decks by name, with a hand-maintained override seed (`scripts/seeds/czn-art-overrides.json`) for a name that will not join or a face crop that needs a manual box. This follows how R1999 and N2E already handle the same two problems.
- The face crop is computed only when the face asset is missing or a reupload flag is passed. A new `--reupload-combatant-faces` flag redoes faces without touching portraits; `--reupload-combatants` redoes both.
- One-time production step: re-upload all 40 portraits and upload 40 face crops.

No breaking change: ids, asset paths, the catalog shape, and the database are untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `czn-data-pipeline`: the combatant art source order changes (Meta Decks first, existing sources as fallback), portraits are trimmed before upload, and the script gains the face-crop asset, the art override seed, and the `--reupload-combatant-faces` flag.
- `czn-combatant-catalog`: adds the derived face asset path and its resolver, and requires party slots and the party picker to use it.

## Impact

- `scripts/update-czn-data.mjs`, new `scripts/lib/czn-metadecks.mjs` and `scripts/lib/czn-face-crop.mjs` with tests and fixtures, new `scripts/seeds/czn-art-overrides.json`.
- `src/lib/imagekit.ts` (+ test) and `src/pages/chaos-zero-nightmare/components/PartiesTab.tsx` (+ test) — already edited on this branch during the dry run.
- ImageKit: 40 combatant portraits replaced in place, new folder `chaos_zero_nightmare/combatant-faces`.
- Docs: the `Catalog Data Sources (czn)` section of `CLAUDE.md`, `CONTEXT.md` where it names the CZN art source, `wiki/Data-Architecture.md` (wiki submodule), the script header, and the generated-file banner attribution.
- New external dependency at script run time only: `cznmetadecks.com` and `cdn.czndecksmeta.com`. The app still loads images from ImageKit, so the CSP is unchanged. `sharp` is already a dependency (N2E uses it for bust crops).
- No database migration, no new env var.
