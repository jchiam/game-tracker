## 1. Schema + types

- [x] 1.1 Add migration `supabase/migrations/20260629000000_add_ae_weapon_preferences.sql`: `ALTER TABLE ae_tracked_operators ADD COLUMN weapon_preferences TEXT[] NOT NULL DEFAULT '{}'`
- [x] 1.2 Add `weaponPreferences: string[]` to `AeTrackedOperator` and `weaponPreferences?: string[]` to `AeOperatorPatch` in `src/types.ts`

## 2. Generalise PreferenceChain (shared-ui-components)

- [x] 2.1 Read `src/components/PreferenceChain.tsx` + test + stories; decide `variant` prop vs extracted `OrderedSelectList` (design.md §4)
- [x] 2.2 Add ranked-list mode: no operator selects, per-item `.remove-pref-btn`, up/down reorder controls, `{ value, label }[]` options, bare value-string `values`
- [x] 2.3 Keep stat-chain mode behaviorally unchanged (append-fixup + tail-only remove); confirm HSR/N2E call sites compile untouched
- [x] 2.4 Add reorder + remove CSS in `PreferenceChain.css` using design tokens
- [x] 2.5 Update `PreferenceChain.stories.tsx`: add a ranked-list-mode story (value≠label, reorder, per-item remove)
- [x] 2.6 Update `PreferenceChain.test.tsx`: append/remove/reorder in ranked mode, value emitted (not label), dedupe of selectable options

## 3. Service + hook (AE)

- [x] 3.1 Map `weapon_preferences` ⇄ `weaponPreferences` in the AE operator service load/insert/update
- [x] 3.2 Add a `weaponPreferences` updater in the AE hook that goes through the existing `queueUpdate` field-save path
- [x] 3.3 Enforce dedupe in the hook (a weapon id appears at most once) before persisting

## 4. Operator card (ae-operator-detail)

- [x] 4.1 Add the preferred-weapons editor to the card edit body: `PreferenceChain` ranked-list mode, options `ALL_WEAPONS.filter(w => w.type === operator.weapon)` mapped to `{ value: id, label: name }`
- [x] 4.2 Add `resolveWeaponRank(weaponName, weaponPreferences)`: name → id via `ALL_WEAPONS`, then index in preferences; returns rank or "not listed" (never throws)
- [x] 4.3 Render the match badge in the collapsed summary: rank label (`#1`…) or `Off-build`, colored via `getProgressStyle` per design.md §2; no badge when prefs empty or no weapon equipped
- [x] 4.4 Add badge CSS in `OperatorCard.css` using design tokens

## 5. Tests + lint

- [x] 5.1 Service test: new column round-trips; DB-disabled path returns empty
- [x] 5.2 Hook test (hoisted-mock pattern): add/remove/reorder/dedupe update `weaponPreferences` and queue a save
- [x] 5.3 Card test: badge shows `#1`/teal for first choice, lower rank for lower choice, `Off-build` for unlisted equipped, no badge when prefs empty; unresolvable `weaponName` degrades to off-build
- [x] 5.4 `npm run lint && npm run format:check && npm test`
- [x] 5.5 `openspec validate add-ae-weapon-preferences --strict`
