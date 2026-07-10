## Why

P5X revelation **substat** build preferences duplicate on first input, bleed across
thieves, and accumulate garbage over reloads. Root cause: `thiefService.ts`
`extras.mapRow` builds each thief's `revelationPreferences` by spreading a
module-level `defaultRevelationPreferences` const, then `push`es substat rows onto
`prefs.subStats` — which is the **same array object** for every thief and every load
pass. `mainStats` escapes the bug only because `mapRow` rebuilds it fresh; `subStats`
is aliased, so it is the sole corrupted field (matching the user report).

## What Changes

- Fix `extras.mapRow` (`thiefService.ts`) to give `prefs.subStats` a fresh `[]` in the
  `prefs` literal, mirroring how `mainStats` is already rebuilt fresh — so no thief's
  preferences share a mutable array with the module default or with another thief.
- Fix the latent same-class aliasing in `fromRow` (`thiefService.ts`), where
  `revelationPreferences: { ...defaultRevelationPreferences }` shallow-copies and aliases
  the default's arrays. Currently masked because `mapRow` overwrites the field, but
  fragile — make the base tracked object own fresh arrays too.
- Add a regression test proving two different thieves' loaded `revelationPreferences.subStats`
  are distinct array references, and that a second load does not double an existing chain.

Not in scope (noted for follow-up, not this change):

- `PreferenceChain` stat-chain `add` always inserting `options[0]` with no dedup — cosmetic.
- `savePreferenceRows` swallowing delete errors + no unique constraint on
  `p5x_revelation_preferences` — a robustness gap, but not the cause of this corruption.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `p5x-revelation-preferences`: strengthen the load contract — each Thief's loaded
  `revelationPreferences` (including `subStats`) MUST be an independent, freshly-allocated
  structure that never aliases the module default or another Thief's state.

## Impact

- `src/services/persona-5-phantom-x/thiefService.ts` — `extras.mapRow`, `fromRow`.
- `src/services/persona-5-phantom-x/thiefService.test.ts` — new isolation/regression test.
- No DB migration, no schema change, no type change. Behavior-only fix.
