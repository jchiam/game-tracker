import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddCharacterModal } from '@/pages/neverness-to-everness/components/AddCharacterModal';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';
import type { N2ETrackedCharacter } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getAvatarUrl: (path: string) => path,
}));

// Config-wiring tests only — generic picker behaviour (search mechanics, empty
// state, image fallback) is covered by AddEntityModal.test.tsx.

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
  {
    id: 'nanally',
    sourceId: 'nanally',
    name: 'Nanally',
    rarity: 'S',
    esperType: 'Strength',
    arcType: 'Condensate',
    roles: ['Support', 'Healer'],
    imageUrl: '/nanally.webp',
  },
];

const defaultProps = {
  availableCharacters: sampleChars,
  trackedCharacters: [] as N2ETrackedCharacter[],
  onAddCharacter: vi.fn(),
  onClose: vi.fn(),
};

describe('AddCharacterModal (N2E)', () => {
  it('renders the N2E title and espers', () => {
    render(<AddCharacterModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add esper/i })).toBeInTheDocument();
    expect(screen.getByText('Baicang')).toBeInTheDocument();
  });

  it('renders esper and arc badges with N2E modifier classes', () => {
    render(<AddCharacterModal {...defaultProps} />);
    expect(screen.getByText('Incantation').className).toBe(
      'game-badge esper-badge esper-incantation',
    );
    expect(screen.getByText('Burst').className).toBe('game-badge arc-badge arc-burst');
  });

  it('excludes tracked espers by id', () => {
    const tracked = [
      {
        ...sampleChars[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 40,
      },
    ] as N2ETrackedCharacter[];
    render(<AddCharacterModal {...defaultProps} trackedCharacters={tracked} />);
    expect(screen.queryByText('Baicang')).not.toBeInTheDocument();
    expect(screen.getByText('Nanally')).toBeInTheDocument();
  });

  it('searches by role (secondary search key)', async () => {
    const user = userEvent.setup();
    render(<AddCharacterModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Search espers...'), 'Healer');
    expect(screen.getByText('Nanally')).toBeInTheDocument();
    expect(screen.queryByText('Baicang')).not.toBeInTheDocument();
  });

  it('passes the full esper to onAddCharacter', async () => {
    const user = userEvent.setup();
    const onAddCharacter = vi.fn();
    render(<AddCharacterModal {...defaultProps} onAddCharacter={onAddCharacter} />);
    await user.click(screen.getByText('Baicang'));
    expect(onAddCharacter).toHaveBeenCalledWith(sampleChars[0]);
  });
});
