import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/neverness-to-everness/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => `mugshot:${url}`),
  getAvatarUrl: vi.fn((url: string) => `avatar:${url}`),
}));

const sampleChars: N2ECharacter[] = [
  {
    id: 'baicang',
    sourceId: 'baicang',
    name: 'Baicang',
    rarity: 'S',
    esperType: 'Incantation',
    arcType: 'Burst',
    roles: ['DPS'],
    imageUrl: '/baicang.webp',
  },
];

const party: Party = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Team Alpha',
  notes: null,
  tier: 'A',
  isFavorited: false,
  members: [{ entityId: 'baicang', slotIndex: 0 }],
  createdAt: new Date().toISOString(),
};

const defaultProps = {
  parties: [party],
  availableCharacters: sampleChars,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab (N2E config wiring)', () => {
  it('uses the Lineup noun, N2E copy, and the tier selector', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Lineups')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Lineup' }));
    expect(screen.getByPlaceholderText(/abyss floor/i)).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders the tier banner and favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('party-1', true);
  });

  it('resolves member images through getMugshotUrl with the esper accent', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText('Baicang');
    expect(img).toHaveAttribute('src', 'mugshot:/baicang.webp');
    expect(img.closest('.slot-avatar')).toHaveClass('esper-incantation');
  });
});
