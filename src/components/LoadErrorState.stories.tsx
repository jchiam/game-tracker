import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { LoadErrorState } from './LoadErrorState';

const meta = {
  title: 'Components/LoadErrorState',
  component: LoadErrorState,
  tags: ['autodocs'],
} satisfies Meta<typeof LoadErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onRetry: fn(),
  },
};
