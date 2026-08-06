## Why

In Neverness to Everness a character's **Console** is the housing that holds both the equipped
**cartridge** and the character's **modules**. Today the tracker models the cartridge (and its
Target Build preferences) but has no notion of modules and no grouping that reflects the Console as
a single unit. Two gaps follow:

1. **No modules signal.** There's no way to record whether a character's modules are configured, so
   there's no at-a-glance "this character is fully set up" marker. The user needs a single
   done/not-done flag, not full module modeling — the shape of HSR's `tracesAttained` flag.
2. **No Console grouping.** Cartridge, Modules, and Target Build are conceptually one thing (the
   Console) but render as unrelated, scattered edit-body sections. Target Build is directly relevant
   to both the cartridge and the modules, so it belongs with them.

## What Changes

- **Console becomes N2E domain vocabulary.** Added to `CONTEXT.md` as the grouping term: the Console
  is the cartridge + modules housing; Target Build is its shared preference readout.
- **Modules flag** — N2E tracked characters gain a `modulesConfigured` boolean (DB column
  `modules_configured`), default `false`, toggled from the card, persisted via the debounced save
  queue. Flag-only: module contents are not modeled.
- **New shared design pattern: the section group.** A labeled container that visually encloses
  several `.progress-section`s under one heading is promoted to a shared L2 primitive —
  `.card-section-group` + `.card-section-group-header` in `src/styles/card.css`, **visually neutral**
  (tokenized hairline border, `.section-header`-style heading, no game accent). It is the canonical
  way any game card groups sections; documented in `CLAUDE.md` (L2) and Storybook (`CardPatterns`).
- **Console group in the card edit body** — a **Console** section group (the shared neutral
  primitive, heading "Console") renders directly **after Arc**, enclosing three sub-sections in
  order: **Cartridge → Modules → Target Build** (Target Build still shown only when preferences
  exist). The standalone Modules section is removed from its interim position; all three live inside
  Console. Console carries no brand accent — it reads like every other section group.
- **Summary chips unchanged** — the collapsed summary keeps `Lv`, `A x/6`, and `Modules ✓/✗`. The
  Console grouping is an edit-body concern only.

No breaking change: `modules_configured` is `NOT NULL DEFAULT false`, so existing rows backfill to
"not configured."

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-card-base`: adds a **Section-group primitive defined once** requirement — the neutral
  `.card-section-group` / `.card-section-group-header` L2 primitive in `card.css`, the canonical way
  a card groups multiple `.progress-section`s under one heading.
- `n2e-character-detail`: adds a **Modules configured flag** requirement and a **Console group**
  requirement (the shared section-group, heading "Console", after Arc, ordered Cartridge → Modules →
  Target Build), and modifies the existing **edit body contains cartridge slot and Target Build**
  requirement so both render inside the Console group.

## Impact

- `CONTEXT.md` — add the Console domain term; update the N2E games-table row to mention modules +
  console.
- `src/types.ts` — `modulesConfigured: boolean` on `N2ETrackedCharacter`; `modulesConfigured?` on
  `N2ECharacterPatch`. (done)
- `supabase/migrations/20260806000000_add_n2e_modules_configured.sql` — add column. (done)
- `src/services/neverness-to-everness/characterService.ts` — column map, insertDefaults, select,
  fromRow. (done)
- `src/hooks/neverness-to-everness/useCharacters.ts` — `toggleModulesConfigured` field updater +
  createTracked default. (done)
- `src/styles/card.css` — add the shared neutral `.card-section-group` + `.card-section-group-header`
  L2 primitive (tokenized; heading styled like `.section-header`).
- `CLAUDE.md` — L2 `card.css` row lists the section-group primitive; add a canonical-usage note.
- `src/styles/CardPatterns.stories.tsx` — add a section-group variant (a group wrapping two
  `ProgressSection`s).
- `src/pages/neverness-to-everness/components/CharacterCard.tsx` — `Modules ✓/✗` summary chip (done);
  **restructure edit body**: wrap Cartridge, Modules, Target Build in a Console **section group**
  (shared `.card-section-group`, heading "Console") after Arc, ordered Cartridge → Modules → Target
  Build; remove the interim standalone Modules section.
- `src/pages/neverness-to-everness/components/CharacterCard.css` — no `.console-group` rule; the
  Console composes the shared neutral primitive (drop the interim game-local group CSS).
- `src/pages/neverness-to-everness/N2ePage.tsx` — wire `toggleModulesConfigured`. (done)
- Tests: `characterService.test.ts` (done), `useCharacters.test.ts` (done), `CharacterCard.test.tsx`
  (chip done; add Console group render + section order + placement-after-Arc assertions).
