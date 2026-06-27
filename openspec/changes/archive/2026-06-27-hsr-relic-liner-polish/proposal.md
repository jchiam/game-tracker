## Why

The HSR relic one-liner (just added) uses full set names that are often 3-5 words long ("Champion of Streetwise Boxing", "Band of Sizzling Thunder"). With 2+ sets and counts, the text overflows and gets truncated by CSS ellipsis — especially on narrow cards or when sets are mixed (3+ distinct sets). Additionally, collapsed card height varies depending on whether relics are equipped (one-liner present vs dash), breaking P3 (uniform collapsed height).

## What Changes

- **Abbreviated relic set names:** Add a hand-maintained `RELIC_SHORT_NAMES` mapping (`id → shortName`) in a new file alongside `relic_sets.ts`. The component uses the short name for display. Examples: "Firesmith", "Streetwise", "Thunder", "Keel".
- **Single-line with ellipsis:** Keep `.game-card-static-line` as single line with `text-overflow: ellipsis`. Short names make most set combos fit; long combos truncate gracefully.
- **Reserve 1-line height always:** The one-liner area reserves 1 line of space via `min-height` even when no relics are equipped (dash state), so all HSR cards have identical collapsed height regardless of relic state.

## Capabilities

### Modified Capabilities

- `hsr-character-detail`: Update the gear one-liner requirement — abbreviated names, ellipsis truncation, fixed 1-line height reservation.

## Impact

- **New file:** `src/data/honkai-star-rail/relic_short_names.ts` — hand-maintained `id → shortName` map for all ~58 relic sets.
- **Modified:** `src/pages/honkai-star-rail/components/CharacterCard.tsx` (use short names), `CharacterCard.css` (1-line min-height for the one-liner), `CharacterCard.test.tsx` (update assertions).
- **Not modified:** `relic_sets.ts` (auto-generated, untouched), update script (untouched).
