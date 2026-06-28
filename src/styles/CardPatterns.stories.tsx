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
          <div className="game-card-static-stats">
            <span className="stat-chip">Lv 80</span>
            <span className="stat-chip">P5</span>
          </div>
          <div className="game-card-static-line">Equipped Item · Lv 60 · A5</div>
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
