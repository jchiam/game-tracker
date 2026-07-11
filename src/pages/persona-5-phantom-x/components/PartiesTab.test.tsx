import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/persona-5-phantom-x/components/PartiesTab';
import { P5X_SLOTS } from '@/pages/persona-5-phantom-x/components/partyConfig';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import { ALL_THIEVES } from '@/data/persona-5-phantom-x/thieves';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => `mugshot:${url}`),
  getAvatarUrl: vi.fn((url: string) => `avatar:${url}`),
  getPersonaMugshotUrl: vi.fn((url: string) => `persona-mugshot:${url}`),
  getPersonaAvatarUrl: vi.fn((url: string) => `persona-avatar:${url}`),
}));

const firstThief = ALL_THIEVES[0];

const party: Party = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Party Alpha',
  notes: null,
  tier: 'S',
  isFavorited: false,
  // Thieves occupy slots 4–6 in the restructured P5X party model.
  members: [{ entityId: firstThief.id, slotIndex: 4 }],
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultProps = {
  parties: [party],
  availableThieves: ALL_THIEVES,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab (P5X config wiring)', () => {
  it('uses the Party noun with the tier selector enabled', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Parties')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    expect(screen.getByPlaceholderText(/kamoshida palace/i)).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders the tier banner and favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('party-1', true);
  });

  it('renders the p5x-party variant with a fixed Wonder slot', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(document.querySelector('.parties-tab.p5x-party')).toBeInTheDocument();
    expect(screen.getByAltText('Wonder')).toBeInTheDocument();
  });

  it('resolves thief member images through getMugshotUrl', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText(firstThief.name);
    expect(img).toHaveAttribute('src', `mugshot:${firstThief.imageUrl}`);
  });
});

describe('PartiesTab (P5X slot filters)', () => {
  const navigator = ALL_THIEVES.find((t) => t.role === 'Navigator')!;
  const activeThief = ALL_THIEVES.find((t) => t.role !== 'Navigator')!;
  const navEntity = { ...navigator, entityType: 'thief' as const };
  const activeEntity = { ...activeThief, entityType: 'thief' as const };

  const slot = (index: number) => P5X_SLOTS.find((s) => s.index === index)!;

  it('restricts the Navigator slot (7) to role === Navigator', () => {
    const filter = slot(7).entityFilter!;
    expect(slot(7).label).toBe('Navigator');
    expect(filter(navEntity)).toBe(true);
    expect(filter(activeEntity)).toBe(false);
  });

  it('excludes Navigators from the active thief slots (4–6)', () => {
    for (const index of [4, 5, 6]) {
      const filter = slot(index).entityFilter!;
      expect(filter(navEntity)).toBe(false);
      expect(filter(activeEntity)).toBe(true);
    }
  });
});
