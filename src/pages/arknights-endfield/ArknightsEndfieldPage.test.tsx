import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ArknightsEndfieldPage } from './ArknightsEndfieldPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { AeTrackedOperator, AeParty } from '@/types';

vi.mock('@/hooks/arknights-endfield/useOperators', () => ({
  useOperators: vi.fn(),
}));

vi.mock('@/hooks/arknights-endfield/useParties', () => ({
  useParties: vi.fn(),
}));

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

import { useOperators } from '@/hooks/arknights-endfield/useOperators';
import { useParties } from '@/hooks/arknights-endfield/useParties';

function makeOperator(id: string, name: string): AeTrackedOperator {
  return {
    id,
    name,
    rarity: 6,
    class: 'Defender',
    element: 'Heat',
    weapon: 'Greatsword',
    imageUrl: `/assets/arknights-endfield/operators/${id}.webp`,
    dbId: `db-${id}`,
    isFavorited: false,
    level: 45,
    phase: 3,
    skillsMaxed: false,
    weaponName: null,
    weaponLevel: 1,
  };
}

function makeParty(id: string, name: string): AeParty {
  return {
    id,
    profileId: 'user-1',
    name,
    notes: null,
    members: [],
    createdAt: '2026-01-01T00:00:00Z',
  };
}

const defaultOperatorsHook = {
  availableOperators: [],
  trackedOperators: [] as AeTrackedOperator[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addOperator: vi.fn(),
  removeOperator: vi.fn(),
  updateLevel: vi.fn(),
  updatePhase: vi.fn(),
  updateSkillsMaxed: vi.fn(),
  updateWeapon: vi.fn(),
  toggleFavorite: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

const defaultPartiesHook = {
  parties: [] as AeParty[],
  isLoading: false,
  saveParty: vi.fn().mockResolvedValue(null),
  deleteParty: vi.fn().mockResolvedValue(true),
  refreshParties: vi.fn(),
};

describe('ArknightsEndfieldPage', () => {
  beforeEach(() => {
    vi.mocked(useOperators).mockReturnValue(defaultOperatorsHook);
    vi.mocked(useParties).mockReturnValue(defaultPartiesHook);
  });

  it('shows "Authenticating..." while auth is loading', () => {
    renderWithProviders(
      <ArknightsEndfieldPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(
      <ArknightsEndfieldPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows "Loading database sync..." during initial load with session', () => {
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      isInitialLoad: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/loading database sync/i)).toBeInTheDocument();
  });

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('disables the add operator button when isLoadError is true', () => {
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByTitle('Add Operator')).toBeDisabled();
  });

  it('calls retryLoad when Retry button is clicked', () => {
    const retryLoad = vi.fn();
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      isLoadError: true,
      retryLoad,
    });
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no operators are tracked', () => {
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no operators tracked yet/i)).toBeInTheDocument();
  });

  it('renders operator cards when operators are tracked', () => {
    const session = createMockSession();
    const ops = [makeOperator('ember', 'Ember'), makeOperator('chen', 'Chen')];
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      trackedOperators: ops,
      getFilteredRoster: vi.fn().mockReturnValue(ops),
    });
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText('Ember')).toBeInTheDocument();
    expect(screen.getByText('Chen')).toBeInTheDocument();
  });

  it('shows "no operators match" when search filters all out', () => {
    const session = createMockSession();
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      trackedOperators: [makeOperator('ember', 'Ember')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no operators match your search/i)).toBeInTheDocument();
  });

  it('shows the add operator button when session exists', () => {
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByTitle('Add Operator')).toBeInTheDocument();
  });

  it('opens AddOperatorModal when add button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Add Operator'));
    expect(screen.getByRole('heading', { name: /add operator/i })).toBeInTheDocument();
  });

  it('switches to Squads tab when Squads button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /squads/i }));
    expect(screen.getByText(/no squads configured/i)).toBeInTheDocument();
  });

  it('shows parties in the Squads tab when they exist', () => {
    const session = createMockSession();
    vi.mocked(useParties).mockReturnValue({
      ...defaultPartiesHook,
      parties: [makeParty('p1', 'Alpha Squad'), makeParty('p2', 'Beta Squad')],
    });
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /squads/i }));
    expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
    expect(screen.getByText('Beta Squad')).toBeInTheDocument();
  });

  it('shows SavingToast when pendingSaveCount > 0', () => {
    const session = createMockSession();
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      pendingSaveCount: 2,
    });
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    renderWithProviders(
      <ArknightsEndfieldPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: /arknights: endfield/i })).toBeInTheDocument();
  });

  it('does not show search or sort controls when no operators are tracked', () => {
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(
      screen.queryByPlaceholderText(/search by name, class, element/i),
    ).not.toBeInTheDocument();
  });

  it('shows search and sort controls when operators are tracked', () => {
    const session = createMockSession();
    const ops = [makeOperator('ember', 'Ember')];
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      trackedOperators: ops,
      getFilteredRoster: vi.fn().mockReturnValue(ops),
    });
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText(/search by name, class, element/i)).toBeInTheDocument();
  });

  it('sort button toggles between AZ and Lv', () => {
    const session = createMockSession();
    const ops = [makeOperator('ember', 'Ember')];
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      trackedOperators: ops,
      getFilteredRoster: vi.fn().mockReturnValue(ops),
    });
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    const sortBtn = screen.getByTitle(/sorted alphabetically/i);
    expect(sortBtn).toHaveTextContent('AZ');
    fireEvent.click(sortBtn);
    expect(screen.getByTitle(/sorted by level/i)).toHaveTextContent('Lv');
  });

  it('Roster tab button has active class by default', () => {
    renderWithProviders(
      <ArknightsEndfieldPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /roster/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /squads/i })).not.toHaveClass('active');
  });

  it('Squads tab button gets active class when clicked', () => {
    const session = createMockSession();
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /squads/i }));
    expect(screen.getByRole('button', { name: /squads/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /roster/i })).not.toHaveClass('active');
  });

  it('switches back to roster after visiting the Squads tab', () => {
    const session = createMockSession();
    const ops = [makeOperator('ember', 'Ember')];
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      trackedOperators: ops,
      getFilteredRoster: vi.fn().mockReturnValue(ops),
    });
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /squads/i }));
    fireEvent.click(screen.getByRole('button', { name: /roster/i }));
    expect(screen.getByText('Ember')).toBeInTheDocument();
  });

  it('closes AddOperatorModal after an operator is added', async () => {
    const session = createMockSession();
    vi.mocked(useOperators).mockReturnValue({
      ...defaultOperatorsHook,
      availableOperators: [
        {
          id: 'ember',
          name: 'Ember',
          rarity: 6,
          class: 'Defender',
          element: 'Heat',
          weapon: 'Greatsword',
          imageUrl: '/ember.webp',
        },
      ],
      addOperator: vi.fn(),
    });
    renderWithProviders(
      <ArknightsEndfieldPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Add Operator'));
    expect(screen.getByRole('heading', { name: /add operator/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ember'));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add operator/i })).not.toBeInTheDocument();
    });
  });
});
