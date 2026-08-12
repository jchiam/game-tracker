# Proposal: add-hsr-light-cone-preferences

## Why

HSR characters now track an equipped Light Cone, but there is no way to record which cones the user _wants_ for a character — the "target build" story covers relic sets, main stats, and substats, yet stays silent on the single most impactful equipment choice. A ranked preference list closes that gap and provides the data foundation for a planned follow-up change that folds Light Cone preference and build status into the relic score.

## What Changes

- Add a per-character ranked list of preferred Light Cones (ordered catalog ids, highest priority first, no duplicates), stored as an atomic `TEXT[]` column on `hsr_tracked_characters` — the AE weapon-preference pattern, deliberately avoiding the non-atomic delete-then-reinsert child-table pattern.
- `lightConePreferences` is a top-level tracked-character field saved through the plain field-updater path — **not** part of `buildPreferences`, which is relic-specific and rides the relic editor's save flow.
- Add a dedicated Light Cone preferences dialog, opened from the character card's Light Cone section — a flow entirely separate from `RelicEditorModal`, whose Target Build tab remains relic-only. The dialog composes the existing `PreferenceChain` `ranked-list` variant with the same strict path filter as the equip picker.
- Add a match badge to the card's Light Cone summary line showing the equipped cone's rank in the preference list (`#1`…`#n`, progress-gradient colored) or `Off-build` when preferences exist and the equipped cone is not listed.
- Explicit non-goals: no relic-score participation yet (reserved for the follow-up scoring change) and no superimposition-qualified ranking (superimposition is build status, not preference).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `hsr-character-detail`: gains a ranked Light Cone preference list (top-level storage, a dedicated preference dialog separate from the relic editor, and the card's rank match badge).

## Impact

- **DB**: one additive migration — `light_cone_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]` on `hsr_tracked_characters`. No RLS change (row policies cover new columns).
- **Types**: `HsrTrackedCharacter` and `HsrCharacterPatch` gain top-level `lightConePreferences: string[]`; `buildPreferences` is untouched.
- **Service**: `characterService` column map, select fragment, and `fromRow`; `saveBuildPrefs` is untouched.
- **Hook**: one `makeFieldUpdater('lightConePreferences')` declaration.
- **UI**: new `LightConeEditorModal` (base `Modal` + ranked list), launcher in the card's Light Cone section, summary-line badge. `RelicEditorModal` untouched. No new shared components — `PreferenceChain` `ranked-list` variant already exists (AE precedent).
- **Scoring**: untouched. The ranked-id array gives the future scorer rank lookup in O(1) with no schema pressure.
- **Tests**: service config wiring, hook field updater, new modal, card badge + launcher.
