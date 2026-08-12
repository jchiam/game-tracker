# Design: add-hsr-light-cone-preferences

## Context

See proposal.md — Why. Two preference-persistence patterns exist in the codebase:

- **AE weapon preferences** (`20260629000000_add_ae_weapon_preferences.sql`): ordered `TEXT[]` of catalog ids on the tracked table, single-column atomic save through a plain field updater, `PreferenceChain` `ranked-list` variant in the UI, `resolveWeaponRank` → `#N` / `Off-build` gradient badge on the card.
- **HSR stat chains**: child tables + `savePreferenceRows` (shared delete-then-reinsert, documented as non-atomic in Known Limitations), `stat-chain` variant with `>`/`>=`/`OR` operators, edited in the relic editor's Build Preferences tab.

HSR already stores the equipped cone by catalog id (`lightConeId`), so rank resolution is a plain `indexOf` — no name→id bridge like AE's `resolveWeaponRank` needs. The equip picker's strict path filter (`lc.path === char.path`) and its option labelling already exist in `CharacterCard`. The relic editor (`RelicEditorModal`) and its Build Preferences tab are relic-specific: every control in that tab (set selects, main-stat chains, substat chain, comments) describes relics, and its save path (`saveBuildPrefs` → `savePreferenceRows`) rewrites the stat-chain child tables on every save.

A follow-up change is planned that folds Light Cone preference and build status into the relic score; this design stores rank-ordered ids so that scorer can derive rank in O(1) without schema changes.

## Goals / Non-Goals

**Goals:**

- Ranked cone preference as its own flow: dedicated dialog launched from the card's Light Cone section, decoupled from the relic editor.
- Atomic persistence — a single array-column write through the plain field-update path, immune to the half-wiped-rows failure mode of the child-table pattern, and free of side effects on relic preference rows.
- Reuse only: base `Modal`, `PreferenceChain` `ranked-list`, `makeFieldUpdater` — no new shared components, no new CSS patterns beyond the badge rule.

**Non-Goals:**

- Relic-score participation (follow-up change; see proposal non-goals).
- Superimposition-qualified ranking — superimposition is build _status_, not preference.
- Any change to `buildPreferences`, `saveBuildPrefs`, or the relic editor.
- A generic cross-game "equipment preference" abstraction — two call sites (AE, HSR) is not enough to extract one.

## Decisions

**D1 — `TEXT[]` column on `hsr_tracked_characters`, not a child table.**
AE precedent verbatim: pure ranking needs no operators, so the `StatPreference` row shape (stat/operator/order_index) buys nothing; an array column makes the save atomic, sidestepping the documented delete-then-reinsert hazard for free. Alternative (a `hsr_build_preference_light_cones` table via `savePreferenceRows`) rejected: more code, more failure modes, no added expressiveness.

**D2 — Top-level `lightConePreferences` field + plain field updater, not part of `buildPreferences`.**
`buildPreferences` is the relic editor's object: it is edited only in that modal and saved only through `saveBuildPrefs`, whose `savePreferenceRows` call deletes and re-inserts every stat-chain row on each save. Folding cone preferences in would (a) make a cone-only edit rewrite relic preference rows for nothing, and (b) couple a non-relic concern to a relic-titled dialog. Instead the field lives top-level on `HsrTrackedCharacter` (AE `weaponPreferences` precedent exactly): `HsrCharacterPatch` gains the key, `CHARACTER_COLUMNS` maps it to `light_cone_preferences`, and the hook declares `makeFieldUpdater('lightConePreferences')` — optimistic set, debounced atomic column update, rollback on error, all from the shared skeleton. Alternative (inside `buildPreferences` riding the `parentUpdate` row) rejected for the coupling above.

**D3 — Dedicated `LightConeEditorModal`, launched from the card's Light Cone section.**
The cone preference flow is its own dialog composed from the base `Modal` (title, Done-style close, Esc handling) containing one `PreferenceChain variant="ranked-list"` — not a tab wedged into `RelicEditorModal` (relic-only by contract, and `EquipmentEditorShell`'s two-tab shape stays intact), and not an inline card section (a ranked list of long cone names does not fit the card's edit-body width budget; the relic grid precedent already sends editing flows to a modal). Launcher: a button in the card's Light Cone edit section, wired through the page-level `editing…` state pattern used by `RelicEditorModal` (`HsrPage` holds `charId`, resolves the live character each render so the open dialog tracks optimistic updates). Options use `{ value: id, label: `${name} (${rarity}★)` }` — the same label format and strict path filter as the equip picker; rows holding an off-path id (upstream path change) still resolve by id, matching the equip picker's off-path display rule.

**D4 — Match badge is `indexOf` + `getProgressStyle`, computed in `CharacterCard`.**
`rank = lightConePreferences.indexOf(lightConeId)`; badge value `(n − rank) / n` through the shared gradient, `Off-build` at gradient 0 for a miss. No helper module — AE needed `resolveWeaponRank` only to bridge name→id; HSR's id→id lookup is one expression. Badge renders on the cone summary line behind `prefs.length > 0 && lightConeId !== null`, mirroring AE's `showMatchBadge` guard. CSS: one badge rule in the HSR card stylesheet following the AE `weapon-match-badge` shape.

**D5 — Card edit body clusters equipment into section groups (N2E Console precedent).**
With two Light Cone sections (equip + preferences launcher) and two relic sections (slot grid + Target Build readout) on one card, flat sibling sections would interleave unrelated concerns. The edit body adopts the canonical `.card-section-group` / `.card-section-group-header` pattern (shipped for the N2E Console group; neutral styling, no per-game accent): a "Light Cone" group (sections "Equipped", "Preferences") and a "Relics" group (slot grid, Target Build readout). Level and Traces are character progression, not equipment — they stay ungrouped above. The inner cone section relabels "Light Cone" → "Equipped" since the group header now carries the noun (same relabelling N2E did inside Console).

**D6 — No validation trigger on ids.**
Catalog lives in code, not DB (same contract as `relic_set_id`, `light_cone_id`): stale or off-path ids degrade gracefully at render (resolve-by-id or skip), and the weekly data workflow never removes ids retroactively. A CHECK or trigger would couple the DB to a code-resident catalog.

## Risks / Trade-offs

- [Preference list can contain cones the user does not own] → By design: it is a wish list; the future scorer treats "equipped cone absent from list" as off-build, not an error.
- [Two preference dialogs per card (relics, cones)] → Accepted: the flows have different shapes (chains + operators vs pure ranking), different save paths, and different domain nouns; one merged dialog would re-couple what this change deliberately separates.
- [Ranked list on a ~30-cone path pool could grow long] → UI is uncapped (AE precedent); dedupe already prevents the pathological case. Practical lists are 2–5 entries.
- [Divergent storage shapes between AE (top-level field) and HSR (top-level field) vs relic chains (child tables)] → Deliberate: pure rankings use array columns; operator chains use rows. The shared UI control is the reuse boundary.

## Migration Plan

1. Migration `20260812000000_add_hsr_light_cone_preferences.sql`: `ALTER TABLE hsr_tracked_characters ADD COLUMN light_cone_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];` — additive, default empty, no RLS change, no backfill.
2. Deploy order migration → code (code reads the column in the select; the column must exist first). Rollback = revert code; column is inert if unread.

## Open Questions

None.
