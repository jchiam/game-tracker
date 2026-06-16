import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PartiesTab } from '@/pages/neverness-to-everness/components/PartiesTab';
import type { N2EParty } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import { createMockSession } from '@/test/utils';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => url),
  getAvatarUrl: vi.fn((url: string) => url),
}));

const sampleChars: N2ECharacter[] = [
  {
    id: 'baicang',
    name: 'Baicang',
    rarity: 'S',
    esperType: 'Incantation',
    arcType: 'Burst',
    roles: ['DPS'],
    imageUrl: '/baicang.webp',
  },
];

function makeParty(id: string, name: string, overrides: Partial<N2EParty> = {}): N2EParty {
  return {
    id,
    profileId: 'user-1',
    name,
    notes: null,
    tier: null,
    isFavorited: false,
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const defaultProps = {
  parties: [] as N2EParty[],
  availableCharacters: sampleChars,
  onSaveParty: vi.fn().mockResolvedValue(null),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab', () => {
  it('shows sign-in message when no session', () => {
    render(<PartiesTab {...defaultProps} session={null} />);
    expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
  });

  it('shows empty state when no parties exist', () => {
    render(<PartiesTab {...defaultProps} />);
    expect(screen.getByText(/no lineups configured/i)).toBeInTheDocument();
  });

  it('renders party cards when parties exist', () => {
    render(
      <PartiesTab
        {...defaultProps}
        parties={[makeParty('p1', 'Alpha'), makeParty('p2', 'Beta')]}
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('opens create modal when Create New Lineup is clicked', () => {
    render(<PartiesTab {...defaultProps} />);
    fireEvent.click(screen.getByText('Create New Lineup'));
    expect(screen.getByRole('heading', { name: /create new lineup/i })).toBeInTheDocument();
  });

  it('opens edit modal when edit button on a party card is clicked', () => {
    render(<PartiesTab {...defaultProps} parties={[makeParty('p1', 'Alpha')]} />);
    fireEvent.click(screen.getByTitle('Edit Lineup'));
    expect(screen.getByText(/edit lineup/i)).toBeInTheDocument();
  });

  it('sorts parties with favorited first', () => {
    const parties = [
      makeParty('p1', 'Beta', { isFavorited: false }),
      makeParty('p2', 'Alpha', { isFavorited: true }),
    ];
    render(<PartiesTab {...defaultProps} parties={parties} />);
    const names = screen.getAllByRole('heading', { level: 3 });
    expect(names[0]).toHaveTextContent('Alpha');
    expect(names[1]).toHaveTextContent('Beta');
  });

  it('sorts parties by tier rank when not favorited', () => {
    const parties = [
      makeParty('p1', 'B Team', { tier: 'B' }),
      makeParty('p2', 'S Team', { tier: 'S' }),
    ];
    render(<PartiesTab {...defaultProps} parties={parties} />);
    const names = screen.getAllByRole('heading', { level: 3 });
    expect(names[0]).toHaveTextContent('S Team');
    expect(names[1]).toHaveTextContent('B Team');
  });

  it('calls onToggleFavorite when favorite button on a card is clicked', () => {
    const onToggleFavorite = vi.fn();
    render(
      <PartiesTab
        {...defaultProps}
        parties={[makeParty('p1', 'Alpha', { isFavorited: false })]}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(onToggleFavorite).toHaveBeenCalledWith('p1', true);
  });

  it('calls onDeleteParty when delete button on a card is clicked', () => {
    const onDeleteParty = vi.fn().mockResolvedValue(true);
    render(
      <PartiesTab
        {...defaultProps}
        parties={[makeParty('p1', 'Alpha')]}
        onDeleteParty={onDeleteParty}
      />,
    );
    fireEvent.click(screen.getByTitle('Delete Lineup'));
    expect(onDeleteParty).toHaveBeenCalledWith('p1');
  });

  it('calls onSaveParty and closes modal when editing party is saved', async () => {
    const onSaveParty = vi.fn().mockResolvedValue('p1');
    render(
      <PartiesTab
        {...defaultProps}
        parties={[makeParty('p1', 'Alpha')]}
        onSaveParty={onSaveParty}
      />,
    );
    
    // Open edit modal
    fireEvent.click(screen.getByTitle('Edit Lineup'));
    expect(screen.getByText(/edit lineup/i)).toBeInTheDocument();
    
    // Save lineup
    fireEvent.click(screen.getByText('Save Lineup'));
    await waitFor(() => {
      expect(onSaveParty).toHaveBeenCalled();
      expect(screen.queryByText(/edit lineup/i)).not.toBeInTheDocument();
    });
  });

  it('closes modal when cancel/close is clicked inside edit modal', () => {
    render(<PartiesTab {...defaultProps} parties={[makeParty('p1', 'Alpha')]} />);
    
    // Open edit modal
    fireEvent.click(screen.getByTitle('Edit Lineup'));
    expect(screen.getByText(/edit lineup/i)).toBeInTheDocument();
    
    // Close lineup
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText(/edit lineup/i)).not.toBeInTheDocument();
  });
});
