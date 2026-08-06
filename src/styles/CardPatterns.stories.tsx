import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Design System/Card Patterns',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const CardStructure: Story = {
  render: () => (
    <div className="game-card" style={{ maxWidth: 320 }}>
      <div className="game-card-header">
        <div className="game-card-overlay"></div>
        <div className="game-card-controls">
          <div className="game-card-controls-top">
            <button className="favorite-btn">&#9734;</button>
            <button className="remove-btn">&#10005;</button>
          </div>
          <div className="game-card-controls-bottom">
            <div className="game-card-badges">
              <span className="stat-chip">Badge 1</span>
              <span className="stat-chip">Badge 2</span>
            </div>
          </div>
        </div>
      </div>
      <div className="game-card-body">
        <h3 className="game-card-name">Character Name</h3>
      </div>
    </div>
  ),
};

/**
 * The anodized temper edge — a card's equipment-match score worn as a 3px crown,
 * coloured by the score's position on the investment ramp. GameCardShell sets the
 * inline `--temper` (via the shared progress gradient) and the `has-temper-edge`
 * class from its `temperScore` prop; cards without a score render no edge. Hovering
 * an edged card intensifies the glow.
 */
export const AnodizedEdge: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
      {/* --temper values are getProgressStyle(score, 0, 100).color at 12 / 58 / 92 */}
      {[
        ['12% — rust', 'rgb(161, 108, 74)'],
        ['58% — amber→gold', 'rgb(209, 163, 57)'],
        ['92% — toward verdigris', 'rgb(100, 194, 135)'],
      ].map(([label, temper]) => (
        <div
          key={label}
          className="game-card has-temper-edge"
          style={{ maxWidth: 200, flex: 1, '--temper': temper } as React.CSSProperties}
        >
          <div className="game-card-body">
            <h3 className="game-card-name">{label}</h3>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Buttons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <button className="favorite-btn">&#9734;</button>
      <button className="favorite-btn active">&#9733;</button>
      <button className="remove-btn">&#10005;</button>
      <button className="edit-toggle-btn">&#9998;</button>
      <button className="edit-toggle-btn active">&#9998;</button>
    </div>
  ),
};

/**
 * Canonical collapse mechanism. Toggling `.is-editing` on `.game-card-body`
 * swaps the read-only `.game-card-static-summary` for the `.game-card-edit-body`.
 * Each game tunes only the two height budgets via custom properties on
 * `.game-card`: `--game-card-summary-max-height` and `--game-card-edit-max-height`.
 */
function CollapseDemo() {
  const [editing, setEditing] = useState(false);
  return (
    <div
      className="game-card"
      style={
        {
          maxWidth: 320,
          '--game-card-summary-max-height': '80px',
          '--game-card-edit-max-height': '700px',
        } as React.CSSProperties
      }
    >
      <div className={`game-card-body ${editing ? 'is-editing' : ''}`}>
        <h3 className="game-card-name">Character Name</h3>

        <div className="game-card-static-summary">
          <div className="game-card-static-summary-inner">
            <div className="game-card-static-stats">
              <span className="stat-chip">Lv 80</span>
              <span className="stat-chip">P5</span>
            </div>
            <div className="game-card-static-line">Equipped Item · Lv 60 · A5</div>
          </div>
        </div>

        <div className="game-card-edit-body" aria-hidden={!editing}>
          <div className="game-card-edit-body-inner">
            <div className="progress-section">
              <div className="section-header">
                <span>Level</span>
                <span className="section-value">80 / 80</span>
              </div>
              <input type="range" className="level-slider" defaultValue={80} min={1} max={80} />
            </div>
          </div>
        </div>

        <button
          className={`edit-toggle-btn ${editing ? 'active' : ''}`}
          onClick={() => setEditing((v) => !v)}
          style={{ alignSelf: 'flex-start', marginTop: 'var(--spacing-sm)' }}
        >
          &#9998;
        </button>
      </div>
    </div>
  );
}

export const CollapseMechanism: Story = {
  render: () => <CollapseDemo />,
};

/**
 * Opt-in fixed-height summary reserve. Adding `.reserve-summary-rows` to
 * `.game-card` (via GameCardShell's `reserveSummaryRows` prop) makes the summary
 * chip row reserve two chip lines, so a one-line card matches a two-line card's
 * collapsed height. Off by default — only games that opt in are affected. Both
 * cards below carry the reserve; the left has one chip line, the right two, yet
 * the chip rows occupy the same height. (Used by P5X, whose variable-width
 * Revelations chip is width-capped so the worst case stays two lines.)
 */
export const SummaryReserve: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
      {[
        ['Lv 80', 'A6'],
        ['Lv 80', 'A6', '⚔ 5★ F6', 'MS ✓', 'Strife 4pc + Meditation', 'Skills ✓'],
      ].map((chips, i) => (
        <div key={i} className="game-card reserve-summary-rows" style={{ maxWidth: 200, flex: 1 }}>
          <div className="game-card-body">
            <div className="game-card-static-summary" style={{ maxHeight: 'none' }}>
              <div className="game-card-static-summary-inner">
                <div className="game-card-static-stats">
                  {chips.map((c) => (
                    <span key={c} className="stat-chip">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="game-card-static-line">Bound Persona</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

/**
 * Canonical party/lineup card from src/styles/party.css — shared by all games'
 * Lineups view. Tier banner and favorite toggle are optional per game.
 * The favorite toggle uses `.party-favorite-btn` (not the roster card's
 * `.favorite-btn`) so the two rule sets can never clobber each other.
 */
export const PartyCard: Story = {
  render: () => (
    <div className="party-card" style={{ maxWidth: 380 }}>
      <div className="party-tier-banner tier-banner-S">S</div>
      <div className="party-card-header">
        <h3 className="party-name">Party Name</h3>
        <div className="party-actions">
          <button className="icon-btn party-favorite-btn active" title="Favourite">
            &#9733;
          </button>
          <button className="icon-btn edit-btn" title="Edit">
            &#9998;
          </button>
          <button className="icon-btn delete-btn" title="Delete">
            &#10005;
          </button>
        </div>
      </div>
      <p className="party-notes">Optional notes about the lineup, clamped to two lines.</p>
      <div className="party-members-row">
        {[0, 1, 2, 3].map((slot) => (
          <div key={slot} className="slot-item">
            <div className="slot-avatar empty">
              <span className="empty-plus">+</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const EquipmentSlotGrid: Story = {
  render: () => (
    <div style={{ maxWidth: 300, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 6-slot grid (HSR relics) — default column count */}
      <div className="equip-slot-grid">
        <div className="equip-slot-cell active">
          <span className="equip-slot-icon">⬡</span>
        </div>
        <div className="equip-slot-cell active">
          <span className="equip-slot-icon">⬡</span>
        </div>
        <div className="equip-slot-cell">
          <span className="equip-slot-icon">⬡</span>
        </div>
        <div className="equip-slot-cell">
          <span className="equip-slot-icon">⬡</span>
        </div>
        <div className="equip-slot-cell active">
          <span className="equip-slot-icon">○</span>
        </div>
        <div className="equip-slot-cell">
          <span className="equip-slot-icon">○</span>
        </div>
      </div>
      {/* 5-slot grid (P5X revelations) — per-game column override */}
      <div className="equip-slot-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="equip-slot-cell active">
          <span className="equip-slot-icon">☀</span>
        </div>
        <div className="equip-slot-cell">
          <span className="equip-slot-icon">☽</span>
        </div>
        <div className="equip-slot-cell active">
          <span className="equip-slot-icon">★</span>
        </div>
        <div className="equip-slot-cell">
          <span className="equip-slot-icon">☁</span>
        </div>
        <div className="equip-slot-cell active">
          <span className="equip-slot-icon">◈</span>
        </div>
      </div>
    </div>
  ),
};

export const ProgressSections: Story = {
  render: () => (
    <div style={{ maxWidth: 300 }}>
      <div className="progress-section">
        <div className="section-header">
          <span>Level</span>
          <span className="section-value">42 / 80</span>
        </div>
        <input
          type="range"
          className="level-slider"
          defaultValue={42}
          min={1}
          max={80}
          style={{
            background: `linear-gradient(to right, var(--color-brand-primary) ${((42 - 1) / (80 - 1)) * 100}%, rgba(255,255,255,0.1) ${((42 - 1) / (80 - 1)) * 100}%)`,
          }}
        />
      </div>
    </div>
  ),
};

/**
 * Section group — the canonical labeled container that visually encloses several
 * `.progress-section`s under one heading (`.card-section-group` +
 * `.card-section-group-header` in card.css). Visually neutral: it carries no
 * per-game accent, so every game's group reads the same. First consumer: the N2E
 * Console group (Cartridge · Modules · Target Build).
 */
export const SectionGroup: Story = {
  render: () => (
    <div style={{ maxWidth: 300 }}>
      <div className="card-section-group">
        <div className="card-section-group-header">Console</div>
        <div className="progress-section">
          <div className="section-header">
            <span>Cartridge</span>
          </div>
          <div className="section-value">S · Lv 15</div>
        </div>
        <div className="progress-section">
          <div className="section-header">
            <span>Modules</span>
          </div>
          <div className="section-value">Configured ✓</div>
        </div>
      </div>
    </div>
  ),
};
