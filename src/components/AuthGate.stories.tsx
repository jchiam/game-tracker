import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { AuthGate } from './AuthGate';

const meta = {
  title: 'Components/AuthGate',
  component: AuthGate,
  tags: ['autodocs'],
} satisfies Meta<typeof AuthGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSignIn: fn(),
  },
};
