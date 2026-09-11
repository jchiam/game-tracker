import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingState } from './LoadingState';

const meta = {
  title: 'Components/LoadingState',
  component: LoadingState,
  tags: ['autodocs'],
  args: {
    label: 'Loading your roster…',
  },
  argTypes: {
    label: { control: 'text' },
  },
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default roster-load phrasing used by the roster render ladder. */
export const RosterLoad: Story = {};

/** Auth-check phrasing shared by the roster ladder and the selection page. */
export const AuthCheck: Story = { args: { label: 'Checking sign-in…' } };

/** Generic route-chunk fallback used by the app-level Suspense boundary. */
export const RouteFallback: Story = { args: { label: 'Loading…' } };

/** Parties-tab phrasing is built from the game's party noun. */
export const PartiesLoad: Story = { args: { label: 'Loading your lineups…' } };
