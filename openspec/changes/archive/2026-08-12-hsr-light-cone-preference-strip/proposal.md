# Proposal: hsr-light-cone-preference-strip

## Why

Light cone icons are already hosted on ImageKit by the HSR data pipeline, but the roster card surfaces ranked light cone preferences as a bare count ("3 ranked") with no visual information — the `#n` match badge on the summary line is unexplained, and swapping to a preferred cone requires opening the editor modal. Relic assets already demonstrate the pattern: slot tiles with CDN icons directly on the card.

## What Changes

- Add a `getLightConeUrl` ImageKit resolver (square 128px art, no crop transform — same contract as the relic icon resolver).
- Show the equipped light cone's icon on the collapsed summary line, before the cone name.
- Add a **preference strip** to the card's edit view, inside the Light Cone section group's Preferences section: one square tile per ranked cone (icon + rank badge), `>` separators, capped at 5 tiles with a `+N` overflow tile.
- The tile for the currently equipped cone is highlighted with the same progress-gradient colour the match badge uses (rank quality colour).
- Tiles are interactive: clicking a tile equips that cone (existing update path); the overflow tile opens the preference editor.
- The strip renders nothing when the preference list is empty; the Edit Preferences button is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `hsr-character-detail`: the Light Cone card section gains a summary-line icon and a preference strip requirement (tile rendering, equipped highlight, click-to-equip, overflow, fallbacks).
- `shared-image-pipeline`: new resolver requirement — light cone icon URL without crop transform.

## Impact

- `src/lib/imagekit.ts` — new `getLightConeUrl` export (already staged on the worktree branch, formalised by this change).
- `src/pages/honkai-star-rail/components/CharacterCard.tsx` — summary-line icon (already staged) + preference strip in the edit body.
- `src/pages/honkai-star-rail/components/CharacterCard.css` — strip layout + tile rank badge (tile borders/glow reuse shared `card.css` slot rules; separator reuses `.pref-operator-badge`).
- `src/pages/honkai-star-rail/components/CharacterCard.test.tsx` — new tests.
- No schema, service, hook, or shared-component changes. No Storybook obligation (L4 only).
