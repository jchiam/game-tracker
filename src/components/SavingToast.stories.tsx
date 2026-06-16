import type { Meta, StoryObj } from '@storybook/react-vite';
import { SavingToast } from './SavingToast';

const meta = {
  title: 'Components/SavingToast',
  component: SavingToast,
  tags: ['autodocs'],
} satisfies Meta<typeof SavingToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = {
  args: {
    visible: true,
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
  },
};
