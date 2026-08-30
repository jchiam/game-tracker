import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedButtons, type SegmentedOption } from './SegmentedButtons';
import '@/styles/tokens.css';
import '@/styles/controls.css';

const rarity: SegmentedOption[] = [
  { value: 'B', label: 'B' },
  { value: 'A', label: 'A' },
  { value: 'S', label: 'S' },
];

const phase: SegmentedOption[] = [0, 1, 2, 3, 4, 5].map((p) => ({
  value: String(p),
  label: `P${p}`,
}));

const meta = {
  title: 'Components/SegmentedButtons',
  component: SegmentedButtons,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, padding: 24, background: '#0e1014' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    options: rarity,
    value: 'A',
    onChange: () => {},
  },
} satisfies Meta<typeof SegmentedButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

function StaticRow() {
  const [value, setValue] = useState<string | null>('A');
  return <SegmentedButtons options={rarity} value={value} onChange={setValue} />;
}

function DeselectableRow() {
  const [value, setValue] = useState<string | null>('S');
  return <SegmentedButtons options={rarity} value={value} allowDeselect onChange={setValue} />;
}

function InvestmentRow() {
  const [value, setValue] = useState<string | null>('2');
  return (
    <SegmentedButtons options={phase} value={value} coloring="investment" onChange={setValue} />
  );
}

/** Categorical selection coloured by a per-option modifier class (rarity). */
export const Static: Story = {
  render: () => <StaticRow />,
};

/** Selection that can be cleared by re-clicking the active option (party tier). */
export const Deselectable: Story = {
  render: () => <DeselectableRow />,
};

/**
 * Single-exact selection coloured by the shared investment gradient — the only
 * active rung takes its gradient colour, nothing below it (AE phase, R1999
 * portrait / euphoria / amplification, N2E arc-tier).
 */
export const Investment: Story = {
  render: () => <InvestmentRow />,
};

const coreSkill: SegmentedOption[] = ['A', 'B', 'C', 'D', 'E', 'F'].map((letter, i) => ({
  value: String(i + 1),
  label: letter,
}));

function CumulativeRow({ fill }: { fill: 'exact' | 'cumulative' }) {
  const [value, setValue] = useState<string | null>('3');
  return (
    <SegmentedButtons
      options={coreSkill}
      value={value}
      fill={fill}
      coloring="investment"
      allowDeselect
      onChange={setValue}
    />
  );
}

/**
 * A prerequisite ladder (ZZZ Core Skill A→F): every rung up to the selected one
 * renders attained, each on its own point of the gradient, so the row reads as a
 * ramp rather than one lit pill.
 *
 * Hover to see the range preview — the states are only reachable by pointing:
 * - **attained** — owned rungs, full gradient strength
 * - **add** — hover a rung *above* the selection: dashed, preview-strength hue,
 *   the rungs the click would buy
 * - **drop** — hover a rung *below* it (or the selected rung itself, since
 *   `allowDeselect` clears the run): neutral, no hue, what the click gives up
 * - **empty** — resting, unattained
 *
 * Keyboard-tab the row to see the identical preview on focus.
 */
export const Cumulative: Story = {
  render: () => <CumulativeRow fill="cumulative" />,
};

/** The same options under the default `fill="exact"`, for side-by-side comparison. */
export const CumulativeVsExact: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ color: '#b3ad9e', fontSize: 12, marginBottom: 8 }}>fill="cumulative"</div>
        <CumulativeRow fill="cumulative" />
      </div>
      <div>
        <div style={{ color: '#b3ad9e', fontSize: 12, marginBottom: 8 }}>
          fill="exact" (default)
        </div>
        <CumulativeRow fill="exact" />
      </div>
    </div>
  ),
};
