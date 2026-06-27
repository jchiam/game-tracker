# Game Tracker — Component Library Reference

Design system for a dark-themed game progression tracker. All tokens referenced here are defined in `src/styles/design-tokens.json` and generated into `src/styles/tokens.css`.

**Theme summary:** Dark cosmic background (`--color-bg-base: #0a0a0f`), gold primary accent (`--color-brand-primary: #d4af37`), purple secondary accent (`--color-brand-accent: #8b5cf6`), glassmorphism surfaces with backdrop blur.

---

## Global Patterns

### Buttons

Base `<button>` is globally styled with glassmorphism, shimmer `::before` effect, and gold hover glow.

| Class               | Description                                            |
| ------------------- | ------------------------------------------------------ |
| _(default)_         | Glassmorphism button, gold border + glow on hover      |
| `.primary-action`   | Gold gradient fill, black text, extrabold label        |
| `.secondary-action` | Transparent, muted border, white on hover              |
| `.icon-btn`         | Circular, no text, icon-only                           |
| `.close-btn`        | Top-right modal close, transparent, ✕ symbol           |
| `.remove-btn`       | Danger remove (✕), red hover color `--color-ui-danger` |
| `.favorite-btn`     | Favorite toggle (★/☆), gold when active                |

```html
<button>Default</button>
<button class="primary-action">Save</button>
<button class="secondary-action">Cancel</button>
<button class="close-btn">✕</button>
<button class="remove-btn">✕</button>
<button class="favorite-btn active">★</button>
```

**Tokens used:** `--color-brand-primary`, `--color-brand-primary-glow`, `--color-ui-border`, `--color-text-primary`, `--color-ui-danger`, `--transition-normal`, `--border-radius-md`

---

### Form Group

Consistent label + input/textarea/select pattern used across all modals.

```html
<div class="form-group">
  <label>Field Label</label>
  <input type="text" placeholder="..." />
</div>
<div class="form-group">
  <label>Notes</label>
  <textarea rows="3" placeholder="..."></textarea>
</div>
```

**Tokens used:** `--color-bg-surface`, `--color-ui-border`, `--color-text-primary`, `--color-text-secondary`, `--typography-font-size-base`, `--spacing-md`, `--border-radius-md`

---

### Canonical pill badge (`.game-badge`)

All header "pill" badges share one base class, `.game-badge`, defined once in
`src/styles/card.css`: `padding: 3px 8px`, `--border-radius-badge`, `--typography-font-size-xs`,
bold, UPPERCASE, `letter-spacing: 0.04em`, `backdrop-filter: blur(8px)`, `1px solid` border,
tight line-height, `white-space: nowrap`. The shared `GameBadge` component emits
`game-badge {variant}-badge {variant}-{modifier}`; the few badges rendered by hand (the picker
modals) include `game-badge` in their class string too.

Per-game stylesheets contribute **only** the per-variant colour rule — text colour plus a tinted
fill `rgba(hue, 0.25)` and border `rgba(hue, 0.6)`. They never re-declare the base. (The rgba
fills stay literal — see the "rgba() badge backgrounds" known gap.)

### Element Badge (HSR)

