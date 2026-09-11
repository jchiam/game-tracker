import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ErrorState } from './ErrorState';

const meta = {
  title: 'Components/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  args: {
    message: "Couldn't load your roster.",
    onRetry: fn(),
  },
  argTypes: {
    message: { control: 'text' },
    retryLabel: { control: 'text' },
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Roster render ladder phrasing with the default Retry action. */
export const WithRetry: Story = {};

/** Message only — no recovery action offered. */
export const NoRetry: Story = { args: { onRetry: undefined } };

/** Route-level error boundary phrasing with a Reload action. */
export const ReloadLabel: Story = {
  args: { message: 'Something went wrong loading this page.', retryLabel: 'Reload' },
};

/** Parties-tab phrasing is built from the game's party noun. */
export const PartiesLoad: Story = { args: { message: "Couldn't load your lineups." } };
