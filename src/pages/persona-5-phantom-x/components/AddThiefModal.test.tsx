import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddThiefModal } from './AddThiefModal';
import type { P5xThief } from '@/data/persona-5-phantom-x/thieves';
import type { P5xTrackedThief } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getAvatarUrl: (path: string) => path,
}));

// Config-wiring tests only — generic picker behaviour (search mechanics, empty
// state, image fallback) is covered by AddEntityModal.test.tsx.

const sampleThieves: P5xThief[] = [
  {
    id: 'ann-takamaki',
    name: 'Ann Takamaki',
    codename: 'Panther',
    personaName: 'Carmen',
    rarity: 5,
    role: 'Multi-target',
    element: 'Fire',
    imageUrl: '/ann-takamaki.webp',
  },
  {
    id: 'lufel',
    name: 'Lufel',
    codename: 'Cattle',
    personaName: 'Janosik',
    rarity: 4,
    role: 'Healer',
    element: 'Fire',
    imageUrl: '/lufel.webp',
  },
];

const defaultProps = {
  availableThieves: sampleThieves,
  trackedThieves: [] as P5xTrackedThief[],
  onAddThief: vi.fn(),
  onClose: vi.fn(),
};

describe('AddThiefModal', () => {
  it('renders the P5X title and thieves', () => {
    render(<AddThiefModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add thief/i })).toBeInTheDocument();
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();
  });

  it('renders role and element badges with P5X modifier classes', () => {
    render(<AddThiefModal {...defaultProps} />);
    expect(screen.getByText('Multi-target').className).toBe(
      'game-badge p5x-role-badge p5x-role-multi-target',
    );
    expect(screen.getAllByText('Fire')[0].className).toBe(
      'game-badge p5x-element-badge p5x-element-fire',
    );
  });

  it('excludes tracked thieves by id', () => {
    const tracked = [
      {
        ...sampleThieves[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 1,
        awareness: 0,
      },
    ] as P5xTrackedThief[];
    render(<AddThiefModal {...defaultProps} trackedThieves={tracked} />);
    expect(screen.queryByText('Ann Takamaki')).not.toBeInTheDocument();
    expect(screen.getByText('Lufel')).toBeInTheDocument();
  });

  it('searches by codename (secondary search key)', async () => {
    const user = userEvent.setup();
    render(<AddThiefModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Search thieves...'), 'Panther');
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();
    expect(screen.queryByText('Lufel')).not.toBeInTheDocument();
  });

  it('searches by persona name', async () => {
    const user = userEvent.setup();
    render(<AddThiefModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Search thieves...'), 'Janosik');
    expect(screen.getByText('Lufel')).toBeInTheDocument();
    expect(screen.queryByText('Ann Takamaki')).not.toBeInTheDocument();
  });

  it('passes the full thief to onAddThief', async () => {
    const user = userEvent.setup();
    const onAddThief = vi.fn();
    render(<AddThiefModal {...defaultProps} onAddThief={onAddThief} />);
    await user.click(screen.getByText('Ann Takamaki'));
    expect(onAddThief).toHaveBeenCalledWith(sampleThieves[0]);
  });
});
