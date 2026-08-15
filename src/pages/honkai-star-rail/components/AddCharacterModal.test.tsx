import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddCharacterModal } from '@/pages/honkai-star-rail/components/AddCharacterModal';
import type { Character } from '@/data/honkai-star-rail/characters';
import type { HsrTrackedCharacter } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getAvatarUrl: (path: string) => path,
}));

// Config-wiring tests only — generic picker behaviour (search mechanics, empty
// state, image fallback) is covered by AddEntityModal.test.tsx.

const availableCharacters: Character[] = [
  {
    id: 'acheron',
    name: 'Acheron',
    element: 'Thunder',
    path: 'Nihility',
    imageUrl: '/acheron.webp',
  },
  { id: 'seele', name: 'Seele', element: 'Quantum', path: 'The Hunt', imageUrl: '/seele.webp' },
];

const defaultProps = {
  availableCharacters,
  trackedCharacters: [] as HsrTrackedCharacter[],
  onAddCharacter: vi.fn(),
  onClose: vi.fn(),
};

describe('AddCharacterModal', () => {
  it('renders the HSR title and characters', () => {
    render(<AddCharacterModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add character/i })).toBeInTheDocument();
    expect(screen.getByText('Acheron')).toBeInTheDocument();
  });

  it('renders element and path badges, munging path whitespace to a dashed modifier', () => {
    render(<AddCharacterModal {...defaultProps} />);
    expect(screen.getByText('Thunder').className).toBe('game-badge element-badge element-thunder');
    expect(screen.getByText('The Hunt').className).toBe('game-badge path-badge path-the-hunt');
  });

  it('excludes tracked characters by id', () => {
    const tracked = [
      {
        ...availableCharacters[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 60,
        tracesAttained: false,
        useAltPortrait: false,
        lightConeId: null,
        lightConeLevel: 1,
        lightConeSuperimposition: 1,
        relics: { head: null, hands: null, body: null, feet: null, sphere: null, rope: null },
        lightConePreferences: [],
        buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] },
      },
    ] as HsrTrackedCharacter[];
    render(<AddCharacterModal {...defaultProps} trackedCharacters={tracked} />);
    expect(screen.queryByText('Acheron')).not.toBeInTheDocument();
    expect(screen.getByText('Seele')).toBeInTheDocument();
  });

  it('searches by path (secondary search key)', async () => {
    const user = userEvent.setup();
    render(<AddCharacterModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Search characters...'), 'Nihility');
    expect(screen.getByText('Acheron')).toBeInTheDocument();
    expect(screen.queryByText('Seele')).not.toBeInTheDocument();
  });

  it('passes the full character to onAddCharacter', async () => {
    const user = userEvent.setup();
    const onAddCharacter = vi.fn();
    render(<AddCharacterModal {...defaultProps} onAddCharacter={onAddCharacter} />);
    await user.click(screen.getByText('Acheron'));
    expect(onAddCharacter).toHaveBeenCalledWith(availableCharacters[0]);
  });
});
