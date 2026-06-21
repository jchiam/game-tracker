import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartyCard } from './PartyCard';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';
import type { EndfieldParty } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
}));

const mockParty: EndfieldParty = {
  id: 'p1',
  profileId: 'user-1',
  name: 'Squad A',
  notes: 'Main team',
  members: [
    { operatorId: 'ember', slotIndex: 0 },
    { operatorId: 'rossi', slotIndex: 1 },
  ],
  createdAt: '2026-01-01',
};

describe('PartyCard', () => {
  const defaultProps = {
    party: mockParty,
    availableOperators: ALL_OPERATORS,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders party name and notes', () => {
    render(<PartyCard {...defaultProps} />);
    expect(screen.getByText('Squad A')).toBeInTheDocument();
    expect(screen.getByText('Main team')).toBeInTheDocument();
  });

  it('renders member images', () => {
    render(<PartyCard {...defaultProps} />);
    expect(screen.getByAltText('Ember')).toBeInTheDocument();
    expect(screen.getByAltText('Rossi')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<PartyCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit Squad'));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it('calls onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<PartyCard {...defaultProps} />);
    await user.click(screen.getByTitle('Delete Squad'));
    expect(defaultProps.onDelete).toHaveBeenCalled();
  });
});
