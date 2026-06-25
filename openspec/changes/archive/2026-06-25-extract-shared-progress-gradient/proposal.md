## Why

The investment-progress color gradient (rust → amber → gold → teal, encoding "uninvested → complete") is copy-pasted verbatim across two game cards — `COLOR_STOPS`, `lerpColor`, and `getProgressStyle` appear identically in `src/pages/reverse1999/components/ArcanistCard.tsx` and `src/pages/neverness-to-everness/components/CharacterCard.tsx`. This duplication means the cross-game visual language has two sources of truth that can silently drift, and it blocks HSR from adopting the same gradient cleanly. Extracting it to a shared utility is the lowest-risk first step in the broader card-consistency effort and unblocks the HSR card refactor that follows.

## What Changes

- Add `src/utils/progressGradient.ts` exporting the gradient utility (`getProgressStyle` plus its supporting `COLOR_STOPS` / `lerpColor` and the `ProgressStyle` type), as the single source of truth for the investment-progress color language.
- Migrate `ArcanistCard.tsx` (r1999) to import from the shared util; delete its local copy.
- Migrate `CharacterCard.tsx` (N2E) to import from the shared util; delete its local copy.
- Behavior-preserving: the gradient output is byte-for-byte identical at every call site. No visual change.

## Capabilities

### New Capabilities

- `shared-progress-gradient`: The shared investment-progress color language — a continuous rust→amber→gold→teal gradient mapping a normalized progress value to `color` / `borderColor` / `glowColor` / `activeBg`, exposed as a single reusable utility for all game cards.

### Modified Capabilities

<!-- None. This is a behavior-preserving extraction; r1999-arcanist-detail and n2e-character-detail keep the same observable behavior, so their spec requirements are unchanged. -->

## Impact

- **New file:** `src/utils/progressGradient.ts` (+ colocated `progressGradient.test.ts`).
- **Modified:** `src/pages/reverse1999/components/ArcanistCard.tsx`, `src/pages/neverness-to-everness/components/CharacterCard.tsx` — remove duplicated gradient code, import shared util.
- **No DB, API, CSS, or visual changes.** Existing card tests must continue to pass unchanged.
- **Unblocks:** the HSR `CharacterCard` collapse refactor (later change), which will consume this util instead of re-introducing a third copy.
