# Tasks: hsr-light-cone-preference-strip

## 1. Resolver + summary icon (formalise worktree commit 0a8de59)

- [x] 1.1 Confirm `getLightConeUrl` in `src/lib/imagekit.ts` matches the shared-image-pipeline delta (no transform, local-path fallback when unconfigured)
- [x] 1.2 Confirm summary-line icon in `CharacterCard.tsx` matches the modified Light Cone card section requirement (icon before name, `onError` hides icon, text intact)

## 2. Preference strip

- [x] 2.1 Add `.cone-pref-strip` container + tile markup in `CharacterCard.tsx` Preferences section: tiles from `conePrefs` in order, reusing `.equip-slot-cell`/`.equip-slot-img`, `>` separators via `.pref-operator-badge`, tooltip `name (rarity★)`
- [x] 2.2 Rank badge overlay per tile (`#1`…), always rendered; `onError` hides only the image
- [x] 2.3 Equipped-tile highlight via inline style from `coneMatchPs`; no highlight when equipped cone off-build or none equipped
- [x] 2.4 Click-to-equip through `onUpdateLightCone`, no-op when tile already equipped
- [x] 2.5 Cap at 5 tiles (`CONE_STRIP_MAX`), `+N` overflow tile calling `onEditLightConePrefs`
- [x] 2.6 Catalog-miss fallback: rank-badge-only tile, raw-id tooltip, still clickable
- [x] 2.7 Strip absent when `lightConePreferences` empty; Edit Preferences button unchanged
- [x] 2.8 CSS in `CharacterCard.css`: strip flex layout (wrap, token gap), rank-badge rule — no re-declared `card.css` rules, tokens only

## 3. Tests

- [x] 3.1 Strip order + rank badges + separators for 3 prefs
- [x] 3.2 No strip when prefs empty
- [x] 3.3 Equipped tile highlighted; off-build equip → none highlighted
- [x] 3.4 Tile click calls `onUpdateLightCone` with cone id; equipped tile click is a no-op
- [x] 3.5 7 prefs → 5 tiles + `+2` overflow; overflow click calls `onEditLightConePrefs`
- [x] 3.6 Unknown catalog id → rank-only tile with raw-id tooltip
- [x] 3.7 Icon URLs resolved through `getLightConeUrl` mock

## 4. Verify

- [x] 4.1 `npx openspec validate --all`
- [x] 4.2 `npm test`, `npm run lint`, `npm run format:check`, `npm run build`
- [x] 4.3 Visual check of strip in dev server (equipped highlight, overflow tile)
