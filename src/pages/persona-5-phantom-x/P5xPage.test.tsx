import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { P5xPage } from './P5xPage';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { P5xTrackedThief, Party } from '@/types';

vi.mock('@/hooks/persona-5-phantom-x/useThieves', () => ({
  useThieves: vi.fn(),
}));

vi.mock('@/hooks/persona-5-phantom-x/useParties', () => ({
  useParties: vi.fn(),
}));

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

import { useThieves } from '@/hooks/persona-5-phantom-x/useThieves';
import { useParties } from '@/hooks/persona-5-phantom-x/useParties';

function makeThief(id: string, name: string): P5xTrackedThief {
  return {
    id,
    name,
    codename: name,
    personaName: 'Carmen',
    rarity: 5,
    role: 'Multi-target',
    element: 'Fire',
    imageUrl: `/assets/persona-5-phantom-x/thieves/${id}.webp`,
    dbId: `db-${id}`,
    isFavorited: false,
    level: 45,
    awareness: 3,
    skillsLeveled: false,
    roseMaxed: false,
    mindscapeMaxed: false,
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

const defaultThievesHook = {
  availableThieves: [],
  trackedThieves: [] as P5xTrackedThief[],
  isInitialLoad: false,
  isLoadError: false,
  retryLoad: vi.fn(),
  pendingSaveCount: 0,
  addThief: vi.fn(),
  removeThief: vi.fn(),
  updateLevel: vi.fn(),
  updateAwareness: vi.fn(),
  updateSkillProgress: vi.fn(),
  toggleFavorite: vi.fn(),
  toggleMindscapeMaxed: vi.fn(),
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

describe('P5xPage', () => {
  beforeEach(() => {
    vi.mocked(useThieves).mockReturnValue(defaultThievesHook);
    vi.mocked(useParties).mockReturnValue(defaultPartiesHook);
  });

  it('shows "Authenticating..." while auth is loading', () => {
    renderWithProviders(<P5xPage session={null} isAuthLoading={true} onSignIn={vi.fn()} />);
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('shows AuthGate when there is no session', () => {
    renderWithProviders(<P5xPage session={null} isAuthLoading={false} onSignIn={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows "Loading database sync..." during initial load with session', () => {
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, isInitialLoad: true });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/loading database sync/i)).toBeInTheDocument();
  });

  it('shows load error state when isLoadError is true', () => {
    vi.mocked(useThieves).mockReturnValue({ ...defaultThievesHook, isLoadError: true });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders tracked thief cards from the filtered roster', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki'), makeThief('lufel', 'Lufel')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue(thieves),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();
    expect(screen.getByText('Lufel')).toBeInTheDocument();
  });

  it('shows the empty message when nothing is tracked', () => {
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByText(/no phantom thieves tracked yet/i)).toBeInTheDocument();
  });

  it('switches to the Parties view', () => {
    vi.mocked(useParties).mockReturnValue({
      ...defaultPartiesHook,
      parties: [makeParty('p1', 'Party Alpha')],
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Parties' }));
    expect(screen.getByText('Your Parties')).toBeInTheDocument();
    expect(screen.getByText('Party Alpha')).toBeInTheDocument();
  });

  it('opens the add modal from the add button', () => {
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Add Phantom Thief'));
    expect(screen.getByRole('heading', { name: /add phantom thief/i })).toBeInTheDocument();
  });

  it('renders the rose-gate filter chip', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: vi.fn().mockReturnValue(thieves),
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '🌹 Gated' })).toBeInTheDocument();
  });

  it('activating filter chip calls getFilteredRoster with predicate', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue(thieves);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '🌹 Gated' }));
    const lastCall = mockGetFiltered.mock.calls[mockGetFiltered.mock.calls.length - 1];
    expect(lastCall[2]).toBeInstanceOf(Function);
  });

  it('shows contextual empty message when filter active with no matches', () => {
    const thieves = [makeThief('ann-takamaki', 'Ann Takamaki')];
    const mockGetFiltered = vi.fn().mockReturnValue([]);
    vi.mocked(useThieves).mockReturnValue({
      ...defaultThievesHook,
      trackedThieves: thieves,
      getFilteredRoster: mockGetFiltered,
    });
    renderWithProviders(
      <P5xPage session={createMockSession()} isAuthLoading={false} onSignIn={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '🌹 Gated' }));
    expect(screen.getByText(/no rose-gated thieves/i)).toBeInTheDocument();
  });
});
