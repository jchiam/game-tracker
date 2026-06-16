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
      <div className="game-card-body" style={{ padding: 'var(--spacing-md)' }}>
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