Canonical pill (`.game-badge` base). The standalone `.element-*` classes set text colour + a
coloured border and are **shared with the party slot-avatar**; the badge's tinted fill is added
by the compound `.element-badge.element-*` rules (so it doesn't bleed into the avatar). Uppercase
label.

| Class modifier       | Element   | Color                                     |
| -------------------- | --------- | ----------------------------------------- |
| `.element-lightning` | Lightning | `--color-hsr-element-lightning` (#d97afe) |
| `.element-imaginary` | Imaginary | `--color-hsr-element-imaginary` (#f4d258) |
| `.element-fire`      | Fire      | `--color-hsr-element-fire` (#f84f36)      |
| `.element-ice`       | Ice       | `--color-hsr-element-ice` (#47c7fd)       |
| `.element-quantum`   | Quantum   | `--color-hsr-element-quantum` (#7864aa)   |
| `.element-wind`      | Wind      | `--color-hsr-element-wind` (#5bc89f)      |
| `.element-physical`  | Physical  | `--color-hsr-element-physical` (#bcbcbc)  |
| `.element-thunder`   | Thunder   | `--color-hsr-element-thunder` (#d97afe)   |

```html
<span class="game-badge element-badge element-fire">Fire</span>
<span class="game-badge element-badge element-ice">Ice</span>
```

**Tokens used:** `--border-radius-badge`, `--typography-font-size-xs`, `--color-hsr-element-*`

---

## Card Patterns (canonical, all games)

Every game's roster card is built from the same canonical `.game-card-*` skeleton in
`src/styles/card.css` and `src/styles/controls.css`. Game CSS files add only overrides
(padding, hover transforms) and game-unique rules — they must **never** re-declare a
rule that already exists in `card.css` or `controls.css`. See the **Card Patterns** and
**Control Patterns** Storybook stories for live examples.

### Collapse mechanism (static summary ⇄ edit body)

A card body toggles between a read-only summary and an editing body by adding
`.is-editing` to `.game-card-body`. The structure is identical across HSR, R1999, and
N2E; each game only tunes two height budgets via custom properties set inline on the
card root (`--game-card-summary-max-height`, `--game-card-edit-max-height`).

```html
<div class="game-card-body is-editing">
  <h3 class="game-card-name">Unit Name</h3>

  <!-- collapses to height 0 when .is-editing -->
  <div class="game-card-static-summary">
    <div class="game-card-static-stats">
      <!-- StatChips colored by investment (see below) -->
    </div>
    <div class="game-card-static-line">Equipped Gear · Lv 60 · A5</div>
  </div>

  <!-- expands from height 0 when .is-editing -->
  <div class="game-card-edit-body">
    <div class="game-card-edit-body-inner">
      <!-- ProgressSections, sliders, toggle buttons -->
    </div>
  </div>

  <button class="edit-toggle-btn">✎</button>
</div>
```

| Class                        | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| `.game-card-static-summary`  | Collapsed read-only summary (chips row + one-liner) |
| `.game-card-static-stats`    | Row of `StatChip`s (`.stat-chip`)                   |
| `.game-card-static-line`     | Single-line equip digest (truncates with ellipsis)  |
| `.game-card-edit-body`       | Editing container, height-animated open/closed      |
| `.game-card-edit-body-inner` | Edit-body content wrapper                           |
| `.edit-toggle-btn`           | ✎ toggle that flips `.is-editing`                   |

**Tokens used:** `--spacing-3`, `--spacing-md`, `--spacing-lg`, `--typography-font-size-sm`, `--color-text-secondary`

### Investment-color language (`getProgressStyle`)

`src/utils/progressGradient.ts` maps a normalized progress value to a continuous
**rust → amber → gold → teal** gradient (`getProgressStyle(value, min, max)`). It is the
single source of truth for "how invested is this unit" color across all games:

- **Summary chips** — each `StatChip` in `.game-card-static-stats` gets its `color` and
  `borderColor` from `getProgressStyle` (e.g. `Lv 80`, `P5`, `R15`).
- **Level sliders** — the `.level-slider` track fill plus `--slider-fill-color` /
  `--slider-fill-glow` (thumb fill + glow) derive from the same value, so the slider and
  the chip for that value read the same color.
- **Gear one-liner** — `.game-card-static-line` text is tinted by the gradient
  (full-investment teal when equipped, dull rust `—` when empty).

Anchor stops: `0% #8a6050` (rust, uninvested) → `33% #c88040` (amber) → `67% #d4af37`
(gold) → `100% #40c8a0` (teal, complete). See the **Investment Color** Storybook story.

> Intrinsic properties (rarity, element, afflatus) are **not** investment and keep their
> own fixed badge colors — only progress/level/equip state uses the gradient.

---

## Shared Components

### Navbar

`src/components/Navbar.tsx` | `src/components/Navbar.css`

Sticky top navigation bar with glassmorphism. Contains game switcher (left), auth section (right).

```html
<nav class="navbar">
  <div class="nav-left">
    <!-- GameSwitcher -->
  </div>
  <div class="nav-auth">
    <span class="user-email">user@example.com</span>
    <button>Sign Out</button>
  </div>
</nav>
```

**Tokens used:** `--color-bg-surface`, `--color-ui-border`, `--color-brand-primary`, `--z-index-sticky`, `--transition-normal`

---

### GameSwitcher

`src/components/GameSwitcher.tsx` | `src/components/GameSwitcher.css`

Dropdown selector for switching between tracked games. Animated with `slideIn` keyframe.

| Class                   | Description                                |
| ----------------------- | ------------------------------------------ |
| `.switcher-trigger`     | Button that opens dropdown                 |
| `.switcher-dropdown`    | Dropdown panel, `z-index: --z-index-modal` |
| `.dropdown-item`        | Individual game option                     |
| `.dropdown-item.active` | Currently selected game, gold left border  |
| `.back-to-selection`    | Footer link to game selection page         |

```html
<div class="game-switcher">
  <button class="switcher-trigger">Game Name ▾</button>
  <div class="switcher-dropdown">
    <div class="dropdown-header">SWITCH GAME</div>
    <div class="dropdown-item active">
      <img class="dropdown-game-icon" src="..." alt="" />
      <span class="game-name">Honkai: Star Rail</span>
      <span class="active-indicator">●</span>
    </div>
    <div class="dropdown-item">...</div>
    <a class="back-to-selection" href="/">← Back to Selection</a>
  </div>
</div>
```

**Tokens used:** `--color-brand-primary`, `--color-brand-primary-rgb`, `--color-bg-elevated`, `--shadow-lg`, `--border-radius-lg`, `--transition-fast`, `--z-index-modal`

---

### Modal

`src/components/Modal.tsx` | `src/components/Modal.css`

Base modal shell. Overlay dismisses on mousedown outside modal content. Escape key closes. Animated with `slide-up` + `fade-in` keyframes.

```html
<div class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Modal Title</h2>
      <button class="close-btn">✕</button>
    </div>
    <!-- children -->
    <div class="modal-body">
      <!-- form-groups, lists, etc. -->
    </div>
    <div class="modal-footer">
      <button class="secondary-action">Cancel</button>
      <button class="primary-action">Save</button>
    </div>
  </div>
</div>
```

**Tokens used:** `--color-bg-surface`, `--shadow-modal`, `--border-radius-lg`, `--z-index-modal`, `--spacing-lg`, `--spacing-md`

---

### AddEntityModal (shared across games)

`src/components/AddEntityModal.css`

Search + scrollable list pattern used by every game's entity picker — AddCharacterModal (HSR / N2E), AddArcanistModal (R1999), AddOperatorModal (Endfield).

```html
<div class="modal-content add-entity-modal">
  <div class="modal-header">...</div>
  <div class="modal-search">
    <input class="modal-search-input" placeholder="Search..." />
  </div>
  <ul class="modal-list">
    <li class="modal-list-item">
      <div class="modal-list-img-wrapper">
        <img src="..." alt="" />
      </div>
      <span class="modal-list-name">Character Name</span>
      <span class="game-badge element-badge element-fire">Fire</span>
      <button class="add-btn">+</button>
    </li>
  </ul>
</div>
```

**Tokens used:** `--color-bg-surface`, `--color-ui-border`, `--color-brand-primary`, `--spacing-md`, `--border-radius-md`

---

### PartyEditorModal (shared across games)

`src/components/PartyEditorModal.css`

Party/lineup creation and editing. Used by every game's party editor with game-specific entity names.

| Class                | Description                        |
| -------------------- | ---------------------------------- |
| `.tier-btn`          | Tier selector buttons (S+/S/A/B)   |
| `.tier-btn.active`   | Selected tier, lit with tier color |
| `.team-slot`         | Empty or filled team member slot   |
| `.slot-avatar`       | Circular character/arcanist avatar |
| `.remove-member-btn` | Remove member from slot (✕)        |

```html
<div class="modal-content party-editor-modal">
  <div class="form-group">
    <label>Party Name</label>
    <input type="text" />
  </div>
  <div class="form-group tier-selector">
    <label>Tier</label>
    <div class="tier-btn-group">
      <button class="tier-btn tier-splus active">S+</button>
      <button class="tier-btn tier-s">S</button>
      <button class="tier-btn tier-a">A</button>
      <button class="tier-btn tier-b">B</button>
    </div>
  </div>
  <div class="team-slots">
    <div class="team-slot filled">
      <img class="slot-avatar" src="..." alt="" />
      <button class="remove-member-btn">✕</button>
      <span class="slot-name">Name</span>
    </div>
    <div class="team-slot empty">
      <button class="add-slot-btn">+</button>
    </div>
  </div>
  <div class="form-group">
    <label>Notes</label>
    <textarea></textarea>
  </div>
</div>
```

**Tokens used:** `--color-tier-splus/s/a/b`, `--color-brand-primary`, `--color-ui-danger`, `--border-radius-full` (avatars), `--spacing-md`, `--typography-font-size-base`

---

### ConfirmCheckbox

`src/components/ConfirmCheckbox.tsx` | `src/components/ConfirmCheckbox.css`

Two-step confirmation checkbox. First click enters "confirming" state with 3s timeout; second click confirms. Used for destructive actions (e.g., clear traces).

| Class/state                    | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `.confirm-checkbox`            | Default state                                                |
| `.confirm-checkbox.confirming` | Warning state — yellow/orange border, `pulse-warn` animation |
| `.confirm-checkbox.checked`    | Confirmed state — gold glow                                  |

```html
<div class="confirm-checkbox">
  <div class="checkbox-box"><!-- checkmark or empty --></div>
  <span>Confirm action</span>
</div>
```

**Tokens used:** `--color-brand-primary`, `--color-brand-primary-glow`, `--color-ui-warning`, `--border-radius-sm`, `--transition-fast`

---

### SavingToast

`src/components/SavingToast.tsx` | `src/components/SavingToast.css`

Inline "Saving..." indicator with animated dots. Conditionally rendered while save is in progress.

```html
<div class="saving-toast">
  <div class="saving-toast-dots">
    <span class="saving-toast-dot"></span>
    <span class="saving-toast-dot"></span>
    <span class="saving-toast-dot"></span>
  </div>
  <span>Saving...</span>
</div>
```

**Tokens used:** `--color-brand-primary`, `--color-text-secondary`, `--border-radius-full`, `--typography-font-size-base`
**Animation:** `saving-toast-pulse` with staggered `animation-delay` on each dot

---

### ToastContainer

`src/components/ToastContainer.tsx` | `src/components/ToastContainer.css`

Stacked toast notification list, fixed bottom-right. Each toast slides in from right.

| Class            | Type    | Background token           |
| ---------------- | ------- | -------------------------- |
| `.toast-error`   | Error   | `--color-toast-error-bg`   |
| `.toast-warning` | Warning | `--color-toast-warning-bg` |
| `.toast-success` | Success | `--color-toast-success-bg` |
| `.toast-info`    | Info    | `--color-toast-info-bg`    |

```html
<div class="toast-container">
  <div class="toast toast-error" role="alert">
    <span class="toast-icon">✕</span>
    <span class="toast-message">Something went wrong</span>
    <button class="toast-close">✕</button>
  </div>
  <div class="toast toast-success" role="alert">
    <span class="toast-icon">✓</span>
    <span class="toast-message">Saved successfully</span>
    <button class="toast-close">✕</button>
  </div>
</div>
```

**Tokens used:** `--color-toast-*-bg`, `--color-toast-*-border`, `--shadow-md`, `--z-index-toast`, `--border-radius-md`, `--spacing-md`, `--typography-font-size-base`
**Animation:** `toast-slide-in`

---

### LoadErrorState / AuthGate

`src/components/LoadErrorState.tsx` | `src/components/AuthGate.tsx`

Empty state screens. LoadErrorState shows error + retry button. AuthGate shows sign-in prompt.

```html
<!-- LoadErrorState -->
<div class="load-error-state">
  <p>Failed to load data.</p>
  <button>Retry</button>
</div>

<!-- AuthGate -->
<div class="auth-gate">
  <h2>Sign in to continue</h2>
  <p>Track your progress across games.</p>
  <button class="primary-action">Sign In with Google</button>
</div>
```

---

## Pages

### SelectionPage

`src/pages/SelectionPage.tsx` | `src/pages/SelectionPage.css`

Game selection grid. Each game card has a full-bleed header image, overlay gradient, character art, badge, tags, and description.

| Class                   | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `.game-card`            | Full card — backdrop blur surface, gold hover border + glow |
| `.game-card-header`     | 320px image section with `background-size: cover`           |
| `.game-card-overlay`    | Gradient overlay (dark top + bottom) over header            |
| `.game-character-image` | Character art, scales on hover                              |
| `.game-card-badges`     | Badge cluster, bottom-right of header                       |
| `.requires-login-badge` | "REQUIRES LOGIN" pill badge, gold border                    |
| `.game-card-body`       | Title, tags, description section                            |
| `.game-name`            | Large title, turns gold on hover                            |
| `.game-tag-badge`       | Small muted pill (e.g. "GACHA", "RPG")                      |
| `.game-description`     | Body text                                                   |

```html
<section class="selection-page">
  <header class="selection-hero">
    <h1>Your Games</h1>
    <p>Select a game to continue tracking</p>
  </header>
  <div class="game-grid">
    <button class="game-card">
      <div class="game-card-header bg-honkai-star-rail-sel">
        <div class="game-card-overlay"></div>
        <img class="game-character-image" src="..." alt="" />
        <div class="game-card-badges">
          <span class="requires-login-badge">REQUIRES LOGIN</span>
        </div>
      </div>
      <div class="game-card-body">
        <div class="game-title-row">
          <h2 class="game-name">Honkai: Star Rail</h2>
          <div class="game-tags">
            <span class="game-tag-badge">GACHA</span>
          </div>
        </div>
        <p class="game-description">Track characters, relics, and team builds.</p>
      </div>
    </button>
  </div>
</section>
```

**Tokens used:** `--color-bg-surface`, `--color-ui-border`, `--color-brand-primary`, `--color-brand-primary-glow`, `--shadow-card-hover`, `--border-radius-lg`, `--typography-font-size-display`, `--spacing-3xl`
**Animation:** `fade-in-up` with staggered `animation-delay` per card; `fade-in-down` for hero

---

### HsrPage / Reverse1999Page

`src/pages/honkai-star-rail/HsrPage.tsx` | `src/pages/reverse1999/Reverse1999Page.tsx`

Main game page. Shared layout: hero header → view selector tabs (Roster / Lineups) → controls bar (search + sort + add) → content grid.

| Class                                      | Description                                        |
| ------------------------------------------ | -------------------------------------------------- |
| `.page-hero`                               | Full-width hero with gradient title + subtitle     |
| `.view-selector`                           | Tab row, switches between Roster and Lineups views |
| `.view-btn`                                | Individual tab button                              |
| `.view-btn.active`                         | Active tab — gold border + glow                    |
| `.roster-controls`                         | Search + sort + add button row                     |
| `.roster-search-input`                     | Text input with magnifier icon                     |
| `.sort-btn`                                | Sort toggle, shows current sort label              |
| `.add-character-btn` / `.add-arcanist-btn` | Primary add button (+)                             |
| `.roster-grid`                             | Responsive card grid                               |
| `.empty-state`                             | No-results message                                 |

```html
<div class="game-page">
  <header class="page-hero">
    <h1 class="page-title">Honkai: Star Rail</h1>
    <p class="page-subtitle">Your roster</p>
  </header>

  <div class="view-selector">
    <button class="view-btn active">Roster</button>
    <button class="view-btn">Lineups</button>
  </div>

  <div class="roster-controls">
    <input class="roster-search-input" placeholder="Search..." />
    <button class="sort-btn">
      <span class="sort-btn-label">SORT</span>
      <span class="sort-btn-value">Name ↑</span>
    </button>
    <button class="add-character-btn">+</button>
  </div>

  <div class="roster-grid">
    <!-- CharacterCard or ArcanistCard items -->
  </div>
</div>
```

---

## Game-Specific Components

### CharacterCard (HSR)

`src/pages/honkai-star-rail/components/CharacterCard.tsx` | `CharacterCard.css`

Roster card for a Honkai: Star Rail character. Built on the canonical
`.game-card-*` skeleton + collapse mechanism (see **Card Patterns**). Two modes:
collapsed static summary and edit mode (toggled by ✎).

**Header (`.game-card-header`):** canonical image + overlay + controls. Game-unique
badges in `.game-card-badges`:

| Class                | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `.element-badge`     | Element type pill (`element-fire`, `element-ice`, …) |
| `.path-badge`        | Path type pill (`path-the-hunt`, `path-harmony`, …)  |
| `.score-badge`       | Build score badge (`tier-s` / `tier-a` / `tier-b`)   |
| `.hsr-overlay-right` | Groups score badge + edit toggle (HSR-local)         |

**Collapsed summary (`.game-card-static-summary`):**

- `.game-card-static-stats` — `StatChip`s for `Lv {n}`, `Traces ✓/✗`, `Relics n/6`,
  each colored by `getProgressStyle` (investment gradient).
- `.game-card-static-line` — relic-set one-liner (abbreviated set names + counts,
  tinted by gradient; `—` via `.no-equip` when nothing equipped).

**Edit body (`.game-card-edit-body-inner`):**

| Class                  | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `.progress-section`    | Level / Eidolons / Traces sections (shared `ProgressSection`)      |
| `.level-slider`        | Range input with gradient fill via `--slider-fill-color` / `-glow` |
| `.relics-grid`         | 6-column relic slot grid                                           |
| `.relic-slot`          | Individual relic slot; `.active` shows equipped relic set icon     |
| `.build-prefs-display` | Build preference section (main stats + substats)                   |
| `.pref-stat-badge`     | Stat name chip with operator (>, >=, OR)                           |
| `.pref-operator-badge` | Operator connector between stats                                   |

```html
<div class="game-card">
  <div class="game-card-header">
    <div class="game-card-overlay"></div>
    <img class="game-card-image" src="..." alt="" />
    <div class="game-card-controls">
      <div class="game-card-controls-top">
        <button class="favorite-btn">★</button>
        <button class="remove-btn">✕</button>
      </div>
      <div class="game-card-controls-bottom">
        <div class="game-card-badges">
          <span class="game-badge element-badge element-ice">Ice</span>
          <span class="game-badge path-badge path-the-hunt">The Hunt</span>
        </div>
        <div class="hsr-overlay-right">
          <span class="score-badge tier-s"><span>S</span></span>
          <button class="edit-toggle-btn">✎</button>
        </div>
      </div>
    </div>
  </div>
  <div class="game-card-body is-editing">
    <h3 class="game-card-name">Seele</h3>
    <div class="game-card-static-summary">
      <div class="game-card-static-stats">
        <span class="stat-chip">Lv 80</span>
        <span class="stat-chip">Relics 6/6</span>
      </div>
      <div class="game-card-static-line">Glamoth 4 · Space Sealing 2</div>
    </div>
    <div class="game-card-edit-body">
      <div class="game-card-edit-body-inner">
        <div class="relics-grid">
          <div class="relic-slot active"><img class="relic-set-icon" src="..." alt="" /></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Tokens used:** `--color-hsr-path-*`, `--color-hsr-element-*`, `--color-hsr-score-tier-a*`, `--shadow-card-hover`, `--shadow-inset-glow`, `--border-radius-lg`, `--typography-font-size-2xl`, `--color-ui-danger`

---

### CharacterCard (N2E — Neverness to Everness)

`src/pages/neverness-to-everness/components/CharacterCard.tsx` | `CharacterCard.css`

Roster card for a Neverness to Everness character. Same canonical skeleton + collapse
mechanism as the others; game-unique parts are esper/arc badges, awakening + arc-tier
toggles, and a clickable cartridge slot.

**Header badges:** `.esper-badge` (`esper-anima`, `esper-chaos`, …) and `.arc-badge`
(`arc-gas`, `arc-liquid`, …). `.character-overlay-right` groups the cartridge score
badge + edit toggle.

**Collapsed summary:**

- `.game-card-static-stats` — `StatChip`s for `Lv {n}`, `A {n}/6` (awakening), and an
  optional `Cart {n}%` (cartridge score), each colored by `getProgressStyle`.
- `.game-card-static-line` — selected arc name + equipped cartridge digest (gradient
  tint; `—` via `.no-equip` when empty).

**Edit body:**

| Class                     | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| `.awakening-row`          | Wrapper for the awakening `.toggle-btn` row                          |
| `.arc-tier-row`           | Wrapper for the arc-tier `.toggle-btn.compact` row                   |
| `.cartridge-slot`         | Clickable slot that opens the cartridge editor modal                 |
| `.cartridge-rarity-badge` | S/A/B rarity pill (`rarity-s` / `rarity-a` / `rarity-b`)             |
| `.cartridge-target-build` | Target-build preference display (`.cartridge-score-badge` grade-s…d) |

Awakening/arc-tier buttons use the canonical `.toggle-btn` (`.compact` for arc tier),
the level + arc sliders use `.level-slider`, and the arc/cartridge selects use
`.game-select` — all from `controls.css`. Only the layout wrappers above are game-local.

**Esper badge colors:** `--color-n2e-esper-anima/chaos/cosmos/incantation/lakshana/psyche`
**Arc badge colors:** `--color-n2e-arc-gas/liquid/plasma/solid/synthesis`
**Tokens used:** `--color-n2e-rarity-*`, `--color-n2e-score-grade-*`, `--shadow-card-hover`, `--shadow-inset-glow`, `--border-radius-lg`, `--color-ui-danger`

---

### ArcanistCard (Reverse: 1999)

`src/pages/reverse1999/components/ArcanistCard.tsx` | `ArcanistCard.css`

Roster card for a Reverse: 1999 Arcanist. Same canonical skeleton + collapse mechanism;
richer edit mode with portrait levels, resonance, euphoria, psychube, and amplification.

**Header badges:** `.afflatus-badge` (`afflatus-star`, `afflatus-plant`, …) and
`.damage-badge` (`damage-mental` / `damage-reality`).

**Collapsed summary:**

- `.game-card-static-stats` — `StatChip`s for `Lv {n}`, `P{n}` (portrait), `R{n}`
  (resonance), and `E{n}` (euphoria, when unlocked), each colored by `getProgressStyle`.
- `.game-card-static-line` — equipped psychube name + level + amplification (gradient
  tint; `—` via `.no-psychube` when nothing equipped).

**Edit body:**

| Element                      | Canonical class used                               |
| ---------------------------- | -------------------------------------------------- |
| Portrait buttons (P0–P5)     | `.toggle-btn` (+ `.portrait-reset` modifier on P0) |
| Euphoria buttons (E0–E4)     | `.toggle-btn`                                      |
| Amplify buttons (A1–A5)      | `.toggle-btn.compact`                              |
| Resonance / psychube sliders | `.level-slider`                                    |
| Psychube dropdown            | `.game-select`                                     |

All controls use the canonical primitives from `controls.css`; the only R1999-local
control rules are the `.portrait-reset` modifier and the `.portrait-row` /
`.euphoria-row` / `.amplification-row` layout wrappers.

```html
<div class="game-card">
  <div class="game-card-header">
    <div class="game-card-overlay"></div>
    <img class="game-card-image" src="..." alt="" />
    <div class="game-card-controls">
      <div class="game-card-controls-top">
        <button class="favorite-btn">☆</button>
        <button class="remove-btn">✕</button>
      </div>
      <div class="game-card-controls-bottom">
        <div class="game-card-badges">
          <span class="game-badge afflatus-badge afflatus-star">Star</span>
          <span class="game-badge damage-badge damage-reality">Reality</span>
        </div>
        <button class="edit-toggle-btn">✎</button>
      </div>
    </div>
  </div>
  <div class="game-card-body is-editing">
    <h3 class="game-card-name">Vertin</h3>
    <div class="game-card-static-summary">
      <div class="game-card-static-stats">
        <span class="stat-chip">Lv 60</span>
        <span class="stat-chip">P2</span>
        <span class="stat-chip">R10</span>
      </div>
      <div class="game-card-static-line">His Bounden Duty · Lv 60 · A5</div>
    </div>
    <div class="game-card-edit-body">
      <div class="game-card-edit-body-inner">
        <div class="portrait-row">
          <button class="portrait-btn active">P0</button>
          <button class="portrait-btn">P1</button>
        </div>
        <input type="range" class="resonance-slider" min="1" max="10" />
      </div>
    </div>
  </div>
</div>
```

**Afflatus badge colors:** `--color-r1999-afflatus-plant/star/beast/mineral/intellect/spirit`
**Damage badge colors:** `--color-r1999-damage-mental/reality`
**Tokens used:** `--shadow-card-hover`, `--shadow-inset-glow`, `--border-radius-lg`, `--typography-font-size-2xl`, `--color-ui-danger`

---

### PartyCard (HSR)

`src/pages/honkai-star-rail/components/PartyCard.tsx` | `PartyCard.css`

Team composition card showing 4 member slots with element-colored circular avatars.

```html
<div class="party-card">
  <div class="party-card-header">
    <h3 class="party-name">My Team</h3>
    <div class="party-actions">
      <button class="edit-btn">✎</button>
      <button class="delete-btn">✕</button>
    </div>
  </div>
  <div class="party-notes">Optional notes text</div>
  <div class="party-members">
    <div class="member-slot">
      <div class="member-avatar element-ice">
        <img src="..." alt="" />
      </div>
      <span class="member-name">Seele</span>
    </div>
    <div class="member-slot empty">
      <div class="empty-slot-placeholder">+</div>
    </div>
  </div>
</div>
```

**Tokens used:** `--color-hsr-element-*` (avatar border/glow), `--shadow-lg`, `--border-radius-lg`, `--typography-font-size-xl2`

---

### PartyCard (Reverse: 1999)

`src/pages/reverse1999/components/PartyCard.tsx` | `PartyCard.css`

Similar to HSR PartyCard but adds a tier banner. Favorite button included.

| Class                 | Description                               |
| --------------------- | ----------------------------------------- |
| `.party-tier-banner`  | Full-width colored banner at card top     |
| `.tier-banner-S-plus` | Orange tier banner — `--color-tier-splus` |
| `.tier-banner-S`      | Gold tier banner — `--color-tier-s`       |
| `.tier-banner-A`      | Blue tier banner — `--color-tier-a`       |
| `.tier-banner-B`      | Green tier banner — `--color-tier-b`      |

```html
<div class="party-card">
  <div class="party-tier-banner tier-banner-S">S</div>
  <div class="party-card-header">
    <h3 class="party-name">My Lineup</h3>
    <div class="party-actions">
      <button class="favorite-btn">★</button>
      <button class="edit-btn">✎</button>
      <button class="delete-btn">✕</button>
    </div>
  </div>
  <div class="party-members">
    <!-- 4 member slots -->
  </div>
</div>
```

**Tokens used:** `--color-tier-*`, `--shadow-lg`, `--border-radius-lg`

---

### PartiesTab (shared pattern)

`src/pages/honkai-star-rail/components/PartiesTab.tsx`
`src/pages/reverse1999/components/PartiesTab.tsx`

Tab content container for the Lineups view. Header with create button, responsive grid of PartyCards, empty state.

```html
<div class="parties-tab">
  <div class="parties-header">
    <h2>Lineups</h2>
    <button class="primary-action">Create New Lineup</button>
  </div>
  <div class="parties-grid">
    <!-- PartyCard items -->
  </div>
  <!-- empty state -->
  <div class="empty-state">No lineups yet. Create one above.</div>
</div>
```

---

### RelicEditorModal (HSR)

`src/pages/honkai-star-rail/components/RelicEditorModal.tsx` | `RelicEditorModal.css`

Two-tab modal for managing relic equipment and build preferences.

**Tab 1 — Equip Relic:**

- Relic set dropdown
- Main stat select
- Up to 4 substat rows (type + value, remove button)
- Add substat button
- Un-equip button (danger style)

**Tab 2 — Build Preferences:**

- Main stat chains per slot (Body/Feet/Sphere/Rope)
- Each chain: stat badges connected by operator badges (>, >=, OR)
- Substats chain
- Comments textarea

```html
<div class="modal-content relic-editor-modal">
  <div class="modal-tabs">
    <button class="tab-btn active">Equip Relic</button>
    <button class="tab-btn">Build Preferences</button>
  </div>
  <!-- Tab 1 -->
  <div class="tab-content">
    <div class="form-group">
      <label>Relic Set</label>
      <select>
        ...
      </select>
    </div>
    <div class="substats-section">
      <div class="substat-row">
        <select class="substat-type">
          ...
        </select>
        <input type="number" class="substat-value" />
        <button class="remove-substat">✕</button>
      </div>
    </div>
    <button class="secondary-action danger">Un-equip</button>
  </div>
  <!-- Tab 2 -->
  <div class="tab-content pref-tab">
    <div class="pref-chain">
      <span class="pref-slot-label">Body</span>
      <span class="pref-stat-badge">HP%</span>
      <span class="pref-operator-badge">></span>
      <span class="pref-stat-badge">DEF%</span>
    </div>
  </div>
</div>
```

**Tokens used:** `--color-brand-primary`, `--color-ui-danger`, `--color-ui-border`, `--typography-font-size-base`, `--border-radius-md`, `--spacing-md`
