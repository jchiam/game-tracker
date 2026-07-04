import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddOperatorModal } from './AddOperatorModal';
import type { AeOperator } from '@/data/arknights-endfield/operators';
import type { AeTrackedOperator } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getAvatarUrl: (path: string) => path,
}));

// Config-wiring tests only — generic picker behaviour (search mechanics, empty
// state, image fallback) is covered by AddEntityModal.test.tsx.

const sampleOperators: AeOperator[] = [
  {
    id: 'ember',
    name: 'Ember',
    rarity: 6,
    class: 'Defender',
    element: 'Heat',
    weapon: 'Greatsword',
    imageUrl: '/ember.webp',
  },
  {
    id: 'ardelia',
    name: 'Ardelia',
    rarity: 5,
    class: 'Supporter',
    element: 'Nature',
    weapon: 'Arts Unit',
    imageUrl: '/ardelia.webp',
  },
];

const defaultProps = {
  availableOperators: sampleOperators,
  trackedOperators: [] as AeTrackedOperator[],
  onAddOperator: vi.fn(),
  onClose: vi.fn(),
};

describe('AddOperatorModal', () => {
  it('renders the AE title and operators', () => {
    render(<AddOperatorModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add operator/i })).toBeInTheDocument();
    expect(screen.getByText('Ember')).toBeInTheDocument();
  });

  it('renders class and element badges with AE modifier classes', () => {
    render(<AddOperatorModal {...defaultProps} />);
    expect(screen.getByText('Defender').className).toBe(
      'game-badge ae-class-badge ae-class-defender',
    );
    expect(screen.getByText('Heat').className).toBe('game-badge ae-element-badge ae-element-heat');
  });

  it('excludes tracked operators by id', () => {
    const tracked = [
      {
        ...sampleOperators[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 1,
        phase: 0,
        skillsMaxed: false,
        weaponName: null,
        weaponLevel: 1,
        weaponPreferences: [],
      },
    ] as AeTrackedOperator[];
    render(<AddOperatorModal {...defaultProps} trackedOperators={tracked} />);
    expect(screen.queryByText('Ember')).not.toBeInTheDocument();
    expect(screen.getByText('Ardelia')).toBeInTheDocument();
  });

  it('searches by weapon (secondary search key)', async () => {
    const user = userEvent.setup();
    render(<AddOperatorModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Search operators...'), 'Greatsword');
    expect(screen.getByText('Ember')).toBeInTheDocument();
    expect(screen.queryByText('Ardelia')).not.toBeInTheDocument();
  });

  it('passes the full operator to onAddOperator', async () => {
    const user = userEvent.setup();
    const onAddOperator = vi.fn();
    render(<AddOperatorModal {...defaultProps} onAddOperator={onAddOperator} />);
    await user.click(screen.getByText('Ember'));
    expect(onAddOperator).toHaveBeenCalledWith(sampleOperators[0]);
  });
});
