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

export const ToggleButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', maxWidth: 400 }}>
      <button className="toggle-btn active">Portrait</button>
      <button className="toggle-btn">Euphoria</button>
      <button className="toggle-btn">Awakening</button>
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
