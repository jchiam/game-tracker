import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/reverse1999/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import type { Arcanist } from '@/data/reverse1999/arcanists';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => `mugshot:${url}`),
  getAvatarUrl: vi.fn((url: string) => `avatar:${url}`),
}));

const availableArcanists: Arcanist[] = [
  {
    id: 'an_an',
    name: 'An-an Lee',
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: '/an_an.webp',
    hasEuphoria: false,
  },
];

const party: Party = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Team Alpha',
  notes: null,
  tier: 'S',
  isFavorited: false,
  members: [{ entityId: 'an_an', slotIndex: 0 }],
  createdAt: new Date().toISOString(),
};

const defaultProps = {
  parties: [party],
  availableArcanists,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab (R1999 config wiring)', () => {
  it('uses the Lineup noun with the tier selector enabled', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Lineups')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Lineup' }));
    expect(screen.getByPlaceholderText(/limbo of ruin/i)).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders the tier banner and favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('party-1', true);
  });

  it('resolves member images through getMugshotUrl with the afflatus accent', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText('An-an Lee');
    expect(img).toHaveAttribute('src', 'mugshot:/an_an.webp');
    expect(img.closest('.slot-avatar')).toHaveClass('afflatus-star');
  });
});
