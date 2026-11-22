# Design

## Context

See `proposal.md` for motivation. Constraints that shape the approach:

- The combatant **list** stays on Game8; only art changes source. Ids, `imageUrl` paths, and the catalog shape must not move, because tracked rows key on ids.
- The app renders roster cards through the shared `getMugshotUrl` (top-anchored square, 480 px cap). The repo rule is "no CZN-specific resolver" for portraits.
- Meta Decks portraits are 804×924 with a transparent margin (about 18% on top) and a figure that fills roughly the middle of the frame. The same CDN serves a 124² face icon per unit (`face/character/face_character_{charId}.webp`).
- A dry run on this branch produced all 40 portraits and faces locally. Its scripts (scratchpad `czn-dry-run.mjs`, `czn-faces.mjs`) are the reference implementation for the trim and the match.
- `ensureAsset` in `scripts/lib/pipeline.mjs` owns the skip-or-upload skeleton; per-asset loops supply a fetch closure.

## Goals / Non-Goals

**Goals:**

- Sharp, frameless portraits on roster cards without a CZN-specific portrait resolver.
- A readable face in party slots and picker rows.
- A weekly run that costs no more than today when nothing is new.
- A Meta Decks outage or a unit it lacks degrades to today's art, never to a broken run.

**Non-Goals:**

- Partner and Memory Fragment set art. They stay on Prydwen and Game8.
- Upgrading art automatically once it was uploaded from a fallback source. As today, an existing asset is skipped; the fix is a manual reupload run.
- Persisting the Meta Decks `charId` in the catalog.
- Using the 1580×720 cut-in art.

## Decisions

### D1. Trim portraits at upload instead of adding a portrait resolver

The script trims the fully transparent margin (`sharp().trim()`) before upload. The trimmed image starts at the top of the figure, so the shared `MUGSHOT_CROP` frames it correctly and the "no CZN-specific resolver" rule holds for portraits.

Alternative: upload untrimmed and add a CZN mugshot transform with an extract box. Rejected: the box differs per unit, so it would need per-unit data in the app.

The face crop is cut from the **untrimmed** portrait, so override boxes are stated in stable 804×924 coordinates.

### D2. Face crop by template match, with the icon as fallback

The 124² face icon is a scaled crop of the same portrait. The script downsizes the icon to a 31 px template and slides it over the portrait at candidate scales (source square 90–420 px, 6 px steps), scoring mean absolute error on pixels premultiplied onto black. The best region is cut from the portrait at full resolution and capped at 256 px. In the dry run this gave 156–198 px squares.

- Threshold: 26 (mean absolute error per channel). Measured over all 40 combatants, a correct match scored 6.1–23.2, and the best region for another unit's icon scored 29.0 at the lowest (36 or more for the other 39). All 40 now crop from the portrait, `tiphera` (23.2) included. Above the threshold the 124² icon is uploaded, which is always the right face.
- The match is pure (buffers in, box and score out), so it is unit-tested against synthetic cut-outs drawn in the test. No game art is committed as a fixture.

Alternatives:

- ImageKit `fo-face` on the portrait. Rejected: face detection is unreliable on illustrated art, and it cannot be verified before upload.
- Upload the 124² icon only. Rejected as the default: soft above 1× in a ~105 px slot. Kept as the fallback.
- A fixed bust crop like N2E's `BUST_CROP`. Rejected: head position varies too much (props above the head, off-centre poses), which would need an override for most units.

### D3. Face path derived, not stored

`getCznCombatantFaceUrl(imageUrl)` maps `/combatants/` to `/combatant-faces/`. `CznCombatant` and `combatants.ts` are unchanged, so the generated catalog shows no diff from this change.

Alternative: a `faceUrl` field in the catalog. Rejected: it is fully determined by `id`, and it would touch the type, the codegen, the seed shape, and every fixture.

### D4. Join by name, with an override seed (how other games do it)

Survey of the existing scripts:

| Game              | Cross-source join                                                | Escape hatch                             |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| R1999             | secondary art (CN headicons) matched by name, several strategies | in-script `NAME_OVERRIDES`               |
| N2E               | crop from splash art by fixed box                                | in-script `CROP_OVERRIDES` keyed by slug |
| N2E / P5X / R1999 | pin map `sourceId → id`, bootstrapped by name                    | — (the source mints the ids)             |
| CZN today         | Prydwen art joined by minted name slug                           | `czn-id-pins.json` keyed by `game8Id`    |

The pin-map pattern exists where the pinned source **mints catalog ids**. Meta Decks mints nothing here, so persisting `charId` would add a catalog field with no reader. The R1999 pattern fits: join by name, override by hand.

So: join on normalized name (lowercase, alphanumerics only) or on `slugify(name) === id`. The second arm covers a Game8 respelling that is pinned to an id minted from the older spelling. CZN keeps curated data in seeds rather than in-script maps, so the escape hatch is `scripts/seeds/czn-art-overrides.json`, which also carries the N2E-style manual crop box:

