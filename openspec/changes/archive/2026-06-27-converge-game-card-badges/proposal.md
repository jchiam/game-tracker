## Why

The header "pill" badges (class / element / type / afflatus / path) are conceptually one
shared design-system primitive, rendered through the shared `GameBadge` component. But the
**visual base** of that pill was never lifted into L2 — it is copy-pasted into each game's
L4 stylesheet, and the copies have drifted:

- **Canonical pill** (tinted glass: `padding: 3px 8px`, bold, UPPERCASE, `letter-spacing:
0.04em`, `backdrop-filter: blur(8px)`, per-variant fill `rgba(hue, 0.25)` + border
  `rgba(hue, 0.6)`) is shared **byte-for-byte** by five variants across three games: HSR
  `.path-badge`, R1999 `.afflatus-badge` / `.damage-badge`, N2E `.esper-badge` / `.arc-badge`.
- **AE diverged.** `.endfield-class-badge` / `.endfield-element-badge` / `.endfield-weapon-badge`
  use `font-weight: medium`, **no** uppercase, **no** letter-spacing, **no** blur, and a fainter
  fill (`rgba(hue, 0.15)` / border `rgba(hue, 0.3)`). This is the reported "AE pills look
  different from every other game" bug.
- **HSR `.element-badge` diverged differently.** In `App.css` it is a flat **dark chip**
  (`background: rgba(0,0,0,0.3)`, `letter-spacing: 0.1em`, `font-weight: 600`,
  `border-radius-sm`, no blur) — so on a single HSR card the element badge and the path badge
  already look inconsistent side-by-side.

Because the base lives on per-game `.{variant}-badge` selectors instead of a shared class, a
tweak to the pill must be hand-mirrored into 9+ near-identical rules, and there is nothing for a
new game (or AE) to inherit — which is exactly how the drift happened. There is no
`shared-card-badges` capability in the spec to anchor the pattern.

## What Changes

- **Add a canonical `.game-badge` base class** to `src/styles/card.css` (L2), holding the full
  shared pill appearance. This is the one genuine design-system addition; everything else is
  convergence onto it.
- **`GameBadge` emits `game-badge {variant}-badge {variant}-{modifier}`** — `game-badge`
  carries the base; `{variant}-badge` is retained purely as the scoping hook for each game's
  **compound** color selectors (e.g. `.path-badge.path-destruction`); `{variant}-{modifier}`
  carries the per-variant color.
- **Badges are also rendered directly (not via `GameBadge`)** — all four games' picker modals
  (`AddCharacterModal` HSR + N2E, `AddArcanistModal` R1999, `AddOperatorModal` AE) render two
  badge spans each by hand. Their markup gains `game-badge` so they inherit the base too.
- **Delete the per-game `.{variant}-badge` base rules** from `App.css` (`.element-badge`),
  `CharacterCard.css` (HSR `.path-badge`), `ArcanistCard.css` (`.afflatus-badge` /
  `.damage-badge`), N2E `CharacterCard.css` (`.esper-badge` / `.arc-badge`), and `OperatorCard.css`
  (the three `.endfield-*-badge` rules). Keep only the per-variant **color** rules.
- **Fix AE colors** — bump the `.endfield-*` modifiers from `rgba(hue, 0.15)` / `0.3` to the
  canonical `rgba(hue, 0.25)` / `0.6`. (This is the visible AE fix.)
- **Converge HSR `.element-badge`** — drop the flat-black base. Because the standalone
  `.element-*` classes are shared with the party slot-avatar border, the canonical tint is added
  via compound `.element-badge.element-*` rules (badge-scoped), leaving the standalone rules — and
  thus the avatars — unchanged. Element pills now match the path pill beside them, including
  `.element-thunder` (the real catalog value for 10 characters). (User-approved visible change to
  HSR.)
- **Behavior-preserving for the canonical five** — `.path/afflatus/damage/esper/arc` render the
  same pixels; their base simply moves to `.game-badge`. Only AE and HSR-element change visually,
  both toward the canonical pill.
- **Storybook + docs** — document `.game-badge` as the shared base, add the AE
  (`endfield-class` / `endfield-element` / `endfield-weapon`) variants to `GameBadge.stories.tsx`,
  and update `src/styles/components.md`.

## Capabilities

### New Capabilities

- `shared-card-badges`: The canonical card "pill" badge — base appearance defined once as
  `.game-badge` in `card.css` and emitted by the shared `GameBadge` component; game stylesheets
  contribute only per-variant color modifiers and MUST NOT re-declare the base.

## Impact

- **Modified (CSS base):** `src/styles/card.css` (+ `.game-badge`).
- **Modified (component):** `src/components/GameBadge.tsx` (emit `game-badge`).
- **Modified (per-game CSS — delete base, keep/adjust colors):** `src/App.css`,
  `src/pages/honkai-star-rail/components/CharacterCard.css`,
  `src/pages/reverse1999/components/ArcanistCard.css`,
  `src/pages/neverness-to-everness/components/CharacterCard.css`,
  `src/pages/arknights-endfield/components/OperatorCard.css` (+ color bump).
- **Modified (direct-render markup, all four picker modals):**
  `src/pages/honkai-star-rail/components/AddCharacterModal.tsx`,
  `src/pages/neverness-to-everness/components/AddCharacterModal.tsx`,
  `src/pages/reverse1999/components/AddArcanistModal.tsx`,
  `src/pages/arknights-endfield/components/AddOperatorModal.tsx`.
- **Tests:** `src/components/GameBadge.test.tsx` (assert `game-badge` present).
  `AddCharacterModal.test.tsx` already queries `.element-badge.element-thunder` — still valid.
- **Storybook:** `GameBadge.stories.tsx` (+ AE variants, import `OperatorCard.css`).
- **Docs:** `src/styles/components.md` (badge sections).
- **No DB, service, hook, type, or data-catalog changes.**
- **Out of scope:** `.score-badge` (HSR), `.cartridge-*-badge` (N2E), `.pref-stat-badge` /
  `.pref-operator-badge`, the `.game-tag-badge` / `.requires-login-badge` selection-page pills —
  none are `GameBadge` pills and each has its own design. Tokenizing the `3px 8px` padding and the
  per-variant rgba opacities is deferred (the rgba opacities are the documented "rgba() badge
  backgrounds" known gap).
