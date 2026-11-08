import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Design System/Control Patterns',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const LevelSlider: Story = {
  render: () => (
    <div style={{ maxWidth: 300 }}>
      <input
        type="range"
        className="level-slider"
        defaultValue={55}
        min={1}
        max={90}
        style={{
          background: `linear-gradient(to right, var(--color-brand-primary) ${((55 - 1) / (90 - 1)) * 100}%, rgba(255,255,255,0.1) ${((55 - 1) / (90 - 1)) * 100}%)`,
        }}
      />
    </div>
  ),
};

export const SpinnerDots: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
      <div className="spinner-dot"></div>
      <div className="spinner-dot"></div>
      <div className="spinner-dot"></div>
    </div>
  ),
};

export const StatChips: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <span className="stat-chip">Lv 60</span>
      <span className="stat-chip">P5</span>
      <span className="stat-chip">R15</span>
      <span className="stat-chip">E4</span>
      <span className="stat-chip">S1</span>
    </div>
  ),
};

export const FilterChips: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Roster predicate-filter block. `.filter-chip` base lives in
          controls.css; hover/active accent comes from the `--filter-chip-accent`
          custom property each page sets on its `.filter-row`. The row is a
          facet matrix: labelled `any` / `one` rows plus unlabelled bare rows. */}
      <div
        className="filter-row"
        style={{ '--filter-chip-accent': 'var(--color-p5x-element-fire)' } as CSSProperties}
      >
        <div className="filter-facet" role="group" aria-label="Weapon">
          <span className="filter-facet-label" aria-hidden="true">
            Weapon
          </span>
          <div className="filter-facet-chips mode-any">
            <button className="filter-chip active" aria-pressed="true">
              Sub-5★
            </button>
            <button className="filter-chip" aria-pressed="false">
              Under Lv 80
            </button>
          </div>
        </div>
        <div className="filter-facet" role="group" aria-label="Mindscape">
          <span className="filter-facet-label" aria-hidden="true">
            Mindscape
          </span>
          <div className="filter-facet-chips mode-one">
            <button className="filter-chip active" aria-pressed="true">
              No Outer
            </button>
            <button className="filter-chip" aria-pressed="false">
              No Inner
            </button>
          </div>
        </div>
      </div>
      {/* Collapsed multi-row block: the Filters toggle with its active count,
          followed by removable facet-labelled summary pills. */}
      <div
        className="filter-block"
        style={{ '--filter-chip-accent': 'var(--color-p5x-element-fire)' } as CSSProperties}
      >
        <div className="filter-header">
          <button className="filter-chip filter-toggle" aria-expanded="false">
            Filters
            <span className="filter-toggle-count">2</span>
            <span className="filter-toggle-chevron" aria-hidden="true">
              ▾
            </span>
          </button>
          <button
            className="filter-chip active filter-summary"
            aria-label="Remove filter Mindscape · No Outer"
          >
            Mindscape · No Outer
            <span className="filter-summary-x" aria-hidden="true">
              ×
            </span>
          </button>
          <button
            className="filter-chip active filter-summary"
            aria-label="Remove filter Weapon · Sub-5★"
          >
            Weapon · Sub-5★
            <span className="filter-summary-x" aria-hidden="true">
              ×
            </span>
          </button>
        </div>
      </div>
      <div
        className="filter-row"
        style={{ '--filter-chip-accent': 'var(--color-r1999-accent)' } as CSSProperties}
      >
        <div className="filter-facet is-unlabelled">
          <div className="filter-facet-chips mode-any">
            <button className="filter-chip" aria-pressed="false">
              💠 Resonating
            </button>
            <button className="filter-chip active" aria-pressed="true">
              💠 Resonating (active)
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ActionButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {/* `.btn` is the opt-in styled base (glass gradient, shimmer, hover
          lift); bare <button> only gets the minimal reset from index.css. */}
      <button className="btn">Default .btn</button>
      <button className="btn primary-action">Primary action</button>
      <button className="btn secondary-action">Secondary action</button>
      <button className="btn secondary-action danger">Danger</button>
    </div>
  ),
};

export const ToggleButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 400 }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="toggle-btn active">Portrait</button>
        <button className="toggle-btn">Euphoria</button>
        <button className="toggle-btn">Awakening</button>
      </div>
      {/* .compact — dense rows (arc tier, amplification) */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="toggle-btn compact active">A1</button>
        <button className="toggle-btn compact">A2</button>
        <button className="toggle-btn compact">A3</button>
        <button className="toggle-btn compact">A4</button>
        <button className="toggle-btn compact">A5</button>
      </div>
    </div>
  ),
};

export const Stepper: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 400 }}>
      {/* .stepper — bounded integer control (copies of a collectible) */}
      <div className="stepper" role="group" aria-label="Sealed">
        <span className="stepper-label">Sealed</span>
        <button className="stepper-btn" aria-label="Decrease Sealed">
          −
        </button>
        <span className="stepper-value">1</span>
        <button className="stepper-btn" aria-label="Increase Sealed">
          +
        </button>
      </div>
      {/* .compact — dense rows; decrement disabled at the lower bound */}
      <div className="stepper compact" role="group" aria-label="Loose">
        <span className="stepper-label">Loose</span>
        <button className="stepper-btn" aria-label="Decrease Loose" disabled>
          −
        </button>
        <span className="stepper-value">0</span>
        <button className="stepper-btn" aria-label="Increase Loose">
          +
        </button>
      </div>
    </div>
  ),
};

export const EquipSlotCard: Story = {
  render: () => (
    <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Per-slot grouping card used by multi-slot equipment editor modals
          (HSR relics, P5X revelations). Gated controls dim via .is-gated. */}
      <div className="equip-slot-card">
        <div className="equip-slot-header">Body</div>
        <div className="form-group">
          <label>Set</label>
          <select className="game-select" defaultValue="">
            <option value="">-- No Set --</option>
            <option value="genius">Genius of Brilliant Stars</option>
          </select>
        </div>
        <div className="form-group is-gated">
          <label>Main Stat</label>
          <select className="game-select" disabled>
            <option>-- No Main Stat --</option>
          </select>
        </div>
      </div>
      <div className="equip-slot-card">
        <div className="equip-slot-header">Head</div>
        <div className="form-group">
          <label>Main Stat</label>
          <span className="readonly-stat">HP (Fixed)</span>
        </div>
      </div>
    </div>
  ),
};

export const GameSelect: Story = {
  render: () => (
    <div style={{ maxWidth: 250 }}>
      <select className="game-select" defaultValue="resonance">
        <option value="resonance">Resonance</option>
        <option value="insight">Insight</option>
        <option value="amplification">Amplification</option>
      </select>
    </div>
  ),
};
