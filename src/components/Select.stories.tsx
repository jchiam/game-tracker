import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Select } from './Select';
import '@/styles/tokens.css';
import '@/styles/controls.css';

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320, padding: 24, background: '#0a0a0f' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    name: 'demo',
    value: 'ATK%',
    options: ['HP%', 'ATK%', 'DEF%', 'CRIT Rate', 'CRIT DMG'],
    onChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm' },
};

export const WithPlaceholder: Story = {
  args: { value: '', placeholder: '-- No Main Stat --' },
};

export const ValueLabelOptions: Story = {
  args: {
    value: 'w1',
    options: [
      { value: 'w1', label: 'Blade of the Watcher (5★)' },
      { value: 'w2', label: 'Standard Spear (4★)' },
    ],
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
