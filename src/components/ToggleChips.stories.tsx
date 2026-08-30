import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ToggleChips, type ToggleChipOption } from './ToggleChips';
import '@/styles/tokens.css';
import '@/styles/controls.css';

const skills: ToggleChipOption[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'dodge', label: 'Dodge' },
  { value: 'assist', label: 'Assist' },
  { value: 'special', label: 'Special' },
  { value: 'chain', label: 'Chain' },
];

const meta = {
  title: 'Components/ToggleChips',
  component: ToggleChips,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, padding: 24, background: '#0e1014' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    options: skills,
    values: ['basic', 'dodge'],
    onToggle: fn(),
  },
} satisfies Meta<typeof ToggleChips>;

export default meta;
type Story = StoryObj<typeof meta>;

function LiveRow({ initial, size }: { initial: string[]; size?: 'md' | 'compact' }) {
  const [values, setValues] = useState<string[]>(initial);
  return (
    <ToggleChips
      options={skills}
      values={values}
      size={size}
      onToggle={(v) =>
        setValues((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
      }
    />
  );
}

/**
 * Independently-toggleable flags — unlike `SegmentedButtons`, any subset may be
 * on at once. Click freely: toggling one chip never disturbs another.
 */
export const Partial: Story = {
  render: () => <LiveRow initial={['basic', 'dodge']} />,
};

/** Nothing on — a valid resting state, not an error. */
export const Empty: Story = {
  render: () => <LiveRow initial={[]} />,
};

/** Everything on — the other end of the same valid range. */
export const AllOn: Story = {
  render: () => <LiveRow initial={skills.map((s) => s.value)} />,
};

/** Compact size for dense rows. */
export const Compact: Story = {
  render: () => <LiveRow initial={['chain']} size="compact" />,
};
