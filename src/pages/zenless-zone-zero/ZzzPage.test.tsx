import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ZzzPage } from './ZzzPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { ZzzTrackedAgent, Party } from '@/types';

vi.mock('@/hooks/zenless-zone-zero/useAgents', () => ({
  useAgents: vi.fn(),
}));

vi.mock('@/hooks/zenless-zone-zero/useParties', () => ({
  useParties: vi.fn(),
}));

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
  getZzzAgentMugshotUrl: (path: string) => path,
  getZzzAgentAvatarUrl: (path: string) => path,
  getZzzDiscSuitIconUrl: (path: string) => path,
}));

import { useAgents } from '@/hooks/zenless-zone-zero/useAgents';
import { useParties } from '@/hooks/zenless-zone-zero/useParties';

function makeAgent(id: string, name: string): ZzzTrackedAgent {
  return {
    id,
    name,
    rarity: 4,
    specialty: 'Attack',
    element: 'Fire',
    imageUrl: `/assets/zenless-zone-zero/agents/${id}.webp`,
    dbId: `db-${id}`,
    isFavorited: false,
    level: 45,
    mindscape: 2,
    coreSkill: 3,
    discs: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
    buildPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
  };
}

function makeParty(id: string, name: string): Party {
  return {
    id,
    profileId: 'user-1',
    name,
    notes: null,
    members: [],
    createdAt: '2026-01-01T00:00:00Z',
  };
}

