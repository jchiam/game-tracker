## 1. Data & Pipeline

- [x] 1.1 Extend `scripts/update-hsr-data.mjs`: fetch `index_new/en/light_cones.json`, map path ids through the existing `pathMap`, add a `--reupload-light-cones` flag mirroring `--reupload-relics`
- [x] 1.2 Add the light-cone asset loop: `ensureAsset` per cone into `public/assets/honkai-star-rail/light-cones/{id}.webp`, counters/missing driven off its result
- [x] 1.3 Add codegen for `src/data/honkai-star-rail/light_cones.ts` (`LightCone` interface, `ALL_LIGHT_CONES` sorted rarity desc → name, generated-file banner) + catalog diff report
- [x] 1.4 Run `node scripts/update-hsr-data.mjs` once to generate the catalog and upload images to ImageKit

## 2. Database & Types

- [x] 2.1 Migration `supabase/migrations/20260811000000_add_light_cone_to_hsr.sql`: add `light_cone_id TEXT`, `light_cone_level INTEGER NOT NULL DEFAULT 1`, `light_cone_superimposition INTEGER NOT NULL DEFAULT 1` to `hsr_tracked_characters`
- [x] 2.2 Extend `HsrTrackedCharacter` (`lightConeId: string | null`, `lightConeLevel`, `lightConeSuperimposition`) and `HsrCharacterPatch` in `src/types.ts`

## 3. Service Layer

- [x] 3.1 `characterService.ts`: add the three columns to the load select fragment, row mapping, patch column map, and insert defaults (null / 1 / 1)
- [x] 3.2 Update `characterService.test.ts` config-wiring tests (load mapping, column map, insert defaults)

## 4. Hook Layer

- [x] 4.1 `useCharacters.ts`: declare `makeFieldUpdater` updaters for the three fields, level clamped 1–80, superimposition 1–5
- [x] 4.2 Update `useCharacters.test.ts` (hoisted-mock pattern) covering equip, unequip (null), and clamping

## 5. Card UI

- [x] 5.1 `CharacterCard.tsx` summary: `{name} · Lv {n} · S{n}` line with progress-gradient segment colors (level /80, superimposition /5), "No Light Cone" empty state
- [x] 5.2 `CharacterCard.tsx` edit view: `ProgressSection label="Light Cone"` composing `Select` (options `ALL_LIGHT_CONES.filter(lc => lc.path === char.path)` + empty option), `LevelSlider` 1–80, `SegmentedButtons` S1–S5
- [x] 5.3 CSS: reuse `card.css`/`controls.css` rules; add game-specific overrides to `CharacterCard.css` only if genuinely missing
- [x] 5.4 Update `CharacterCard.test.tsx`: summary render, empty state, path-filtered options, off-path stored id still renders in summary

## 6. Verification

- [x] 6.1 `npx openspec validate --all` passes
- [x] 6.2 `npm test` green; `npm run lint && npm run format:check` clean
