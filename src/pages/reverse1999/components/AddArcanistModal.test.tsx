import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddArcanistModal } from '@/pages/reverse1999/components/AddArcanistModal';
import type { Arcanist } from '@/data/reverse1999/arcanists';
import type { R1999TrackedArcanist } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getAvatarUrl: (path: string) => path,
}));

// Config-wiring tests only — generic picker behaviour (search mechanics, empty
// state, image fallback) is covered by AddEntityModal.test.tsx.

const availableArcanists: Arcanist[] = [
  {
    id: '37',
    sourceId: '37',
    name: '37',
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: '/37.webp',
    hasEuphoria: false,
  },
  {
    id: 'regulus',
    sourceId: 'regulus',
    name: 'Regulus',
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: '/regulus.webp',
    hasEuphoria: true,
  },
  {
    id: 'druvis-iii',
    sourceId: 'druvis-iii',
    name: 'Druvis III',
    afflatus: 'Plant',
    damageType: 'Mental',
    imageUrl: '/druvis.webp',
    hasEuphoria: false,
  },
];

const defaultProps = {
  availableArcanists,
  trackedArcanists: [] as R1999TrackedArcanist[],
  onAddArcanist: vi.fn(),
  onClose: vi.fn(),
};

describe('AddArcanistModal', () => {
  it('renders the R1999 title and arcanists', () => {
    render(<AddArcanistModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add arcanist/i })).toBeInTheDocument();
    expect(screen.getByText('Regulus')).toBeInTheDocument();
  });

  it('renders afflatus and damage badges with R1999 modifier classes', () => {
    render(<AddArcanistModal {...defaultProps} />);
    expect(screen.getByText('Plant').className).toBe('game-badge afflatus-badge afflatus-plant');
    expect(screen.getAllByText('Mental')[0].className).toBe(
      'game-badge damage-badge damage-mental',
    );
  });

  it('excludes tracked arcanists by id', () => {
    const tracked = [
      {
        ...availableArcanists[1],
        dbId: 'db-1',
        isFavorited: false,
        level: 30,
      },
    ] as R1999TrackedArcanist[];
    render(<AddArcanistModal {...defaultProps} trackedArcanists={tracked} />);
    expect(screen.queryByText('Regulus')).not.toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
  });

  it('searches by afflatus (secondary search key)', async () => {
    const user = userEvent.setup();
    render(<AddArcanistModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Search arcanists...'), 'Plant');
    expect(screen.getByText('Druvis III')).toBeInTheDocument();
    expect(screen.queryByText('Regulus')).not.toBeInTheDocument();
  });

  it('passes the full arcanist to onAddArcanist', async () => {
    const user = userEvent.setup();
    const onAddArcanist = vi.fn();
    render(<AddArcanistModal {...defaultProps} onAddArcanist={onAddArcanist} />);
    await user.click(screen.getByText('Regulus'));
    expect(onAddArcanist).toHaveBeenCalledWith(availableArcanists[1]);
  });
});
