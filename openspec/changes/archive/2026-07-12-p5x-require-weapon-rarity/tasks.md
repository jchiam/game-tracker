## 1. Database

- [x] 1.1 Add migration `supabase/migrations/20260712000000_p5x_weapon_rarity_not_null.sql`: `UPDATE p5x_tracked_thieves SET weapon_rarity = 2 WHERE weapon_rarity IS NULL` (backfill)
- [x] 1.2 In the same migration, `ALTER COLUMN weapon_rarity SET DEFAULT 2` and `SET NOT NULL` (existing `CHECK … BETWEEN 2 AND 5` unchanged). Confirm timestamp is unique via `ls supabase/migrations/ | tail`

## 2. Type

- [x] 2.1 In `src/types.ts`, narrow `P5xTrackedThief.weaponRarity` from `number | null` to `number`; narrow the `weaponRarity` field on `P5xThiefPatch` likewise (`number` where present)

## 3. Hook + service defaults

- [x] 3.1 `useThieves.ts` `createTrackedThief`: `weaponRarity: null` → `weaponRarity: 2`
- [x] 3.2 `thiefService.ts` insert default: `weapon_rarity: null` → `weapon_rarity: 2`
- [x] 3.3 `thiefService.ts` row mapper: `weaponRarity: row.weapon_rarity ?? null` → `?? 2` (defensive for any legacy null)

## 4. Card UI

- [x] 4.1 `ThiefCard.tsx`: remove `allowDeselect` from the weapon-rarity `SegmentedButtons`; its `value` becomes `String(thief.weaponRarity)` (no null branch)
- [x] 4.2 `ThiefCard.tsx`: change `onUpdateWeaponRarity` handler to `(v) => onUpdateWeaponRarity(thief.id, Number(v))` and the prop type to `(id: string, value: number) => void`
- [x] 4.3 `ThiefCard.tsx`: drop the `weaponRarity !== null` guards — weapon summary chip always renders; `ProgressSection` value label drops the `—` fallback

## 5. Tests

- [x] 5.1 `useThieves.test.ts` / `thiefService.test.ts`: assert new thief defaults to `weaponRarity: 2` (and `weapon_rarity: 2` on insert)
- [x] 5.2 `ThiefCard.test.tsx`: remove null-weapon cases; assert the weapon chip is always present and the rarity control has no deselect
- [x] 5.3 Update any fixtures that set `weaponRarity: null`

## 6. Verify

- [x] 6.1 `npx openspec validate --all`
- [x] 6.2 `npm run lint && npm run format:check && npm test && npm run build`
