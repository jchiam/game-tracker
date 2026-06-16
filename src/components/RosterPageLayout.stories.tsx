import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RosterPageLayout } from './RosterPageLayout';
import type { Session } from '@supabase/supabase-js';

const meta = {
  title: 'Components/RosterPageLayout',
  component: RosterPageLayout,
  tags: ['autodocs'],
} satisfies Meta<typeof RosterPageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSession = {
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: {
    id: 'mock-user-id',
    email: 'trailblazer@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
} as unknown as Session;

const baseArgs = {
  title: 'Honkai Star Rail',
  subtitle: 'Roster and party configuration tracker.',
  secondViewLabel: 'Lineups',
  view: 'roster' as const,
  onViewChange: fn(),
  session: mockSession,
  isAuthLoading: false,
  isInitialLoad: false,
  isLoadError: false,
  onRetry: fn(),
  onSignIn: fn(),
  hasTracked: true,
  hasMatches: true,
  emptyMessage: "Your roster is empty. Click '+' to start tracking characters.",
  noMatchMessage: 'No characters match your current filters.',
  search: {
    value: '',
    placeholder: 'Search characters by name, type, path...',
    onChange: fn(),
  },
  sort: {
    active: false,
    label: 'Level',
    title: 'Toggle level sort direction',
    onToggle: fn(),
  },
  add: {
    title: 'Add Character',
    onClick: fn(),
    disabled: false,
  },
  cards: (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
        width: '100%',
      }}
    >
      <div
        className="game-card"
        style={{
          height: '180px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--color-ui-border)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
            Kafka
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-primary)' }}>
            5★ Nihility • Lightning
          </span>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Lv 80 / E0</div>
      </div>
      <div
        className="game-card"
        style={{
          height: '180px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--color-ui-border)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
            Acheron
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-primary)' }}>
            5★ Nihility • Lightning
          </span>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Lv 80 / E2</div>
      </div>
    </div>
  ),
  partiesTab: (
    <div
      style={{
        padding: '32px',
        background: 'rgba(25, 25, 35, 0.5)',
        border: '1px dashed var(--color-ui-border)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      <h3>No Saved Lineups</h3>
      <p>Configure team compositions in the Lineups tab.</p>
    </div>
  ),
  pendingSaveCount: 0,
};

export const Unauthenticated: Story = {
  args: {
    ...baseArgs,
    session: null,
  },
};

export const Authenticating: Story = {
  args: {
    ...baseArgs,
    session: null,
    isAuthLoading: true,
  },
};

export const InitialLoad: Story = {
  args: {
    ...baseArgs,
    isInitialLoad: true,
  },
};

export const LoadError: Story = {
  args: {
    ...baseArgs,
    isLoadError: true,
  },
};

export const EmptyRoster: Story = {
  args: {
    ...baseArgs,
    hasTracked: false,
  },
};

export const NoMatches: Story = {
  args: {
    ...baseArgs,
    hasMatches: false,
    search: {
      ...baseArgs.search,
      value: 'NonExistentCharacter',
    },
  },
};

export const RosterActive: Story = {
  args: {
    ...baseArgs,
  },
};

export const LineupsTabActive: Story = {
  args: {
    ...baseArgs,
    view: 'second',
  },
};

export const SavingInProgress: Story = {
  args: {
    ...baseArgs,
    pendingSaveCount: 1,
  },
};