const defaultAgentsHook = {
  availableAgents: [],
  trackedAgents: [] as ZzzTrackedAgent[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addAgent: vi.fn(),
  removeAgent: vi.fn(),
  updateLevel: vi.fn(),
  updateMindscape: vi.fn(),
  updateCoreSkill: vi.fn(),
  toggleFavorite: vi.fn(),
  saveDiscData: vi.fn(),
  removeDiscData: vi.fn(),
  saveDiscPreferences: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

const defaultPartiesHook = {
  parties: [] as Party[],
  isLoading: false,
  saveParty: vi.fn().mockResolvedValue(null),
  deleteParty: vi.fn().mockResolvedValue(true),
  toggleFavoriteParty: vi.fn(),
  refreshParties: vi.fn(),
};

describe('ZzzPage', () => {
  beforeEach(() => {
    vi.mocked(useAgents).mockReturnValue(defaultAgentsHook);
    vi.mocked(useParties).mockReturnValue(defaultPartiesHook);
  });

  it('shows "Authenticating..." while auth is loading', () => {
    renderWithProviders(<ZzzPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<ZzzPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows "Loading database sync..." during initial load with session', () => {
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      isInitialLoad: true,
    });
    const session = createMockSession();
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/loading database sync/i)).toBeInTheDocument();
  });

  it('shows load error state and retries', () => {
    const retryLoad = vi.fn();
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      isLoadError: true,
      retryLoad,
    });
    const session = createMockSession();
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    expect(screen.getByTitle('Add Agent')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no agents are tracked', () => {
    const session = createMockSession();
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no agents tracked yet/i)).toBeInTheDocument();
  });

  it('renders agent cards when agents are tracked', () => {
    const session = createMockSession();
    const agents = [makeAgent('1191', 'Ellen'), makeAgent('1241', 'Zhu Yuan')];
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      trackedAgents: agents,
      getFilteredRoster: vi.fn().mockReturnValue(agents),
    });
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText('Ellen')).toBeInTheDocument();
    expect(screen.getByText('Zhu Yuan')).toBeInTheDocument();
  });

  it('shows "no agents match" when search filters all out', () => {
    const session = createMockSession();
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      trackedAgents: [makeAgent('1191', 'Ellen')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByText(/no agents match your search/i)).toBeInTheDocument();
  });

  it('opens AddAgentModal when add button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Agent'));
    expect(screen.getByRole('heading', { name: /add agent/i })).toBeInTheDocument();
  });

  it('switches to Parties tab when Parties button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    expect(screen.getByText(/no parties configured/i)).toBeInTheDocument();
  });

  it('shows parties in the Parties tab when they exist', () => {
    const session = createMockSession();
    vi.mocked(useParties).mockReturnValue({
      ...defaultPartiesHook,
      parties: [makeParty('p1', 'Shiyu Alpha'), makeParty('p2', 'Shiyu Beta')],
    });
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /parties/i }));
    expect(screen.getByText('Shiyu Alpha')).toBeInTheDocument();
    expect(screen.getByText('Shiyu Beta')).toBeInTheDocument();
  });

  it('shows SavingToast when pendingSaveCount > 0', () => {
    const session = createMockSession();
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      pendingSaveCount: 2,
    });
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    renderWithProviders(<ZzzPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /zenless zone zero/i })).toBeInTheDocument();
  });

  it('sort button cycles AZ → Lv → ★ (Disc Score)', () => {
    const session = createMockSession();
    const agents = [makeAgent('1191', 'Ellen')];
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      trackedAgents: agents,
      getFilteredRoster: vi.fn().mockReturnValue(agents),
    });
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    const sortBtn = screen.getByTitle(/sorted alphabetically/i);
    expect(sortBtn).toHaveTextContent('AZ');
    fireEvent.click(sortBtn);
    expect(screen.getByTitle(/sorted by level/i)).toHaveTextContent('Lv');
    fireEvent.click(screen.getByTitle(/sorted by level/i));
    expect(screen.getByTitle(/sorted by disc score/i)).toHaveTextContent('★');
  });

  it('passes the disc scorer to getFilteredRoster', () => {
    const session = createMockSession();
    const getFilteredRoster = vi.fn().mockReturnValue([]);
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      trackedAgents: [makeAgent('1191', 'Ellen')],
      getFilteredRoster,
    });
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(getFilteredRoster).toHaveBeenCalledWith('', 'ALPHA', expect.any(Function));
  });

  it('opens the disc editor anchored to the clicked slot and wires the hook actions', () => {
    const session = createMockSession();
    const saveDiscData = vi.fn();
    const agents = [makeAgent('1191', 'Ellen')];
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      trackedAgents: agents,
      saveDiscData,
      getFilteredRoster: vi.fn().mockReturnValue(agents),
    });
    const { container } = renderWithProviders(
      <ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    // Open edit mode on the card, then click disc slot cell 4 (index 3).
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(container.querySelectorAll('.equip-slot-cell')[3]);
    expect(screen.getByText('Drive Discs — Ellen')).toBeInTheDocument();

    // Selecting a suit in the editor routes through the hook's saveDiscData.
    fireEvent.change(container.querySelector('select[name="disc-4-suit"]')!, {
      target: { value: '31000' },
    });
    expect(saveDiscData).toHaveBeenCalledWith(
      { agentId: '1191', slot: 4 },
      expect.objectContaining({ suitId: '31000' }),
    );
  });

  it('routes editor remove, preference, and close actions through the hook', () => {
    const session = createMockSession();
    const removeDiscData = vi.fn();
    const saveDiscPreferences = vi.fn();
    const agent = {
      ...makeAgent('1191', 'Ellen'),
      discs: {
        1: null,
        2: null,
        3: null,
        4: { suitId: '31000', mainStat: 'CRIT Rate', subStats: [] },
        5: null,
        6: null,
      },
    };
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      trackedAgents: [agent],
      removeDiscData,
      saveDiscPreferences,
      getFilteredRoster: vi.fn().mockReturnValue([agent]),
    });
    const { container } = renderWithProviders(
      <ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(container.querySelectorAll('.equip-slot-cell')[3]);

    // Clearing the suit routes through removeDiscData.
    fireEvent.change(container.querySelector('select[name="disc-4-suit"]')!, {
      target: { value: '' },
    });
    expect(removeDiscData).toHaveBeenCalledWith({ agentId: '1191', slot: 4 });

    // A preference edit routes through saveDiscPreferences.
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('select[name="pref-suit-4"]')!, {
      target: { value: '31000' },
    });
    expect(saveDiscPreferences).toHaveBeenCalledWith(
      '1191',
      expect.objectContaining({ discSuit4Id: '31000' }),
    );

    // Done unmounts the editor.
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('Drive Discs — Ellen')).toBeNull();
  });

  it('closes AddAgentModal after an agent is added', async () => {
    const session = createMockSession();
    vi.mocked(useAgents).mockReturnValue({
      ...defaultAgentsHook,
      availableAgents: [
        {
          id: '1191',
          name: 'Ellen',
          rarity: 4,
          specialty: 'Attack',
          element: 'Ice',
          imageUrl: '/1191.webp',
        },
      ],
      addAgent: vi.fn(),
    });
    renderWithProviders(<ZzzPage session={session} isAuthLoading={false} onSignIn={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Add Agent'));
    expect(screen.getByRole('heading', { name: /add agent/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ellen'));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add agent/i })).not.toBeInTheDocument();
    });
  });
});
