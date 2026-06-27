## 1. Canonical `.game-badge` base

- [x] 1.1 In `src/styles/card.css`, add a `.game-badge` rule with the canonical pill base
      (`padding: 3px 8px`, `border-radius: var(--border-radius-badge)`, `font-size:
var(--typography-font-size-xs)`, `font-weight: var(--typography-font-weight-bold)`,
      `text-transform: uppercase`, `letter-spacing: 0.04em`, `backdrop-filter: blur(8px)` +
      `-webkit-` prefix, `border: 1px solid`, `line-height: var(--typography-line-height-tight)`,
      `white-space: nowrap`), placed near `.game-card-badges`.

## 2. `GameBadge` emits the base

- [x] 2.1 In `src/components/GameBadge.tsx`, change the emitted class list to
      `game-badge ${variant}-badge ${variant}-${modifier}` (keep `${variant}-badge`).
- [x] 2.2 Update `src/components/GameBadge.test.tsx` to assert the span also has the
      `game-badge` class.

## 3. Direct-render call sites opt in (all four picker modals)

- [x] 3.1 HSR `AddCharacterModal.tsx`: prepend `game-badge ` to the `element-badge` and
      `path-badge` `className`s.
- [x] 3.2 N2E `AddCharacterModal.tsx`: prepend `game-badge ` to the `esper-badge` and
      `arc-badge` `className`s.
- [x] 3.3 R1999 `AddArcanistModal.tsx`: prepend `game-badge ` to the `afflatus-badge` and
      `damage-badge` `className`s.
- [x] 3.4 AE `AddOperatorModal.tsx`: prepend `game-badge ` to the `endfield-class-badge` and
      `endfield-element-badge` `className`s.

## 4. Delete per-game base rules (keep color modifiers)

- [x] 4.1 In `src/App.css`, delete the `.element-badge` base rule (keep the `.element-*` color
      rules — they are rewritten in task 6).
- [x] 4.2 In HSR `CharacterCard.css`, delete the `.path-badge` base rule (keep `.path-badge.path-*`
      color rules). Leave `.score-badge` untouched.
- [x] 4.3 In R1999 `ArcanistCard.css`, delete the `.afflatus-badge, .damage-badge` base rule (keep
      the `.afflatus-badge.afflatus-*` / `.damage-badge.damage-*` color rules).
- [x] 4.4 In N2E `CharacterCard.css`, delete the `.esper-badge, .arc-badge` base rule (keep the
      `.esper-badge.esper-*` / `.arc-badge.arc-*` color rules). Leave cartridge badges untouched.
- [x] 4.5 In AE `OperatorCard.css`, delete the three `.endfield-class-badge` /
      `.endfield-element-badge` / `.endfield-weapon-badge` base rules (keep the per-variant color
      rules, adjusted in task 5).

## 5. Fix AE colors to canonical opacity

- [x] 5.1 In AE `OperatorCard.css`, change every `.endfield-*` modifier fill from `rgba(hue, 0.15)`
      to `rgba(hue, 0.25)` and every border from `rgba(hue, 0.3)` to `rgba(hue, 0.6)`. Hues and text
      colors unchanged.

## 6. Converge HSR element colors to canonical tinted pill (badge-scoped)

- [x] 6.1 In `src/App.css`, delete the `.element-badge` flat-dark base but KEEP the standalone
      `.element-*` rules (color + `border: 1px solid rgba(hue, orig-opacity)`) intact — they also
      style the party slot-avatar border, so they must not gain a background.
- [x] 6.2 Add compound `.element-badge.element-*` rules (8, incl. `.element-thunder`) that set the
      canonical badge tint `background: rgba(hue, 0.25); border-color: rgba(hue, 0.6)`. Higher
      specificity keeps the badge at 0.6 while the avatar keeps the standalone 0.3/0.55 border.
      Mirrors the other games' compound `.{variant}-badge.{variant}-*` pattern.

## 7. Storybook + docs

- [x] 7.1 In `GameBadge.stories.tsx`, import `OperatorCard.css` and add `AEClass`, `AEElement`,
      `AEWeapon` stories covering the endfield variants.
- [x] 7.2 In `src/styles/components.md`, document `.game-badge` as the shared base and note that
      game badge sections contribute color-only modifiers; refresh the badge tables if needed.

## 8. Tests + verify

- [x] 8.1 Run `npm test` and confirm green (especially `GameBadge.test.tsx`,
      `AddCharacterModal.test.tsx`, `OperatorCard.test.tsx`).
- [x] 8.2 Run `npm run lint && npm run format:check`.
- [x] 8.3 Run `npm run build` (TS check + token build) and `npm run build:storybook`.
- [x] 8.4 Visual check performed via Playwright screenshots of the built `GameBadge` Storybook
      stories on a dark background: AE class/element/weapon now render as bold, uppercase, tinted
      glass pills matching the R1999 afflatus / HSR path reference; HSR element renders identically
      to the HSR path pill beside it; R1999 afflatus (canonical) is unchanged. Confirmed by eye.
