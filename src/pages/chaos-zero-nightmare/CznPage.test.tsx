import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CznPage } from './CznPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { CznTrackedCombatant, Party } from '@/types';

vi.mock('@/hooks/chaos-zero-nightmare/useCombatants', () => ({
  useCombatants: vi.fn(),
}));

vi.mock('@/hooks/chaos-zero-nightmare/useParties', () => ({
  useParties: vi.fn(),
}));

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
  getCznFragmentSetIconUrl: (path: string) => path,
}));

import { useCombatants } from '@/hooks/chaos-zero-nightmare/useCombatants';
import { useParties } from '@/hooks/chaos-zero-nightmare/useParties';

function makeCombatant(id: string, name: string): CznTrackedCombatant {
  return {
    id,
    name,
    rarity: 5,
    class: 'Striker',
    element: 'Passion',
    faction: null,
    imageUrl: `/assets/chaos-zero-nightmare/combatants/${id}.webp`,
    dbId: `db-${id}`,
    isFavorited: false,
    level: 45,
    ego: 2,
    potentialAttained: false,
    partnerId: null,
    partnerLevel: 1,
    partnerEgo: 0,
    partnerPreferences: [],
    fragments: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
    fragmentPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [], targetSetIds: [] },
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

const defaultCombatantsHook = {
  availableCombatants: [],
  trackedCombatants: [] as CznTrackedCombatant[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addCombatant: vi.fn(),
  removeCombatant: vi.fn(),
  updateLevel: vi.fn(),
  updateEgo: vi.fn(),
  togglePotential: vi.fn(),
  updatePartner: vi.fn(),
  updatePartnerPreferences: vi.fn(),
  toggleFavorite: vi.fn(),
  saveFragmentData: vi.fn(),
  removeFragmentData: vi.fn(),
  saveFragmentPreferences: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

const defaultPartiesHook = {
  parties: [] as Party[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  saveParty: vi.fn().mockResolvedValue({ partyId: null }),
  deleteParty: vi.fn().mockResolvedValue(true),
  toggleFavoriteParty: vi.fn(),
  refreshParties: vi.fn(),
};

describe('CznPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCombatants).mockReturnValue(defaultCombatantsHook);
    vi.mocked(useParties).mockReturnValue(defaultPartiesHook);
  });

  it('shows sign-in check while auth is loading', () => {
    renderWithProviders(<CznPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/checking sign-in/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<CznPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows roster loading state during initial load with session', () => {
    vi.mocked(useCombatants).mockReturnValue({ ...defaultCombatantsHook, isInitialLoad: true });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/loading your roster/i)).toBeInTheDocument();
  });

  it('shows load error state and retries both data sets', () => {
    const retryLoad = vi.fn();
    const retryParties = vi.fn();
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      isLoadError: true,
      retryLoad,
    });
    vi.mocked(useParties).mockReturnValue({ ...defaultPartiesHook, retryLoad: retryParties });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/couldn.t load your roster/i)).toBeInTheDocument();
    expect(screen.getByTitle('Add Combatant')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
    expect(retryParties).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no combatants are tracked', () => {
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no combatants tracked yet/i)).toBeInTheDocument();
  });

  it('renders combatant cards when combatants are tracked', () => {
    const combatants = [makeCombatant('mei-lin', 'Mei Lin'), makeCombatant('haru', 'Haru')];
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      trackedCombatants: combatants,
      getFilteredRoster: vi.fn().mockReturnValue(combatants),
    });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText('Mei Lin')).toBeInTheDocument();
    expect(screen.getByText('Haru')).toBeInTheDocument();
  });

  it('shows "no combatants match" when search filters all out', () => {
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      trackedCombatants: [makeCombatant('mei-lin', 'Mei Lin')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no combatants match your search/i)).toBeInTheDocument();
  });

  it('offers alphabetical and level sort modes', () => {
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      trackedCombatants: [makeCombatant('mei-lin', 'Mei Lin')],
      getFilteredRoster: vi.fn().mockReturnValue([makeCombatant('mei-lin', 'Mei Lin')]),
    });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByTitle(/click to sort by Level/i)).toBeInTheDocument();
  });

  it('wires card callbacks to the hook updaters', async () => {
    const user = userEvent.setup();
    const combatant = makeCombatant('mei-lin', 'Mei Lin');
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      trackedCombatants: [combatant],
      getFilteredRoster: vi.fn().mockReturnValue([combatant]),
    });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    await user.click(document.querySelector('.favorite-btn') as HTMLButtonElement);
    expect(defaultCombatantsHook.toggleFavorite).toHaveBeenCalledWith('mei-lin', true);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByRole('button', { name: 'T6' }));
    expect(defaultCombatantsHook.updateEgo).toHaveBeenCalledWith('mei-lin', 6);
    const partnerRungs = document.querySelectorAll<HTMLButtonElement>(
      '.partner-ego-row .toggle-btn',
    );
    await user.click(partnerRungs[partnerRungs.length - 1]);
    expect(defaultCombatantsHook.updatePartner).toHaveBeenCalledWith('mei-lin', {
      partnerEgo: 4,
    });
    await user.click(screen.getByRole('button', { name: '+ Add Partner' }));
    expect(defaultCombatantsHook.updatePartnerPreferences).toHaveBeenCalledWith(
      'mei-lin',
      expect.any(Array),
    );
    await user.click(screen.getByTitle('Done editing'));
    await user.click(screen.getByTitle('Remove Combatant'));
    expect(defaultCombatantsHook.removeCombatant).toHaveBeenCalledWith(
      'mei-lin',
      expect.any(Object),
    );
  });

  it('opens the Add Combatant modal and adds a picked combatant', async () => {
    const user = userEvent.setup();
    const available = [makeCombatant('mei-lin', 'Mei Lin')];
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      availableCombatants: available,
    });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    await user.click(screen.getByTitle('Add Combatant'));
    await user.click(screen.getByText('Mei Lin'));
    expect(defaultCombatantsHook.addCombatant).toHaveBeenCalledWith(available[0]);
  });

  it('switches to the Parties view and renders parties', async () => {
    const user = userEvent.setup();
    vi.mocked(useParties).mockReturnValue({
      ...defaultPartiesHook,
      parties: [makeParty('p1', 'Nightmare Team')],
    });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /parties/i }));
    expect(screen.getByText('Nightmare Team')).toBeInTheDocument();
  });

  it('sort button cycles AZ → Lv → ★ (Build Score)', () => {
    const combatants = [makeCombatant('mei-lin', 'Mei Lin')];
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      trackedCombatants: combatants,
      getFilteredRoster: vi.fn().mockReturnValue(combatants),
    });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    const sortBtn = screen.getByTitle(/sorted alphabetically/i);
    expect(sortBtn).toHaveTextContent('AZ');
    fireEvent.click(sortBtn);
    expect(screen.getByTitle(/sorted by level/i)).toHaveTextContent('Lv');
    fireEvent.click(screen.getByTitle(/sorted by level/i));
    expect(screen.getByTitle(/sorted by build score/i)).toHaveTextContent('★');
  });

  it('passes the build scorer to getFilteredRoster', () => {
    const getFilteredRoster = vi.fn().mockReturnValue([]);
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      trackedCombatants: [makeCombatant('mei-lin', 'Mei Lin')],
      getFilteredRoster,
    });
    renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(getFilteredRoster).toHaveBeenCalledWith(
      '',
      'ALPHA',
      expect.any(Function),
      undefined,
      expect.any(Array),
    );
  });

  it('opens the fragment editor anchored to the clicked slot and wires the hook actions', () => {
    const saveFragmentData = vi.fn();
    const combatants = [makeCombatant('mei-lin', 'Mei Lin')];
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      trackedCombatants: combatants,
      saveFragmentData,
      getFilteredRoster: vi.fn().mockReturnValue(combatants),
    });
    const { container } = renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    // Open edit mode on the card, then click slot cell IV (index 3).
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(container.querySelectorAll('.equip-slot-cell')[3]);
    expect(screen.getByText('Memory Fragments — Mei Lin')).toBeInTheDocument();

    // Selecting a set in the editor routes through the hook's saveFragmentData.
    fireEvent.change(container.querySelector('select[name="fragment-4-set"]')!, {
      target: { value: 'spark-of-passion' },
    });
    expect(saveFragmentData).toHaveBeenCalledWith(
      { combatantId: 'mei-lin', slot: 4 },
      expect.objectContaining({ setId: 'spark-of-passion' }),
    );
  });

  it('routes editor remove, preference, and close actions through the hook', () => {
    const removeFragmentData = vi.fn();
    const saveFragmentPreferences = vi.fn();
    const combatant = {
      ...makeCombatant('mei-lin', 'Mei Lin'),
      fragments: {
        1: null,
        2: null,
        3: null,
        4: { setId: 'spark-of-passion', mainStat: 'Critical Chance%', subStats: [] },
        5: null,
        6: null,
      },
    };
    vi.mocked(useCombatants).mockReturnValue({
      ...defaultCombatantsHook,
      trackedCombatants: [combatant],
      removeFragmentData,
      saveFragmentPreferences,
      getFilteredRoster: vi.fn().mockReturnValue([combatant]),
    });
    const { container } = renderWithProviders(
      <CznPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(container.querySelectorAll('.equip-slot-cell')[3]);

    // Clearing the set routes through removeFragmentData.
    fireEvent.change(container.querySelector('select[name="fragment-4-set"]')!, {
      target: { value: '' },
    });
    expect(removeFragmentData).toHaveBeenCalledWith({ combatantId: 'mei-lin', slot: 4 });

    // A preference edit routes through saveFragmentPreferences.
    fireEvent.click(screen.getByRole('button', { name: 'Build Preferences' }));
    fireEvent.change(container.querySelector('select[name="pref-set-1"]')!, {
      target: { value: 'spark-of-passion' },
    });
    expect(saveFragmentPreferences).toHaveBeenCalledWith(
      'mei-lin',
      expect.objectContaining({ targetSetIds: ['spark-of-passion'] }),
    );

    // Done unmounts the editor.
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('Memory Fragments — Mei Lin')).toBeNull();
  });
});
