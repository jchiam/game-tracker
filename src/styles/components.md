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

### Element Badge (HSR)

Colored text + border, no background fill. Uppercase label.

| Class modifier       | Element   | Color                                     |
| -------------------- | --------- | ----------------------------------------- |
| `.element-lightning` | Lightning | `--color-hsr-element-lightning` (#d97afe) |
| `.element-imaginary` | Imaginary | `--color-hsr-element-imaginary` (#f4d258) |
| `.element-fire`      | Fire      | `--color-hsr-element-fire` (#f84f36)      |
| `.element-ice`       | Ice       | `--color-hsr-element-ice` (#47c7fd)       |
| `.element-quantum`   | Quantum   | `--color-hsr-element-quantum` (#7864aa)   |
| `.element-wind`      | Wind      | `--color-hsr-element-wind` (#5bc89f)      |
| `.element-physical`  | Physical  | `--color-hsr-element-physical` (#bcbcbc)  |
| `.element-thunder`   | Thunder   | same as lightning                         |

```html
<span class="element-badge element-fire">Fire</span>
<span class="element-badge element-ice">Ice</span>
```

**Tokens used:** `--typography-font-size-xs`, `--border-radius-sm`, `--color-hsr-element-*`

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

### AddEntityModal (shared by both games)

`src/components/AddEntityModal.css`

Search + scrollable list pattern used by AddCharacterModal (HSR) and AddArcanistModal (R1999).

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
      <span class="element-badge element-fire">Fire</span>
      <button class="add-btn">+</button>
    </li>
  </ul>
</div>
```

**Tokens used:** `--color-bg-surface`, `--color-ui-border`, `--color-brand-primary`, `--spacing-md`, `--border-radius-md`

---

### PartyEditorModal (shared by both games)

`src/components/PartyEditorModal.css`

Party/lineup creation and editing. Used by both HSR and R1999 party editors with game-specific entity names.

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

Roster card for a Honkai: Star Rail character. Two modes: static summary and edit mode (toggled by ✎ button).

**Header section:**

| Class             | Description                                        |
| ----------------- | -------------------------------------------------- |
| `.character-card` | Card root — surface bg, border, hover glow         |
| `.card-header`    | 250px image section, character art                 |
| `.card-overlay`   | Gradient over header image                         |
| `.favorite-btn`   | ★/☆ top-left                                       |
| `.remove-btn`     | ✕ remove top-right                                 |
| `.element-badge`  | Element type pill (bottom of header)               |
| `.path-badge`     | Path type pill (bottom of header)                  |
| `.score-badge`    | Build score badge (tier-s / tier-a / tier-b class) |

**Body section (static):**

- `.character-name` — large name
- `.level-display` — "Lv. 80" chip
- `.traces-row` — Traces completed indicator

**Body section (edit mode):**

| Class                  | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `.progress-section`    | Collapsible section (Level, Eidolons, Traces)                         |
| `.level-slider`        | Range input with gradient fill via CSS variable `--slider-fill-color` |
| `.eidolon-btn`         | E0–E6 toggle buttons                                                  |
| `.relics-grid`         | 2×3 relic slot grid                                                   |
| `.relic-slot`          | Individual relic slot, ⬡ (cavern) or ○ (planar) symbol                |
| `.relic-slot.equipped` | Filled slot — shows relic set icon                                    |
| `.pref-display`        | Build preference section (main stats + substats)                      |
| `.pref-stat-badge`     | Stat name chip with operator (>, >=, OR)                              |
| `.pref-operator-badge` | Operator connector between stats                                      |

```html
<div class="character-card">
  <div class="card-header">
    <div class="card-overlay"></div>
    <img class="character-image" src="..." alt="" />
    <button class="favorite-btn">★</button>
    <button class="remove-btn">✕</button>
    <div class="card-badges">
      <span class="element-badge element-ice">Ice</span>
      <span class="path-badge path-hunt">The Hunt</span>
      <span class="score-badge tier-s">S</span>
    </div>
  </div>
  <div class="card-body">
    <h3 class="character-name">Seele</h3>
    <!-- edit mode -->
    <div class="relics-grid">
      <div class="relic-slot cavern equipped">
        <img class="relic-icon" src="..." alt="" />
      </div>
      <div class="relic-slot planar">⬡</div>
    </div>
  </div>
</div>
```

**Tokens used:** `--color-hsr-path-*`, `--color-hsr-element-*`, `--shadow-card-hover`, `--shadow-glow-sm`, `--border-radius-lg`, `--typography-font-size-2xl`, `--color-ui-danger`

---

### ArcanistCard (Reverse: 1999)

`src/pages/reverse1999/components/ArcanistCard.tsx` | `ArcanistCard.css`

Roster card for a Reverse: 1999 Arcanist. Richer edit mode with portrait levels, resonance, euphoria, psychube, and amplification.

**Header section:** Identical pattern to CharacterCard — image, overlay, favorite, remove, afflatus badge, damage badge.

**Static summary (collapsed):**

- `.game-card-static-summary` — row of colored progress chips showing Portrait/Resonance/Euphoria/Amplify levels (canonical collapse class; see Card Patterns)
- Each chip has dynamic `color`, `borderColor`, `boxShadow` via inline styles (interpolated from a `lerpColor` utility)

**Edit section (expanded):**

| Class                  | Description                            |
| ---------------------- | -------------------------------------- |
| `.game-card-edit-body` | Edit mode container (canonical)        |
| `.portrait-btn`        | P0–P5 portrait level buttons           |
| `.portrait-btn.active` | Selected portrait — gold border + glow |
| `.resonance-slider`    | Range input for resonance level (1–10) |
| `.euphoria-btn`        | E0–E4 euphoria buttons                 |
| `.psychube-selector`   | Dropdown for equipping psychube        |
| `.amplify-btn`         | A1–A5 amplification buttons            |

```html
<div class="arcanist-card">
  <div class="card-header">
    <div class="card-overlay"></div>
    <img class="arcanist-mugshot" src="..." alt="" />
    <button class="favorite-btn">☆</button>
    <button class="remove-btn">✕</button>
    <div class="card-badges">
      <span class="afflatus-badge afflatus-star">Star</span>
      <span class="damage-badge damage-reality">Reality</span>
    </div>
    <button class="edit-toggle-btn">✎</button>
  </div>
  <div class="card-body">
    <h3 class="arcanist-name">Vertin</h3>
    <!-- static summary -->
    <div class="game-card-static-summary">
      <span class="progress-chip" style="color: ...; border-color: ...;">P2</span>
    </div>
    <!-- edit mode -->
    <div class="game-card-edit-body">
      <div class="portrait-btn-row">
        <button class="portrait-btn active">P0</button>
        <button class="portrait-btn">P1</button>
      </div>
      <input type="range" class="resonance-slider" min="1" max="10" />
    </div>
  </div>
</div>
```

**Afflatus badge colors:** `--color-r1999-afflatus-plant/star/beast/mineral/intellect/spirit`
**Damage badge colors:** `--color-r1999-damage-mental/reality`
**Tokens used:** `--shadow-card-hover`, `--shadow-glow-sm`, `--border-radius-lg`, `--typography-font-size-2xl`, `--color-ui-danger`

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
