import type { Meta, StoryObj } from '@storybook/react-vite';
import { COLOR_STOPS, getProgressStyle } from '@/utils/progressGradient';

/**
 * The cross-game **investment-color language**. A single normalized progress
 * value (0 → 1) is mapped to a continuous rust → amber → gold → teal gradient by
 * `getProgressStyle(value, min, max)` in `src/utils/progressGradient.ts`. Every
 * game uses it to color a card's collapsed-summary stat chips and the fill/glow of
 * its level slider, so "how invested is this unit" reads the same color everywhere:
 * dull rust = untouched, teal = complete.
 */
const meta = {
  title: 'Design System/Investment Color',
} satisfies Meta;

export default meta;
type Story = StoryObj;

const rampCss = `linear-gradient(to right, ${COLOR_STOPS.map(
  (s) => `rgb(${s.r}, ${s.g}, ${s.b}) ${Math.round(s.pct * 100)}%`,
).join(', ')})`;

export const GradientRamp: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <div
        style={{
          height: 40,
          borderRadius: 'var(--border-radius-md)',
          background: rampCss,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'var(--spacing-2)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        {COLOR_STOPS.map((s) => (
          <span key={s.pct}>{Math.round(s.pct * 100)}%</span>
        ))}
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
        Rust (uninvested) → amber (kindling) → gold (forged) → teal (complete).
      </p>
    </div>
  ),
};

/**
 * Stat chips colored by `getProgressStyle`. Each game renders these via the shared
 * `StatChip` component inside `.game-card-static-stats`; only `color` and
 * `borderColor` are applied inline, the chip shape stays canonical.
 */
export const InvestmentChips: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {[0, 30, 60, 80, 90].map((lv) => {
        const ps = getProgressStyle(lv, 1, 90);
        return (
          <span
            key={lv}
            className="stat-chip"
            style={{ color: ps.color, borderColor: ps.borderColor }}
          >
            Lv {lv}
          </span>
        );
      })}
    </div>
  ),
};

/**
 * Level sliders whose track fill, thumb fill, and glow all derive from the same
 * gradient via `--slider-fill-color` / `--slider-fill-glow`, so the slider color
 * matches the summary chip for the same value.
 */
export const InvestmentSliders: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: 300 }}>
      {[10, 45, 90].map((lv) => {
        const ps = getProgressStyle(lv, 1, 90);
        const pct = ((lv - 1) / (90 - 1)) * 100;
        return (
          <input
            key={lv}
            type="range"
            className="level-slider"
            defaultValue={lv}
            min={1}
            max={90}
            style={
              {
                '--slider-fill-color': ps.color,
                '--slider-fill-glow': ps.glowColor,
                background: `linear-gradient(to right, ${ps.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  ),
};
