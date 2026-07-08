## Why

P5X thieves can be stuck at the rose gate (skills leveled to Lv8 but not yet past the rose item to Lv10). Users need a quick way to see "which thieves need roses?" — that's a predicate filter, not a sort. No game currently has boolean-field filtering; this introduces the pattern for P5X and documents it as a reusable design pattern for future games with similar item-gate bottlenecks.

## What Changes

Add a filter chip to the P5X roster toolbar that narrows the displayed roster to only rose-gated thieves (`skillsLeveled && !roseMaxed`). The filter is off by default, togglable, and composes with the existing search + sort. Also spec a generic "boolean-predicate roster filter" pattern that future games can adopt without re-inventing.

## Capabilities

### New Capabilities
- `roster-predicate-filter`: Shared design pattern for boolean-predicate roster filtering — describes how a game hook can expose a filter predicate, how the page manages filter state, and how the toolbar renders filter chips. P5X rose-gate filter is the first implementation.

### Modified Capabilities
- `p5x-thief-detail`: Add rose-gated filter chip to the P5X roster toolbar, wired through the existing `getFilteredRoster` path.

## Impact

- `src/hooks/persona-5-phantom-x/useThieves.ts` — `getFilteredRoster` gains an optional predicate parameter
- `src/pages/persona-5-phantom-x/P5xPage.tsx` — filter state + chip in toolbar
- `src/pages/persona-5-phantom-x/P5xPage.css` — chip styling (reuse `.stat-chip` or `.toggle-btn` pattern)
- Tests for hook filtering + page chip interaction
- No DB change, no migration, no new dependencies
