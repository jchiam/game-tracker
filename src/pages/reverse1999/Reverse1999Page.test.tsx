import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { Reverse1999Page } from '@/pages/reverse1999/Reverse1999Page';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { R1999TrackedArcanist } from '@/types';

vi.mock('@/hooks/reverse1999/useArcanists', () => ({
  useArcanists: vi.fn(),
}));

import { useArcanists } from '@/hooks/reverse1999/useArcanists';

function makeArcanist(id: string, name: string): R1999TrackedArcanist {
  return {
    id,
    name,
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: `/assets/${id}.webp`,
    isFavorited: false,
    level: 40,
    portraitLevel: 0,
    resonanceLevel: 0,
    euphoriaStage: 0,
    psychubeId: null,
    psychubeLevel: 1,
    psychubeAmplification: 0,
  };
}

const defaultArcanistsHook = {
  availableArcanists: [],
  trackedArcanists: [],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addArcanist: vi.fn(),
  removeArcanist: vi.fn(),
  updateArcanistLevel: vi.fn(),
  updatePortraitLevel: vi.fn(),
  updateResonanceLevel: vi.fn(),
  updateEuphoriaStage: vi.fn(),
  updatePsychube: vi.fn(),
  updatePsychubeAmplification: vi.fn(),
  toggleFavoriteArcanist: vi.fn(),
  getFilteredRoster: vi.fn().mockReturnValue([]),
};

describe('Reverse1999Page', () => {
  beforeEach(() => {
    vi.mocked(useArcanists).mockReturnValue(defaultArcanistsHook);
  });

  it('renders the page title', () => {
    renderWithProviders(
      <Reverse1999Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: /reverse: 1999 arcanists/i })).toBeInTheDocument();
  });

  it('shows "Authenticating..." while auth is loading', () => {
    renderWithProviders(<Reverse1999Page session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(
      <Reverse1999Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows "Loading database sync..." during initial load with session', () => {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isInitialLoad: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/loading database sync/i)).toBeInTheDocument();
  });

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('disables the add arcanist button when isLoadError is true', () => {
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isLoadError: true,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByTitle('Add Arcanist')).toBeDisabled();
  });

  it('calls retryLoad when Retry button is clicked', () => {
    const retryLoad = vi.fn();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      isLoadError: true,
      retryLoad,
    });
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no arcanists are tracked', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no arcanists tracked yet/i)).toBeInTheDocument();
  });

  it('renders arcanist cards when arcanists are tracked', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus'), makeArcanist('vertin', 'Vertin')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster: vi.fn().mockReturnValue(arcanists),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText('Regulus')).toBeInTheDocument();
    expect(screen.getByText('Vertin')).toBeInTheDocument();
  });

  it('shows "no arcanists match your search" when search filters all out', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: [makeArcanist('regulus', 'Regulus')],
      getFilteredRoster: vi.fn().mockReturnValue([]),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no arcanists match your search/i)).toBeInTheDocument();
  });

  it('shows the add arcanist button when session exists', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByTitle('Add Arcanist')).toBeInTheDocument();
  });

  it('opens AddArcanistModal when add button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Add Arcanist'));
    expect(screen.getByRole('heading', { name: /add arcanist/i })).toBeInTheDocument();
  });

  it('shows SavingToast when pendingSaveCount > 0', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      pendingSaveCount: 1,
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not show the add button when there is no session', () => {
    renderWithProviders(
      <Reverse1999Page session={null} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.queryByTitle('Add Arcanist')).not.toBeInTheDocument();
  });

  // --- Search input wiring ---

  it('passes the typed search term to getFilteredRoster', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    const getFilteredRoster = vi.fn().mockReturnValue(arcanists);
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster,
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name, afflatus/i), {
      target: { value: 'Vertin' },
    });
    expect(getFilteredRoster).toHaveBeenCalledWith('Vertin', expect.any(String));
  });

  // --- Search / sort controls visibility ---

  it('does not show search or sort controls when no arcanists are tracked', () => {
    const session = createMockSession();
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.queryByPlaceholderText(/search by name, afflatus/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/sorted alphabetically/i)).not.toBeInTheDocument();
  });

  it('shows search and sort controls when arcanists are tracked', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster: vi.fn().mockReturnValue(arcanists),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText(/search by name, afflatus/i)).toBeInTheDocument();
    expect(screen.getByTitle(/sorted alphabetically/i)).toBeInTheDocument();
  });

  // --- Sort button toggle ---

  it('sort button has active class and AZ label in default ALPHA mode', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster: vi.fn().mockReturnValue(arcanists),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    const sortBtn = screen.getByTitle(/sorted alphabetically/i);
    expect(sortBtn).toHaveClass('active');
    expect(sortBtn).toHaveTextContent('AZ');
  });

  it('sort button loses active class and shows Lv label after toggling to LEVEL', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster: vi.fn().mockReturnValue(arcanists),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i));
    const sortBtn = screen.getByTitle(/sorted by level/i);
    expect(sortBtn).not.toHaveClass('active');
    expect(sortBtn).toHaveTextContent('Lv');
  });

  it('passes LEVEL to getFilteredRoster after toggling sort', () => {
    const session = createMockSession();
    const arcanists = [makeArcanist('regulus', 'Regulus')];
    const getFilteredRoster = vi.fn().mockReturnValue(arcanists);
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      trackedArcanists: arcanists,
      getFilteredRoster,
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle(/sorted alphabetically/i));
    expect(getFilteredRoster).toHaveBeenCalledWith('', 'LEVEL');
  });

  // --- AddArcanistModal: adding closes the modal ---

  it('closes AddArcanistModal after an arcanist is added', () => {
    const session = createMockSession();
    vi.mocked(useArcanists).mockReturnValue({
      ...defaultArcanistsHook,
      availableArcanists: [
        {
          id: 'regulus',
          name: 'Regulus',
          afflatus: 'Star',
          damageType: 'Mental',
          imageUrl: '/regulus.webp',
        },
      ],
      addArcanist: vi.fn(),
    });
    renderWithProviders(
      <Reverse1999Page session={session} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Add Arcanist'));
    expect(screen.getByRole('heading', { name: /add arcanist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Regulus'));
    expect(screen.queryByRole('heading', { name: /add arcanist/i })).not.toBeInTheDocument();
  });
});
