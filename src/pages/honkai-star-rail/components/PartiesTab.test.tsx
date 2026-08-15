import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/honkai-star-rail/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => `mugshot:${url}`),
  getAvatarUrl: vi.fn((url: string) => `avatar:${url}`),
}));

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
  tier: 'S',
  isFavorited: false,
  members: [{ entityId: 'acheron', slotIndex: 0 }],
  createdAt: new Date().toISOString(),
};

const defaultProps = {
  parties: [party],
  availableCharacters,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab (HSR config wiring)', () => {
  it('uses the Party noun with the tier selector enabled', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Lineups')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    expect(screen.getByPlaceholderText(/memory of chaos/i)).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders the tier banner and favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('party-1', true);
  });

  it('resolves member images through getMugshotUrl with the element accent', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText('Acheron');
    expect(img).toHaveAttribute('src', 'mugshot:/acheron.webp');
    expect(img.closest('.slot-avatar')).toHaveClass('element-thunder');
  });

  it('excludes other Trailblazer forms from the picker once one is selected', () => {
    const tbCharacters: Character[] = [
      ...availableCharacters,
      {
        id: 'trailblazer_harmony',
        name: 'Trailblazer (Harmony)',
        element: 'Imaginary',
        path: 'Harmony',
        imageUrl: '/tb-harmony.webp',
      },
      {
        id: 'trailblazer_remembrance',
        name: 'Trailblazer (Remembrance)',
        element: 'Ice',
        path: 'Remembrance',
        imageUrl: '/tb-remembrance.webp',
      },
    ];
    renderWithProviders(
      <PartiesTab {...defaultProps} parties={[]} availableCharacters={tbCharacters} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.click(screen.getByText('Trailblazer (Harmony)'));

    fireEvent.click(screen.getByText('Slot 2'));
    expect(screen.queryByText('Trailblazer (Remembrance)')).not.toBeInTheDocument();
    expect(screen.getByText('Acheron')).toBeInTheDocument();
  });
});
