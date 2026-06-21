import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartyCard } from './PartyCard';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';
import type { EndfieldParty } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
}));

function makeParty(overrides: Partial<EndfieldParty> = {}): EndfieldParty {
  return {
    id: 'p1',
    profileId: 'user-1',
    name: 'Squad A',
    notes: null,
    members: [],
    createdAt: '2026-01-01',
    ...overrides,
  };
}

describe('PartyCard', () => {
  const defaultProps = {
    party: makeParty({
      notes: 'Main team',
      members: [
        { operatorId: 'ember', slotIndex: 0 },
        { operatorId: 'rossi', slotIndex: 1 },
      ],
    }),
    availableOperators: ALL_OPERATORS,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders party name', () => {
    render(<PartyCard {...defaultProps} />);
    expect(screen.getByText('Squad A')).toBeInTheDocument();
  });

  it('renders party notes when present', () => {
    render(<PartyCard {...defaultProps} />);
    expect(screen.getByText('Main team')).toBeInTheDocument();
  });

  it('does not render notes when null', () => {
    render(<PartyCard {...defaultProps} party={makeParty({ notes: null })} />);
    expect(screen.queryByText('Main team')).not.toBeInTheDocument();
  });

  it('renders member images for occupied slots', () => {
    render(<PartyCard {...defaultProps} />);
    expect(screen.getByAltText('Ember')).toBeInTheDocument();
    expect(screen.getByAltText('Rossi')).toBeInTheDocument();
  });

  it('renders member names below portraits', () => {
    render(<PartyCard {...defaultProps} />);
    expect(screen.getByText('Ember')).toBeInTheDocument();
    expect(screen.getByText('Rossi')).toBeInTheDocument();
  });

  it('renders 4 slot items total', () => {
    const { container } = render(<PartyCard {...defaultProps} />);
    expect(container.querySelectorAll('.endfield-slot-item')).toHaveLength(4);
  });

  it('shows plus placeholder for empty slots', () => {
    render(<PartyCard {...defaultProps} party={makeParty()} />);
    const plusIcons = screen.getAllByText('+');
    expect(plusIcons).toHaveLength(4);
  });

  it('empty slots have "empty" CSS class on avatar', () => {
    const { container } = render(<PartyCard {...defaultProps} party={makeParty()} />);
    expect(container.querySelectorAll('.endfield-slot-avatar.empty')).toHaveLength(4);
  });

  it('calls onEdit when edit button clicked', () => {
    render(<PartyCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Edit Squad'));
    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button clicked', () => {
    render(<PartyCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Delete Squad'));
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });
});
