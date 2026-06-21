import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OperatorCard } from './OperatorCard';
import type { EndfieldTrackedOperator } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
}));

const mockOperator: EndfieldTrackedOperator = {
  id: 'ember',
  name: 'Ember',
  rarity: 6,
  class: 'Defender',
  element: 'Heat',
  weapon: 'Greatsword',
  imageUrl: '/assets/arknights-endfield/operators/ember.webp',
  dbId: 'db-1',
  isFavorited: false,
  level: 45,
  potential: 3,
};

describe('OperatorCard', () => {
  const defaultProps = {
    operator: mockOperator,
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdatePotential: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  it('renders operator name and badges', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByText('Ember')).toBeInTheDocument();
    expect(screen.getByText('Defender')).toBeInTheDocument();
    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.getByText('Greatsword')).toBeInTheDocument();
  });

  it('renders level and potential stat chips', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByText('Lv 45')).toBeInTheDocument();
    expect(screen.getAllByText('P3').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onToggleFavorite when star button clicked', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Favorite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('ember', true);
  });

  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Remove Operator'));
    expect(defaultProps.onRemove).toHaveBeenCalled();
  });

  it('renders rarity stars for 6-star', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByText('★★★★★★')).toBeInTheDocument();
  });
});