```json
{
  "combatants": [
    {
      "id": "tiphera",
      "charId": "30084",
      "face": { "left": 310, "top": 150, "side": 190 },
      "note": "…"
    }
  ]
}
```

`charId` and `face` are each optional. Validation lives beside the other seed rules in `scripts/lib/czn-seeds.mjs`. The seed starts empty: all 40 join by name today.

Alternative: extend `czn-id-pins.json` with a `charId`. Rejected: that file answers "which id does this Game8 item keep", a different question with a different key.

### D5. Fallback chain and failure rules

Portrait order per combatant: Meta Decks → Prydwen `cardImage`/`smallImage` → Game8 `imageUrl`. Overlay seed entries keep `imageSource`.

- Meta Decks catalog failure without a reupload flag: warn, every entry uses the old chain. With `--reupload-combatants` / `--reupload-combatant-faces` / `--reupload-all`: abort, so good art is never overwritten by icons or fallback squares. This mirrors the existing Prydwen rule, which stays.
- Prydwen is fetched only when at least one combatant lacks a Meta Decks portrait, which removes 40 detail fetches from the normal run.
- A per-unit miss (Meta Decks lacks one unit) warns and falls back, even under reupload.
- The Meta Decks `released` flag is ignored. Game8 decides what is released; Meta Decks only supplies art.

### D6. Two `ensureAsset` loops, face work inside the fetch closure

Portraits and faces are separate assets with separate skip checks. The face loop's fetch closure downloads the portrait and icon and runs the match, so that work happens only when the face asset is missing or forced (about 2 s per unit; 70 s for all 40). Flags: `--reupload-combatants` forces both loops, `--reupload-combatant-faces` forces faces only, `--reupload-all` forces everything.

### D7. Module layout

- `scripts/lib/czn-metadecks.mjs`: locate the hashed catalog URL in the characters page HTML, parse the catalog, build the name index, build CDN URLs. Pure functions over strings and JSON, tested with a page fixture and a catalog fixture.
- `scripts/lib/czn-face-crop.mjs`: `trimPortrait`, `locateFace`, `cutFace`. Pure functions over buffers, tested with image fixtures.
- `scripts/lib/czn-combatant-art.mjs`: the source order, the degrade-or-abort rules (D5), the reupload modes, and the face asset loop (D6), with every fetcher and `ensureAsset` injected. Added after verification so the failure-rule scenarios have automated tests.
- `scripts/update-czn-data.mjs`: orchestration only.

No downloaded JavaScript is evaluated; the catalog URL is found by regex and the catalog is JSON.

## Risks / Trade-offs

- [Meta Decks is a single-maintainer fan site serving extracted game assets, with no stated licence for reuse] → Art is copied to ImageKit, so the app never depends on the site at run time. The generated-file banner credits it. An outage or takedown degrades to the previous sources.
- [CDN paths are unhashed and conventional (`portrait_character_{charId}.webp`), not listed in the catalog] → A 404 is a per-asset `failed` in `ensureAsset`, listed as missing and retried on the next run. Nothing is uploaded from a worse source in its place, because an uploaded asset is never upgraded automatically.
- [The catalog URL is scraped from page HTML] → Shape drift throws a named error, handled by the D5 failure rule.
- [A confident but wrong face match] → The conservative threshold, the run output naming every icon fallback, the contact-sheet check in the migration plan, and the `face` override.
- [Uneven roster framing: narrow sources (`adelheid`, `mika`) zoom in, wide-prop units show a smaller figure] → Accepted after the dry run review. No per-unit portrait override in this change.
- [Portraits are uncensored game art] → Accepted by the owner in the dry run review.
- [A unit first uploaded from a fallback source keeps that art] → Same behaviour as today; the run warns when a unit joins no Meta Decks entry, and a reupload run fixes it.
- [`ar-1-1` crop of a trimmed image narrower than tall] → This is the intended case; a trimmed image wider than tall would crop its sides, and none of the 40 are.

## Migration Plan

1. Merge the code with the dry-run assets removed. Until step 2 runs, production keeps the old portraits, and party slots request face assets that do not exist yet. So step 2 must run **before** the PR merges to `main`.
2. From the branch, run `node scripts/update-czn-data.mjs --reupload-combatants`. This replaces 40 portraits in place and uploads 40 faces. It needs the owner's explicit go-ahead because it overwrites live assets.
3. Check the roster and parties views against production ImageKit (normal `npm run dev`), and compare face crops with the icons.
4. Purge the ImageKit cache for the 40 replaced portrait URLs (done 2026-11-22: mugshot, 128 px avatar, and untransformed forms, 120 requests), then clear the browser cache. Waiting is not an option: URLs are served with a one-year `max-age`.

Rollback: the previous sources are still wired as the fallback, but nothing restores old art automatically. Keep a local copy of the 40 current originals (`?tr=orig-true`) before step 2; re-upload them to roll back portraits. Reverting the two app files restores the old party slot images.
