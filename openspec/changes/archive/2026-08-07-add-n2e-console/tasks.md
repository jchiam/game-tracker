## 1. Domain language

- [x] 1.1 In `CONTEXT.md`, add a **Console** term: the N2E housing comprising a character's equipped
      cartridge and their modules; Target Build is its shared cartridge-preference readout. Link it
      to the existing cartridge terminology.
- [x] 1.2 Update the N2E row of the games table in `CONTEXT.md` to mention modules + console.

## 2. Modules flag — data + behaviour (DONE)

- [x] 2.1 `src/types.ts` — `modulesConfigured: boolean` on `N2ETrackedCharacter`;
      `modulesConfigured?: boolean` on `N2ECharacterPatch`.
- [x] 2.2 `supabase/migrations/20260806000000_add_n2e_modules_configured.sql` — `ALTER TABLE
n2e_tracked_characters ADD COLUMN modules_configured BOOLEAN NOT NULL DEFAULT false;`.
- [x] 2.3 `characterService.ts` — column map, insertDefaults, select, fromRow.
- [x] 2.4 `useCharacters.ts` — `toggleModulesConfigured = makeFieldUpdater('modulesConfigured')`,
      returned from the hook, plus `modulesConfigured: false` in `createTrackedCharacter`.
- [x] 2.5 `N2ePage.tsx` — pass `onToggleModules={toggleModulesConfigured}` to the card.
- [x] 2.6 `Modules ✓/✗` summary chip added to `CharacterCard.tsx` `summaryStats`.

## 3. Console group — interim card UI (DONE, superseded by §4)

- [x] 3.1 Added an N2E-local `.console-group` container + heading in `CharacterCard.css`.
- [x] 3.2 Removed the interim standalone Modules `ProgressSection` (was between Awakening and Arc).
- [x] 3.3 After Arc, wrapped Cartridge, Modules (conditional Target Build) in the group, ordered
      Cartridge → Modules → Target Build.
- [x] 3.4 Confirmed edit-body order Level → Awakening → Arc → Console(Cartridge → Modules → Target
      Build).

> §4 promotes the interim N2E-local `.console-group` to a shared **neutral** section-group primitive
> and refactors the Console onto it. After §4 the game-local `.console-group` CSS is gone.

## 4. Section-group primitive — shared, neutral (design pattern)

- [x] 4.1 In `src/styles/card.css`, add `.card-section-group` (tokenized hairline border + neutral
      background, flex column, `--spacing-*` gap/padding, `--border-radius-*`) and
      `.card-section-group-header` (styled like `.section-header`). Visually neutral — **no** game
      accent colour.
- [x] 4.2 In `CharacterCard.tsx`, change the Console container to the shared classes
      (`.card-section-group` + `.card-section-group-header`, heading "Console"); drop any brand-tint.
- [x] 4.3 In `CharacterCard.css`, remove the interim `.console-group` / `.console-group-header`
      rules (Console now composes the shared primitive; no game-local group CSS remains).
- [x] 4.4 Update `CharacterCard.test.tsx` selectors from `.console-group` →
      `.card-section-group` (heading-after-Arc, sub-section order, Modules-only-inside,
      Target-Build-conditional assertions).
- [x] 4.5 `CLAUDE.md` — add `.card-section-group` / `.card-section-group-header` to the L2 `card.css`
      row and note it as the canonical section-grouping pattern (neutral; no per-game accent).
- [x] 4.6 `src/styles/CardPatterns.stories.tsx` — add a section-group story variant (a
      `.card-section-group` wrapping two `ProgressSection`s).

## 5. Tests — modules flag (DONE)

- [x] 5.1 `characterService.test.ts` — load maps `modules_configured` → `modulesConfigured`; insert
      sends `modules_configured: false`; update maps the patch key.
- [x] 5.2 `useCharacters.test.ts` — `toggleModulesConfigured` optimistically sets + queues; new-add
      default is `false`.
- [x] 5.3 `CharacterCard.test.tsx` — `Modules ✓/✗` chip renders; confirm-flow toggle fires
      `onToggleModules`; Console group render + section order + placement-after-Arc + conditional
      Target Build (selectors updated to `.card-section-group` in §4.4).

## 6. Verify & finalize

- [x] 6.1 Run `npm test` — N2E service, hook, and card suites green.
- [x] 6.2 Run `npm run lint && npm run format:check`.
- [x] 6.3 Run `npx openspec validate --all`.
- [x] 6.4 Manually verify in the N2E card: the Console section group renders after Arc with
      Cartridge → Modules → Target Build, visually neutral (no accent); toggle Modules Configured
      on/off, confirm the summary chip flips and the value persists across reload.
