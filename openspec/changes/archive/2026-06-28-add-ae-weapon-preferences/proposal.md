## Why

HSR and N2E let a user record _how_ an operator should be built (relic / cartridge
stat-priority chains) and score the equipped gear against that intent. AE tracks an
equipped weapon (`weaponName` + `weaponLevel`) but has **no notion of an intended
weapon** — there is nowhere to record "this operator wants Defender first, Last Light
second" and nothing tells the user whether the equipped weapon matches that intent.

This change adds an **ordered weapon-preference list** per AE operator (the user's
ranked ideal weapons) and a **match badge** that reports whether the equipped weapon
is one of the preferred ones, colored by how high it ranks. It is the AE analogue of
the HSR/N2E build-preference family, specialised for AE's "pick a named weapon" model
rather than stat chains.

## What Changes

- **New tracked field** `weaponPreferences: string[]` on `AeTrackedOperator`: an
  ordered list of `ALL_WEAPONS` **ids** (not display names), highest priority first,
  pure rank with no comparison operators, no duplicates. Defaults to `[]` on add.
- **New match badge** on the operator card: when preferences exist and a weapon is
  equipped, resolve the equipped `weaponName` → id via `ALL_WEAPONS`, find its rank in
  `weaponPreferences`, and render a badge colored by rank (1st choice = full / teal,
  lower ranks step down, equipped-but-not-listed = off-build / rust). No badge when no
  preferences are set.
- **Generalise the shared `PreferenceChain` component** to also drive a **ranked-list
  mode**: no operator selects, per-item remove on every row, up/down reorder controls,
  and `{ value, label }` options (so the value persisted is the weapon `id` while the
  dropdown shows the display name). Existing stat-chain mode (HSR relic / N2E cartridge)
  is unchanged.
- **Array-column storage** (not a child table): add `weapon_preferences TEXT[]` to
  `ae_tracked_operators` and persist via the existing `AeOperatorPatch` field-update
  path. Order is implicit in array position. This deliberately diverges from the
  HSR/N2E delete-then-reinsert row pattern — see design.md — to keep the save atomic
  and avoid the non-atomic-preference-save known limitation entirely.

## Capabilities

### Modified Capabilities

- `ae-operator-detail`: adds the `weaponPreferences` tracked field, its edit-body
  editor, the equipped-vs-preferred match badge, and the equipped-name → preferred-id
  resolution contract.
- `shared-ui-components`: generalises `PreferenceChain` to support a ranked-list mode
  (no operators, per-item remove, reorder, value/label options) alongside the existing
  stat-chain mode.

## Impact

- **Schema**: new migration `20260629000000_add_ae_weapon_preferences.sql` adding
  `weapon_preferences TEXT[] NOT NULL DEFAULT '{}'` to `ae_tracked_operators` (first
  array column on this table; N2E already uses array-typed fields, so the pattern is
  established in the codebase).
- **Types**: `AeTrackedOperator.weaponPreferences: string[]` +
  `AeOperatorPatch.weaponPreferences?: string[]` in `src/types.ts`.
- **Modified code**: `src/components/PreferenceChain.tsx` (+ `.css`, `.stories.tsx`,
  test), `src/pages/arknights-endfield/components/OperatorCard.tsx` (+ `.css`),
  AE service (`load`/map of the new column), AE hook (field updater + dedupe).
- **Not in scope**: roster sort by match (HSR/N2E sort by score; AE keeps level/alpha
  sort), weapon-preference search keys, and party-level weapon planning.
