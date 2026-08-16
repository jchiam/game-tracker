## Why

ZZZ agents track Drive Discs (Phase 2) but not W-Engines, so the roster cannot capture the other half of an agent's gear plan and the card score ignores whether the right engine is equipped. HSR already solved the identical problem for Light Cones (PRs #42/#43: preference-rank blend + card strip); Phase 3 replays that proven shape for ZZZ.

## What Changes

- Generate a static W-Engine catalog from the Enka store (`store/zzz/weapons.json`, names via `locs.json`) in `scripts/update-zzz-data.mjs`, with engine icons uploaded to ImageKit — a new fetch+map+emit section, same pattern as agents and disc suits.
- Track the equipped W-Engine per agent: catalog id, level (0–60), and Phase (P1–P5), stored as parent columns on `zzz_tracked_agents` (HSR `light_cone_*` shape).
- Add a ranked W-Engine preference list per agent (ordered ids, atomic `text[]` array column write via the plain field-update path — no preference rows), edited in a dedicated W-Engine modal replaying HSR's `LightConeEditorModal`.
- Render a W-Engine summary line and preference strip (icon tiles, rank badges, +N overflow, tap-for-caption — display-only tiles per the no-state-change convention) on the agent card, replaying HSR #43.
- Blend the W-Engine preference-rank term into the card score via a new `src/utils/zzzBuildScore.ts` (HSR `buildScore.ts` shape: 0.25 engine / 0.75 disc, active-side renormalization, fixed-step rank decay with floor). `discScoring.ts` is not touched; the card badge and SCORE sort switch from the raw disc score to the blended build score.
- W-Engine pickers filter by the agent's specialty (HSR path-filter precedent), since off-specialty engines lose their passive.

## Capabilities

### New Capabilities

- `zzz-wengine-catalog`: generated W-Engine catalog (id, name, rarity, specialty, icon), icon resolution, and catalog conventions.
- `zzz-build-scoring`: blended agent build score — disc score + W-Engine preference-rank term, weights, renormalization, sentinel semantics.

### Modified Capabilities

- `zzz-agent-detail`: new requirements for equipped W-Engine tracking (id/level/phase), ranked W-Engine preferences, the W-Engine editor modal, and the card summary line + preference strip; the roster sort-by-score requirement re-targets the blended build score.
- `zzz-disc-scoring`: the "Score badge on agent card" requirement moves to the blended build score (disc-score math itself unchanged).
- `zzz-data-pipeline`: new requirement for W-Engine catalog generation (weapons.json fetch, loc-resolved names, icon upload, `--reupload-wengines` flag).

## Impact

- **DB**: migration adding `wengine_id TEXT`, `wengine_level INTEGER`, `wengine_phase INTEGER`, `wengine_preferences TEXT[]` to `zzz_tracked_agents`. No new tables, no RLS changes.
- **Code**: `scripts/update-zzz-data.mjs` (+weapons section), `src/data/zenless-zone-zero/wengines.ts` (generated), `src/types.ts` (`ZzzTrackedAgent`, `ZzzAgentPatch`), `src/services/zenless-zone-zero/agentService.ts` (column map + select + defaults), `src/hooks/zenless-zone-zero/useAgents.ts` (field updaters), `src/utils/zzzBuildScore.ts` (new), `src/pages/zenless-zone-zero/components/AgentCard.tsx` + `WEngineEditorModal.tsx` (new) + CSS, `ZzzPage.tsx` (score source swap), `src/lib/imagekit.ts` (engine icon URL helper).
- **Specs**: 2 new, 3 modified (listed above).
- **No breaking changes**; existing rows load with null engine and empty preferences.
