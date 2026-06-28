import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddOperatorModal } from './AddOperatorModal';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';

vi.mock('@/lib/imagekit', () => ({
  getAvatarUrl: (path: string) => path,
}));

describe('AddOperatorModal', () => {
  const defaultProps = {
    availableOperators: ALL_OPERATORS,
    trackedOperators: [],
    onAddOperator: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders the modal with operator list', () => {
    render(<AddOperatorModal {...defaultProps} />);
    expect(screen.getByText('Add Operator')).toBeInTheDocument();
    expect(screen.getByText('Ember')).toBeInTheDocument();
  });

  it('filters operators already tracked', () => {
    const tracked = [
      {
        ...ALL_OPERATORS[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 1,
        phase: 0,
        skillsMaxed: false,
        weaponName: null,
        weaponLevel: 1,
        weaponPreferences: [],
      },
    ];
    render(<AddOperatorModal {...defaultProps} trackedOperators={tracked} />);
    expect(screen.queryByText(ALL_OPERATORS[0].name)).not.toBeInTheDocument();
  });

  it('calls onAddOperator when an operator is clicked', async () => {
    const user = userEvent.setup();
    render(<AddOperatorModal {...defaultProps} />);
    const firstItem = screen.getAllByRole('button', { name: '+' })[0];
    await user.click(firstItem);
    expect(defaultProps.onAddOperator).toHaveBeenCalled();
  });

  it('filters by search term', async () => {
    const user = userEvent.setup();
    render(<AddOperatorModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Search operators...'), 'Ember');
    expect(screen.getByText('Ember')).toBeInTheDocument();
  });
});
