# Design: hsr-light-cone-preference-strip

## Context

Light cone icons are on ImageKit already (`update-hsr-data.mjs` uploads to `/honkai_star_rail/light_cones/{id}.webp`; verified live). The catalog (`ALL_LIGHT_CONES`) carries `imageUrl` per cone. The worktree branch already carries `getLightConeUrl` in `src/lib/imagekit.ts` and the summary-line icon in `CharacterCard.tsx` (commit `0a8de59`); this change formalises those and adds the strip. The card already computes everything the strip needs: `conePrefs`, `coneRank`, and `coneMatchPs` (progress-gradient style by rank) at `CharacterCard.tsx:88-97`, and receives `onUpdateLightCone` and `onEditLightConePrefs` handlers.

Constraints: L4-only (no shared-component change avoids the Storybook obligation and cross-game churn); token-first CSS; reuse `card.css` slot rules rather than re-declaring them.

## Goals / Non-Goals

**Goals:**

- Strip is pure presentation over existing card props/state — no new data flow, persistence, or hook surface.
- Visual language borrowed from existing shared rules: tile borders/glow from `.equip-slot-cell`, separators from `.pref-operator-badge`.

**Non-Goals:**

- Icons in the `LightConeEditorModal` ranked list (`PreferenceChain` stays label-only — L3 change deferred).
- Icons in the equip `Select` (native select cannot render images).
- Cone display in parties view (equipped-cone data does not reach `PartiesView`).
- Reordering or removing preferences from the strip — the editor modal remains the only mutation path for the list itself.

## Decisions

- **Tiles reuse `.equip-slot-cell` / `.equip-slot-img`** inside a new flex container (`.cone-pref-strip`) rather than `.equip-slot-grid` (that is a 6-column grid sized for relic slots). Alternative — bespoke tile classes — rejected: re-declares borders/active-glow that `card.css` already owns.
- **Equipped highlight via inline style from `coneMatchPs`**, matching how the match badge and summary segments already colour themselves (inline `color`/`borderColor` from `getProgressStyle`). Alternative — a CSS class per rank — rejected: rank count is unbounded and the gradient is computed, not enumerable.
- **Rank badge is a small overlay element inside the tile** (absolutely positioned, bottom edge), always rendered — it doubles as the icon-failure fallback content, satisfying the never-empty-tile requirement without state tracking. `onError` hides only the `<img>`, mirroring the relic-slot pattern.
- **Click-to-equip guards on already-equipped** (`lightConeId === tileId` → no-op) to avoid queuing redundant writes through `usePendingSaves`.
- **Overflow tile is a button-like tile labelled `+N`** that calls `onEditLightConePrefs` — same handler the Edit Preferences button uses; no new prop.
- **Cap constant `CONE_STRIP_MAX = 5`** local to `CharacterCard.tsx`. Alternative — design token — rejected: it is a content policy, not a visual token.
- **Separator `>` reuses `.pref-operator-badge`** (Target Build readout class in `card.css`) for visual consistency with the existing preference-chain readouts.

## Risks / Trade-offs

- [Strip widens the edit body on narrow viewports] → 5-tile cap + flex-wrap; tiles are ~40px, worst case wraps to a second row, no horizontal scroll.
- [Clickable tiles next to the Edit button could be mis-tapped on mobile] → tiles carry `title` tooltips and visible focus states from the shared slot-cell rules; destructive action impossible (equip is reversible via picker).
- [Catalog id drift (cone removed upstream) leaves a rank-only tile] → spec'd fallback: rank badge + raw-id tooltip; still equippable, consistent with the picker's off-path tolerance requirement.

## Migration Plan

No schema or data migration. Ships as one PR on top of worktree commit `0a8de59`; revert = revert the PR.
