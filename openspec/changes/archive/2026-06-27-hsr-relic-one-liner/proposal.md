## Why

HSR is the only game with named equippable sets that lacks a gear one-liner in its collapsed card summary. R1999 shows psychube name · level · amplification; N2E shows arc · cartridge. HSR tracks named relic sets across 6 slots but only displays a slot-fill chip (`Relics 4/6`). Adding a set-name digest completes the cross-game alignment established by Changes A–D.

## What Changes

- Add a `.game-card-static-line` to the HSR collapsed summary showing equipped relic set names with piece counts: `{SetName} {count} · {SetName} {count}`, sorted by count descending.
- When no relics are equipped, show `—` (same empty-state pattern as R1999/N2E).
- All text colored teal (equipped) via `getProgressStyle`, matching the other games' equip lines.

## Capabilities

### Modified Capabilities

- `hsr-character-detail`: Add a presentation requirement for the collapsed summary's gear one-liner — relic set names with counts.

## Impact

- **Modified:** `src/pages/honkai-star-rail/components/CharacterCard.tsx` (add set-counting + one-liner), `CharacterCard.test.tsx` (new assertions).
- **No DB, service, hook, or scoring changes.** Relic scoring and the overlay score badge are untouched.
- **No new CSS.** Reuses `.game-card-static-line` from `card.css`.
- **No new utility files.** Set-counting is ~5 lines inline in the component.
