import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddCharacterModal } from '@/pages/neverness-to-everness/components/AddCharacterModal';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import type { N2ETrackedCharacter } from '@/types';

vi.mock('@/lib/imagekit', () => ({
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
  {
    id: 'jade',
    name: 'Jade',
    rarity: 'A',
    esperType: 'Cosmos',
    arcType: 'Solid',
    roles: ['Support'],
    imageUrl: '/jade.webp',
  },
  {
    id: 'zuri',
    name: 'Zuri',
    rarity: 'S',
    esperType: 'Psyche',
    arcType: 'Fluid',
    roles: ['Healer'],
    imageUrl: '/zuri.webp',
  },
];

const trackedChar: N2ETrackedCharacter = {
  id: 'baicang',
  name: 'Baicang',
  rarity: 'S',
  esperType: 'Incantation',
  arcType: 'Burst',
  roles: ['DPS'],
  imageUrl: '/baicang.webp',
  isFavorited: false,
  level: 1,
  awakening: [false, false, false, false, false, false],
  arcId: null,
  arcLevel: 1,
  arcTier: 1,
  cartridgeId: null,
  cartridgeRarity: null,
  cartridgeLevel: 0,
  cartridgeMainStat: null,
  cartridgeSubStats: [],
  cartridgePreferences: { cartridgeId: null, mainStats: [], subStats: [] },
};

const defaultProps = {
  onAddCharacter: vi.fn(),
  onClose: vi.fn(),
};

describe('AddCharacterModal', () => {
  it('renders modal with title', () => {
    render(
      <AddCharacterModal
        availableCharacters={sampleChars}
        trackedCharacters={[]}
        {...defaultProps}
      />,
    );
    expect(screen.getByRole('heading', { name: /add esper/i })).toBeInTheDocument();
  });

  it('shows untracked characters sorted alphabetically', () => {
    render(
      <AddCharacterModal
        availableCharacters={sampleChars}
        trackedCharacters={[]}
        {...defaultProps}
      />,
    );
    const names = screen.getAllByText(/^(Baicang|Jade|Zuri)$/);
    expect(names[0]).toHaveTextContent('Baicang');
    expect(names[1]).toHaveTextContent('Jade');
    expect(names[2]).toHaveTextContent('Zuri');
  });

  it('excludes already-tracked characters', () => {
    render(
      <AddCharacterModal
        availableCharacters={sampleChars}
        trackedCharacters={[trackedChar]}
        {...defaultProps}
      />,
    );
    expect(screen.queryByText('Baicang')).not.toBeInTheDocument();
    expect(screen.getByText('Jade')).toBeInTheDocument();
  });

  it('filters characters by search term', () => {
    render(
      <AddCharacterModal
        availableCharacters={sampleChars}
        trackedCharacters={[]}
        {...defaultProps}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/search espers/i), {
      target: { value: 'Jade' },
    });
    expect(screen.getByText('Jade')).toBeInTheDocument();
    expect(screen.queryByText('Baicang')).not.toBeInTheDocument();
  });

  it('shows no results message when search matches nothing', () => {
    render(
      <AddCharacterModal
        availableCharacters={sampleChars}
        trackedCharacters={[]}
        {...defaultProps}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/search espers/i), {
      target: { value: 'zzzzz' },
    });
    expect(screen.getByText(/no espers found/i)).toBeInTheDocument();
  });

  it('calls onAddCharacter when a character is clicked', () => {
    const onAddCharacter = vi.fn();
    render(
      <AddCharacterModal
        availableCharacters={sampleChars}
        trackedCharacters={[]}
        {...defaultProps}
        onAddCharacter={onAddCharacter}
      />,
    );
    fireEvent.click(screen.getByText('Jade'));
    expect(onAddCharacter).toHaveBeenCalledWith(sampleChars[1]);
  });

  it('renders esper type and arc type badges', () => {
    render(
      <AddCharacterModal
        availableCharacters={[sampleChars[0]]}
        trackedCharacters={[]}
        {...defaultProps}
      />,
    );
    expect(screen.getByText('Incantation')).toBeInTheDocument();
    expect(screen.getByText('Burst')).toBeInTheDocument();
  });

  it('falls back to ui-avatars on image error', () => {
    render(
      <AddCharacterModal
        availableCharacters={[sampleChars[0]]}
        trackedCharacters={[]}
        {...defaultProps}
      />,
    );
    const img = screen.getByAltText('Baicang');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
  });
});
