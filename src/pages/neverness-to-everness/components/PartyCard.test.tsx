import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartyCard } from '@/pages/neverness-to-everness/components/PartyCard';
import type { N2EParty } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => url),
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
  {
    id: 'jade',
    name: 'Jade',
    rarity: 'A',
    esperType: 'Cosmos',
    arcType: 'Solid',
    roles: ['Support'],
    imageUrl: '/jade.webp',
  },
];

function makeParty(overrides: Partial<N2EParty> = {}): N2EParty {
  return {
    id: 'party-1',
    profileId: 'user-1',
    name: 'Alpha Team',
    notes: null,
    tier: null,
    isFavorited: false,
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const defaultProps = {
  availableCharacters: sampleChars,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onToggleFavorite: vi.fn(),
};

describe('PartyCard', () => {
  it('renders party name', () => {
    render(<PartyCard party={makeParty()} {...defaultProps} />);
    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
  });

  it('renders tier banner when tier is set', () => {
    const { container } = render(<PartyCard party={makeParty({ tier: 'S+' })} {...defaultProps} />);
    expect(container.querySelector('.n2e-party-tier-banner')).toHaveTextContent('S+');
    expect(container.querySelector('.n2e-tier-banner-Splus')).toBeInTheDocument();
  });

  it('does not render tier banner when tier is null', () => {
    const { container } = render(<PartyCard party={makeParty()} {...defaultProps} />);
    expect(container.querySelector('.n2e-party-tier-banner')).not.toBeInTheDocument();
  });

  it('renders notes when present', () => {
    render(<PartyCard party={makeParty({ notes: 'Main team for Abyss' })} {...defaultProps} />);
    expect(screen.getByText('Main team for Abyss')).toBeInTheDocument();
  });

  it('renders member avatars', () => {
    render(
      <PartyCard
        party={makeParty({ members: [{ characterId: 'baicang', slotIndex: 0 }] })}
        {...defaultProps}
      />,
    );
    expect(screen.getByAltText('Baicang')).toBeInTheDocument();
  });

  it('renders 4 slots with empty placeholders for unfilled slots', () => {
    const { container } = render(<PartyCard party={makeParty()} {...defaultProps} />);
    expect(container.querySelectorAll('.n2e-slot-item')).toHaveLength(4);
    expect(container.querySelectorAll('.n2e-empty-plus')).toHaveLength(4);
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<PartyCard party={makeParty()} {...defaultProps} onEdit={onEdit} />);
    fireEvent.click(screen.getByTitle('Edit Lineup'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<PartyCard party={makeParty()} {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle('Delete Lineup'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleFavorite with true when favoriting', () => {
    const onToggleFavorite = vi.fn();
    render(<PartyCard party={makeParty()} {...defaultProps} onToggleFavorite={onToggleFavorite} />);
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(onToggleFavorite).toHaveBeenCalledWith(true);
  });

  it('calls onToggleFavorite with false when unfavoriting', () => {
    const onToggleFavorite = vi.fn();
    render(
      <PartyCard
        party={makeParty({ isFavorited: true })}
        {...defaultProps}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    fireEvent.click(screen.getByTitle('Unfavourite'));
    expect(onToggleFavorite).toHaveBeenCalledWith(false);
  });

  it('favorite button has active class when favorited', () => {
    const { container } = render(
      <PartyCard party={makeParty({ isFavorited: true })} {...defaultProps} />,
    );
    expect(container.querySelector('.n2e-favorite-btn.active')).toBeInTheDocument();
  });
});
