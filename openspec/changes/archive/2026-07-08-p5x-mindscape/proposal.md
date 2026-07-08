## Why

P5X's Mindscape system is a node-based upgrade tree per character. The nodes are too granular to track individually (variable count per character, multiple material types, ring-based unlocks). A simple boolean "maxed or not" captures the meaningful investment milestone — whether the player has completed the entire Mindscape tree for a thief — without the complexity of per-node state.

## What Changes

Add a `mindscapeMaxed` boolean field to tracked P5X thieves. When true, indicates the thief's Mindscape tree is fully unlocked. Rendered as a summary indicator on the card (similar to the rose-maxed/skills-maxed pattern) and toggled via the edit body.

## Capabilities

### Modified Capabilities

- `p5x-thief-detail`: Add `mindscapeMaxed` boolean field — default false, toggle in edit body, summary indicator on collapsed card.

## Impact

- `src/types.ts` — add `mindscapeMaxed` to `P5xTrackedThief` and `P5xThiefPatch`
- `src/hooks/persona-5-phantom-x/useThieves.ts` — default on add, field updater
- `src/services/persona-5-phantom-x/thiefService.ts` — column mapping
- `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` — toggle in edit, indicator in summary
- `supabase/migrations/` — add `mindscape_maxed BOOLEAN DEFAULT FALSE` column
- Tests for hook updater + card rendering
