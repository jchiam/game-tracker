import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/honkai-star-rail/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

const availableCharacters: Character[] = [
  {
    id: 'acheron',
    name: 'Acheron',
    element: 'Thunder',
    path: 'Nihility',
    imageUrl: '/acheron.webp',
  },
];

const party: Party = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Team Alpha',
  notes: null,
  members: [{ entityId: 'acheron', slotIndex: 0 }],
  createdAt: new Date().toISOString(),
};

const defaultProps = {
  parties: [party],
  availableCharacters,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  session: createMockSession(),
};

describe('PartiesTab (HSR config wiring)', () => {
  it('uses the Party noun and HSR copy, without a tier selector', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Lineups')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    expect(screen.getByPlaceholderText(/memory of chaos/i)).toBeInTheDocument();
    expect(screen.queryByText('Tier')).not.toBeInTheDocument();
  });

  it('resolves members from the catalog with raw image paths and element accents', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText('Acheron');
    expect(img).toHaveAttribute('src', '/acheron.webp');
    expect(img.closest('.slot-avatar')).toHaveClass('element-thunder');
  });

  it('does not render a favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.queryByTitle('Favourite')).not.toBeInTheDocument();
  });
});
