# Design

## Context

Recon 2026-11-21:

- `https://d2ankz0m1a0dsp.cloudfront.net/page-data/app-data.json` → `Last-Modified: Wed, 27 May 2026`. Detail page-data for `blazebell` → 404. P5X page-data on the same origin is frozen at 2026-04-27.
- `https://www.prydwen.gg/page-data/...` → `403`, `cf-mitigated: challenge`.
- `https://game8.co/games/Chaos-Zero-Nightmare/archives/558105` embeds `<div id="react-collection_browser-wrapper" data-react-props='{"view":"index","toolStructuralMappingId":"630",…,"toolStructuralMapping":{"id":"630","updatedAt":1794385866}}'>`. The collection-browser bundle fetches `/api/tool_structural_mappings/${id}.json?updatedAt=${updatedAt}`. Node's default `fetch` gets `200` for both.
- The JSON's `collectionArraySchema.collectionItems[]` carries `{ id, name, imageUrl, url, class, attribute, faction, rarity: "5★"|"4★", released: "Released", version, tierlist, cards }`. 40 items, all `Released`; class and attribute vocabularies equal Prydwen's.

## Decisions

### D1 — Game8 owns membership and taxonomy; Prydwen owns art

Game8 is current and structured; Prydwen's CloudFront copy is frozen but still has 262×358 card art for the 32 units it knows. Splitting by concern keeps the art quality and gets currency. Rejected: Game8 for everything (downgrades 32 portraits to 150 px icons on any reupload); Prydwen via a browser (cannot run in GitHub Actions).

### D2 — Mapping resolved per run from the page

The mapping id and `updatedAt` are read from the list page's `data-react-props` attribute each run (HTML-entity-decoded, then `JSON.parse` — data, not code). A missing wrapper, unparsable props, or missing `toolStructuralMapping.id` aborts naming the page. Same rule as the Prydwen static-query hash.

### D3 — Validation in a pure module

`scripts/lib/czn-game8.mjs` exports `extractCollectionMapping(html)` and `mapGame8Combatants(json)`. The mapper requires a non-empty `collectionArraySchema.collectionItems`, keeps `released === 'Released'`, parses rarity (`'5★'` → 5; only 4 or 5), reports `class` and `attribute` values outside the Prydwen-spelled lists (see D9), and throws naming the entry on a missing class/attribute or an unexpected rarity. `attribute` maps to `element`; `faction` is carried raw (`null` when empty). Unit-tested against a trimmed fixture of the real payload.

### D4 — Ids minted from names, guarded against churn

`id = slugify(name, '-')`, which equals every current Prydwen slug (verified 40/40). Because a Game8 rename would silently orphan tracked rows, the run aborts when a new catalog (combatants, Partners, or Memory Fragment sets) lacks an id present in the committed one, listing the ids; `--allow-removals` lets a deliberate removal through.

### D5 — Art join only on real Prydwen nodes; degrade unless reuploading

The Prydwen list is fetched; a Game8 entry joins a Prydwen node with the same slug only when that node's class and element are not `Unknown` (teasers like `fei`/`tenebria` carry no usable art). Detail page-data is fetched only for joined slugs. If the Prydwen list or a detail fetch fails, the run warns and every unjoined entry uses its Game8 `imageUrl` — except under `--reupload-combatants`/`--reupload-all`, where it aborts, because a reupload would replace card art with icons.

### D7 — Partners follow the same split

Game8's Partner list (`archives/558133`) uses the same collection tool. It owns the Partner list and taxonomy; Prydwen's static query supplies 160² icons joined by the id minted from Prydwen's name. Game8's Partner icons are similar in size, so the join mainly avoids re-uploading 44 assets.

### D8 — Id pins keyed by Game8 item id

Two Partners are spelled differently on Game8 than on Prydwen, so slugging Game8's name would change their committed ids. `scripts/seeds/czn-id-pins.json` maps Game8's numeric item id (stable across renames) to the committed id, through `mintId`'s existing `pinned` path. Pins are per-catalog (`combatants`, `partners`); malformed or duplicate pins abort; a pin matching no released item warns. Display names follow Game8. Rejected: keeping Prydwen's spelling via a name override (would hide Game8's corrections and needs the same table anyway).

### D9 — Unknown taxonomy warns, not aborts

`czn-combatant-catalog` and `czn-partner-catalog` define class/attribute as open data with a neutral-badge fallback. The Game8 mapper therefore emits an unknown value verbatim and the run warns naming it, so a respelling is visible in the auto-PR log. Only a missing class/attribute or an out-of-range rarity aborts.

### D6 — Seed kept as the escape hatch

The overlay seed mechanism is unchanged (validation, `imageSource`, upstream-wins collision) for a unit Game8 lags on; the shadow warning now says Game8. All current entries are shadowed and deleted, leaving `[]`.

## Risks

- Game8 may treat GitHub Actions IP ranges differently from a residential IP; the first scheduled run is the real check. A block fails the run loudly (non-zero, no catalog written).
- Game8 may restructure the collection tool; D2/D3 fail loudly rather than emit partial data.
