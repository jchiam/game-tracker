## 1. Weapon catalog — src/data/arknights-endfield/weapons.ts

- [x] 1.1 Create `weapons.ts` exporting `interface AeWeapon { id; name; rarity; type }` and `const ALL_WEAPONS: AeWeapon[]`, with a hand-authored banner matching `operators.ts`
- [x] 1.2 Populate the full known launch weapon list; ensure every `type` exactly string-matches an `AeOperator.weapon` value (`Sword`, `Polearm`, `Greatsword`, `Arts Unit`, …) with no casing/spacing drift
- [x] 1.3 Sanity-check: every operator weapon class that ships an operator has at least one matching weapon (or is intentionally left empty)

## 2. Types — src/types.ts

- [x] 2.1 In `AeTrackedOperator`: remove `potential`, add `phase: number` (0–5), `skillsMaxed: boolean`, `weaponName: string | null`, `weaponLevel: number`
- [x] 2.2 In `AeOperatorPatch`: replace `potential?` with `phase?`, add `skillsMaxed?`, `weaponName?`, `weaponLevel?`

## 3. Database migration

- [x] 3.1 New timestamped migration on `ae_tracked_operators`: `RENAME COLUMN potential TO phase`; comment SHALL note values are preserved but reinterpreted as `phase`
- [x] 3.2 Same migration: `ADD COLUMN skills_maxed BOOLEAN NOT NULL DEFAULT false`, `ADD COLUMN weapon_name TEXT`, `ADD COLUMN weapon_level INTEGER NOT NULL DEFAULT 1`

## 4. Service — src/services/arknights-endfield/operatorService.ts

- [x] 4.1 Update `OPERATOR_COLUMNS`: `phase → 'phase'`, `skillsMaxed → 'skills_maxed'`, `weaponName → 'weapon_name'`, `weaponLevel → 'weapon_level'`; remove `potential`
- [x] 4.2 Update `loadOperatorsFromDB` select + row mapping for the new columns (default `phase` 0, `skillsMaxed` false, `weaponName` null, `weaponLevel` 1)
- [x] 4.3 Update `insertOperator` defaults (`phase: 0`, `weapon_level: 1`)

## 5. Hook — src/hooks/arknights-endfield/useOperators.ts

- [x] 5.1 Update `createTrackedOperator` defaults: `phase: 0`, `skillsMaxed: false`, `weaponName: null`, `weaponLevel: 1` (drop `potential`)
- [x] 5.2 Rename `updatePotential` → `updatePhase` (clamp 0–5)
- [x] 5.3 Add `updateSkillsMaxed(id, value)` and `updateWeapon(id, weaponName, weaponLevel)` (clamp level 1–90), each via `queueUpdate`
- [x] 5.4 Export the new/renamed updaters

## 6. Card — src/pages/arknights-endfield/components/OperatorCard.tsx + .css

- [x] 6.1 Remove `RARITY_STARS` const and the `.rarity-indicator` chip; remove `.rarity-*` rules from the CSS
- [x] 6.2 Update props: `onUpdatePotential` → `onUpdatePhase`, add `onUpdateSkillsMaxed`, `onUpdateWeapon`
- [x] 6.3 Collapsed summary: `Lv` chip, `P{phase}` chip, `Skills {✓|✗}` chip, plus a `.game-card-static-line` weapon one-liner (name + `Lv {weaponLevel}`, em-dash when empty)
- [x] 6.4 Edit body: Level slider (unchanged), Phase P0–P5 button row (relabel from potential), `ConfirmCheckbox` for skills maxed, weapon `<select>` filtered by `operator.weapon` + weapon-level slider (1–90)
- [x] 6.5 Bump `--game-card-edit-max-height` to fit the added sections

## 7. Page wiring — ArknightsEndfieldPage.tsx

- [x] 7.1 Pass the renamed/new handlers (`onUpdatePhase`, `onUpdateSkillsMaxed`, `onUpdateWeapon`) from `useOperators` into `OperatorCard`

## 8. Tests

- [x] 8.1 `OperatorCard.test.tsx`: remove the `.rarity-indicator` assertion (line ~114); add coverage for phase chip, skills chip/checkbox, weapon picker filtering by class, and the weapon one-liner
- [x] 8.2 `useOperators.test.ts`: cover `updatePhase` clamping, `updateSkillsMaxed`, `updateWeapon` level clamping
- [x] 8.3 `operatorService.test.ts`: cover the new column map / select / insert defaults

## 9. Lint, format, test

- [x] 9.1 `npm run lint && npm run format:check` — fix any issues
- [x] 9.2 `npm test` — confirm green
