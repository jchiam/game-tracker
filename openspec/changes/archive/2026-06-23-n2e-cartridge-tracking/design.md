## Context

The N2E tracker currently models cartridges as anonymous stat rolls attached to a character — rarity, level, main stat, and up to four sub stats — with no notion of which named cartridge set is equipped. The game's cartridge system (called "kongmu" in the source data) is a gear system where a named Core piece (e.g. "Lost Radiance") carries a set bonus, and the same named set exists at three rarities (B/A/S). The `everness.info` GraphQL API exposes this data via the `shards` query filtered to `type_id === 'core'`, yielding 12 named sets × 3 rarities = 36 entries.

The existing weekly update script (`scripts/update-n2e-data.mjs`) already fetches characters, arcs, and cartridge stat lists from the same API. The arc tracking pattern (`arcId` as a foreign key into `ALL_ARCS` + scalars for level/tier) is the direct analogue for what cartridge tracking needs.

## Goals / Non-Goals

**Goals:**

- Add named cartridge identity (`cartridgeId`) as a tracked field alongside the existing stat roll fields
- Add a single named-cartridge preference field inside `cartridgePreferences`
- Revise the scoring algorithm to weight set identity (0.35), main stat (0.30), and sub stats (0.35), with rarity-aware partial credit on the set match
- Generate `cartridges.ts` via the weekly update script — no manual catalog maintenance
- UX: name picker → rarity picker in `CartridgeEditorModal` (mirrors how the game presents the gear)

**Non-Goals:**

- Module shard pieces (the non-core shaped pieces) — out of scope; cartridge = core only
- Cartridge icons/images — name + rarity badge is sufficient
- Set bonus effect text — display only, not tracked or scored
- Module grid layout tracking — separate system, separate change if needed

## Decisions

### D1: Cartridge ID format — unified `{base}_{quality}` key

The API returns IDs in the form `"Cosmos_orange"`, `"Cosmos_purple"`, `"Cosmos_blue"`. We store the full rarity-qualified ID as `cartridgeId` (e.g. `"Cosmos_orange"` = Lost Radiance S-rank).

**Alternative considered:** Store base ID (`"Cosmos"`) + rarity separately, mirroring `arcId`/`arcLevel`. Rejected because rarity is intrinsic to cartridge identity in the catalog (different rarity = different droppable item), whereas arc level is user-controlled progression on a single item.

**Implication for scoring:** The rarity-aware match strips the suffix to compare set identity, then compares the suffix to compute the delta penalty. This is a pure scoring concern and doesn't affect the stored value.

### D2: Picker UX — name-first, then rarity

The `CartridgeEditorModal` equip tab shows a name dropdown (12 entries) first, then a B/A/S rarity selector. Selecting a name + rarity together fully determines `cartridgeId`.

**Alternative considered:** Single combined dropdown of all 36 entries (e.g. "Lost Radiance (S)"). Rejected because users think in terms of "I have Lost Radiance" then separately "at what rarity" — matching how the game's farming workflow works.

### D3: Single preferred cartridge, not a priority chain

`cartridgePreferences.cartridgeId` is a single nullable string, not a `StatPreference[]` chain.

**Rationale:** A character targeting a specific set is almost always farming one set. Multi-set flex is an edge case better expressed in the comments field. A chain would add UI/storage complexity without proportionate value. This mirrors the arc model (single `arcId`).

### D4: Scoring formula — three-term weighted sum

```
score = cartridgeIdMatch(0.35) + mainStatMatch(0.30) + subStatMatch(0.35)
```

Rarity-aware cartridgeId match:

- Same set, same or better rarity: 1.0
- Same set, one rarity below preferred: 0.6
- Same set, two rarities below preferred: 0.3
- Wrong set: 0.0

When no `cartridgeId` preference is set, the cartridgeId term contributes 0 and the formula degrades gracefully (max reachable score = 65 — correctly signals "stat quality OK but set unknown").

**Alternative considered:** Renormalise weights when cartridgeId pref is absent (treat it as 2-term). Rejected to keep the formula unconditional and the 65-cap semantically meaningful (user can see they're missing a set preference).

### D5: Update script — no image pipeline

Cartridge catalog entries carry only `id`, `name`, `rarity`. Icons are derived from `set_effect.setIcon` in the API but the UI requires only a name + rarity badge. Skipping the image download/ImageKit upload step avoids adding `--reupload-cartridges` flag complexity and keeps the catalog change purely a TypeScript file diff.

### D6: DB migration — additive column, no backfill

`ALTER TABLE n2e_tracked_characters ADD COLUMN cartridge_id TEXT` — nullable, no default. Existing rows read as `null` which maps to "no named cartridge selected", same as the new default. No data migration required.

## Risks / Trade-offs

- **Scoring weight change breaks existing scores** → Existing characters with only stat preferences will see scores drop (max 65 instead of 100 until they set a cartridge preference). Mitigated: the score badge is informational; users will prompt to fill in the preference. Could add a UI hint on the score badge when cartridgeId pref is absent.
- **API ID format could change** → The `{base}_{quality}` format is stable across the current 36 entries but is not a documented contract. The update script diff report will surface any ID changes on the next weekly run.
- **`saveCartridgePreferences` is non-atomic** → Known limitation documented in `shared-save-behaviour` spec. The new `cartridgeId` preference is stored in the same `cartridge_preferences` object and goes through the same delete-then-reinsert path. Risk profile is unchanged.

## Migration Plan

1. Deploy DB migration (`ADD COLUMN cartridge_id TEXT`) — safe, additive.
2. Deploy app (Vercel auto-deploy on main) — new `cartridgeId` field reads as `null` for all existing rows; UI shows "No Cartridge Selected" in name picker; score drops gracefully for characters with only stat preferences.
3. No rollback complexity — column is nullable; old app version ignores unknown columns in the select result.

## Open Questions

None — all design decisions resolved during explore session.
