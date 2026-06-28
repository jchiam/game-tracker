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
      <div style={{ maxWidth: 360, padding: 24, background: '#0a0a0f' }}>
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
