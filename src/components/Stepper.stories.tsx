import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Stepper } from './Stepper';
import '@/styles/tokens.css';
import '@/styles/controls.css';

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, padding: 24, background: '#0e1014' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Sealed',
    value: 1,
    onChange: fn(),
  },
  argTypes: {
    size: { control: 'radio', options: ['md', 'compact'] },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

function Live({ initial, max, size }: { initial: number; max?: number; size?: 'md' | 'compact' }) {
  const [value, setValue] = useState(initial);
  return <Stepper label="Sealed" value={value} max={max} size={size} onChange={setValue} />;
}

/** A bounded integer counter — click freely; the decrement stops at 0. */
export const Default: Story = {
  render: () => <Live initial={1} />,
};

/** At the lower bound: the decrement is disabled. */
export const AtMin: Story = {
  args: { value: 0 },
};

/** At an upper bound (`max 3`): the increment is disabled. */
export const AtMax: Story = {
  args: { value: 3, max: 3 },
};

/** Compact size for dense rows (one stepper per condition in a variant row). */
export const Compact: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Live initial={1} size="compact" />
      <Stepper label="Boxed" value={0} size="compact" onChange={fn()} />
      <Stepper label="Loose" value={2} size="compact" onChange={fn()} />
    </div>
  ),
};

/** Disabled: both buttons off regardless of bounds. */
export const Disabled: Story = {
  args: { value: 2, disabled: true },
};
