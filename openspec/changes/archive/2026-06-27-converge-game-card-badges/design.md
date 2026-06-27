## Context

`GameBadge` (`src/components/GameBadge.tsx`) renders every header pill in the app as
`<span className="{variant}-badge {variant}-{modifier}">`. The _base_ look of that pill —
padding, radius, weight, uppercase, blur, border — was never centralised; it lives as a
repeated rule on each game's `.{variant}-badge` selector. Three games kept identical copies;
AE and HSR-element drifted. This change introduces the missing L2 base class and converges all
`GameBadge` variants onto it.

## Key decisions

### 1. Base goes on a new `.game-badge` class, not on a group selector

Two ways to deduplicate were considered:

- **(A, chosen)** A single base class `.game-badge` in `card.css`; every renderer includes it.
  Mirrors the `shared-card-controls` precedent exactly (`.toggle-btn` is the base; modifiers are
  additive). A new game inherits the base for free — no L2 edit needed.
- **(B, rejected)** Keep the base on a group selector that enumerates every variant name
  (`.element-badge, .path-badge, .afflatus-badge, … { … }`) in `card.css`. This couples L2 to
  every game's L4 vocabulary and forces a `card.css` edit for each new game. Rejected.

`card.css` is globally imported via `src/index.css`, so `.game-badge` is available app-wide
without per-page imports — the same load path `.toggle-btn` uses.

### 2. `{variant}-badge` is retained as a scoping hook — do NOT drop it

The per-variant color rules are **compound** selectors in the canonical games:
`.path-badge.path-destruction`, `.afflatus-badge.afflatus-plant`, `.esper-badge.esper-anima`.
They only match when _both_ classes are present. Therefore `GameBadge` must emit
**`game-badge {variant}-badge {variant}-{modifier}`** — replacing `{variant}-badge` with
`game-badge` would silently break every compound color rule. AE's color rules are _standalone_
(`.endfield-class-caster`), so they keep matching regardless; retaining `{variant}-badge` is
harmless there and keeps the component uniform.

### 3. Direct-render call sites must opt in

Badges are rendered **outside** `GameBadge`, by hand, in **all four** games' picker modals — two
badge spans each:

- HSR `AddCharacterModal` → `element-badge`, `path-badge`
- N2E `AddCharacterModal` → `esper-badge`, `arc-badge`
- R1999 `AddArcanistModal` → `afflatus-badge`, `damage-badge`
- AE `AddOperatorModal` → `endfield-class-badge`, `endfield-element-badge`

Because the base now lives only on `.game-badge`, each of these eight class strings must gain
`game-badge` or it would render with no base style. All get `game-badge ` prepended. (Converting
them to the `GameBadge` component is a larger refactor with test-selector churn and is left out of
scope.)

### 4. `.game-badge` base definition (canonical pill)

```css
.game-badge {
  padding: 3px 8px;
  border-radius: var(--border-radius-badge);
  font-size: var(--typography-font-size-xs);
  font-weight: var(--typography-font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid;
  line-height: var(--typography-line-height-tight);
  white-space: nowrap;
}
```

`border: 1px solid` (no color) is intentional — the per-variant modifier supplies `border-color`.
This is byte-identical to the deleted base of `.path-badge` / `.afflatus-badge` / `.damage-badge`
/ `.esper-badge` / `.arc-badge` (plus the `-webkit-` prefix for Safari, matching `card.css`'s
overlay rule), so those five variants are pixel-unchanged.

### 5. AE color fix

The `.endfield-*` modifiers move from faint to canonical opacity:

|        | before            | after             |
| ------ | ----------------- | ----------------- |
| fill   | `rgba(hue, 0.15)` | `rgba(hue, 0.25)` |
| border | `rgba(hue, 0.3)`  | `rgba(hue, 0.6)`  |

Hues are unchanged. Combined with inheriting `.game-badge` (bold + uppercase + blur), this makes
AE pills match the canonical look.

### 6. HSR `.element-badge` convergence (user-approved visible change)

The flat-dark base (`background: rgba(0,0,0,0.3)`, `letter-spacing: 0.1em`, `font-weight: 600`,
`border-radius: var(--border-radius-sm)`) is deleted; the base now comes from `.game-badge`.

**Critical constraint: the standalone `.element-*` classes are shared.** They style not only the
badge but also the HSR party **slot-avatar** border (`PartyCard.tsx`:
`slot-avatar element-${element}`). So the badge's tinted fill must NOT be added to the standalone
`.element-*` rules — that would tint every slot avatar. Instead:

- **Standalone `.element-*` (8, incl. `.element-thunder`)** are left as `color` + `border: 1px
solid rgba(hue, orig-opacity)` — unchanged, serving the avatar border and the badge's text
  colour. (Original border opacities preserved: lightning/thunder `0.55`, quantum `0.4`, the rest
  `0.3`.)
- **Compound `.element-badge.element-*` (8)** add the canonical badge tint
  `background: rgba(hue, 0.25); border-color: rgba(hue, 0.6)`. Higher specificity (0,2,0) means
  the badge border resolves to `0.6` while the avatar (no `element-badge` class) keeps the
  standalone `0.3`/`0.55`. This mirrors the compound pattern the other games already use
  (`.path-badge.path-*`, `.afflatus-badge.afflatus-*`).

Hues: fire `248,79,54`; ice `71,199,253`; lightning + thunder `217,122,254`; wind `91,200,159`;
quantum `120,100,170`; imaginary `244,210,88`; physical `188,188,188`.

`.element-thunder` is the actual class for 10 catalog characters (the data uses `Thunder`, not
`Lightning`); it previously had no badge tint and fell back to the deleted dark base, so it is
included in the compound tint here — fixing a latent gap as well as the AE bug.

## Risks / trade-offs

- **Cross-file cascade.** `.game-badge` (card.css, via index.css) and the per-variant color rules
  (App.css / per-game CSS) live in different files. Because `.game-badge` sets no `color` /
  `background` / `border-color`, there is no property collision with the modifiers — load order is
  irrelevant. This is the failure mode the "leave element as exception" alternative would have
  invited (two competing _bases_), and the chosen approach avoids it.
- **HSR element visual change** is intentional and user-approved; it is the only break from strict
  behavior-preservation besides the AE fix.

## Out of scope

- `.score-badge`, `.cartridge-rarity-badge` / `.cartridge-score-badge`, `.pref-stat-badge` /
  `.pref-operator-badge`, `.game-tag-badge` / `.requires-login-badge` — not `GameBadge` pills.
- Tokenizing badge padding and the per-variant rgba opacities (documented known gap).
- Converting the picker-modal badges (eight spans across four modals) to the `GameBadge` component.
