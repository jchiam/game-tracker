import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildComments } from './BuildComments';
import '@/styles/tokens.css';
import './Modal.css';

const meta = {
  title: 'Components/BuildComments',
  component: BuildComments,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, padding: 24, background: '#0a0a0f' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    value: '',
    onChange: () => {},
  },
} satisfies Meta<typeof BuildComments>;

export default meta;
type Story = StoryObj<typeof meta>;

function FilledComments() {
  const [value, setValue] = useState('Aim for 70%+ CRIT DMG; speed-tune to 134.');
  return (
    <BuildComments
      value={value}
      placeholder="Additional notes about this build…"
      onChange={setValue}
    />
  );
}

function EmptyComments() {
  const [value, setValue] = useState('');
  return <BuildComments value={value} placeholder="Additional notes…" onChange={setValue} />;
}

export const Default: Story = {
  render: () => <FilledComments />,
};

export const Empty: Story = {
  render: () => <EmptyComments />,
};
