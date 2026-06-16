import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ConfirmCheckbox } from './ConfirmCheckbox';

const meta = {
  title: 'Components/ConfirmCheckbox',
  component: ConfirmCheckbox,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfirmCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    checked: false,
    onChange: fn(),
    label: 'All Traces Attained',
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    onChange: fn(),
    label: 'All Traces Attained',
  },
};
