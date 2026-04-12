import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartyCard } from '@/pages/reverse1999/components/PartyCard';
import type { R1999Party } from '@/types';
import type { Arcanist } from '@/data/reverse1999/arcanists';

const availableArcanists: Arcanist[] = [
  {
    id: 'an_an',
    name: 'An-an Lee',
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: '/an_an.webp',
  },
  {
    id: 'vertin',
    name: 'Vertin',
    afflatus: 'Mineral',
    damageType: 'Reality',
    imageUrl: '/vertin.webp',
  },
];

function makeParty(overrides: Partial<R1999Party> = {}): R1999Party {
  return {
    id: 'party-1',
    profileId: 'user-1',
    name: 'Test Lineup',
    notes: null,
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('PartyCard (R1999)', () => {
  it('renders the party name', () => {
    render(
      <PartyCard
        party={makeParty()}
        availableArcanists={availableArcanists}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Test Lineup')).toBeInTheDocument();
  });

  it('renders 4 member slots', () => {
    render(
      <PartyCard
        party={makeParty()}
        availableArcanists={availableArcanists}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getAllByText('+')).toHaveLength(4);
  });

  it('renders arcanist names for party members', () => {
    const party = makeParty({
      members: [
        { arcanistId: 'an_an', slotIndex: 0 },
        { arcanistId: 'vertin', slotIndex: 1 },
      ],
    });
    render(
      <PartyCard
        party={party}
        availableArcanists={availableArcanists}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('An-an Lee')).toBeInTheDocument();
    expect(screen.getByText('Vertin')).toBeInTheDocument();
  });

  it('shows party notes when present', () => {
    const party = makeParty({ notes: 'Great lineup for Limbo' });
    render(
      <PartyCard
        party={party}
        availableArcanists={availableArcanists}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Great lineup for Limbo')).toBeInTheDocument();
  });

  it('does not render notes section when notes is null', () => {
    render(
      <PartyCard
        party={makeParty({ notes: null })}
        availableArcanists={availableArcanists}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <PartyCard
        party={makeParty()}
        availableArcanists={availableArcanists}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit Lineup'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <PartyCard
        party={makeParty()}
        availableArcanists={availableArcanists}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByTitle('Delete Lineup'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('occupied slot avatar has an afflatus-specific CSS class', () => {
    const party = makeParty({ members: [{ arcanistId: 'an_an', slotIndex: 0 }] });
    const { container } = render(
      <PartyCard
        party={party}
        availableArcanists={availableArcanists}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelector('.slot-avatar.afflatus-star')).toBeInTheDocument();
  });

  it('empty slot avatar has the "empty" CSS class', () => {
    const { container } = render(
      <PartyCard
        party={makeParty()}
        availableArcanists={availableArcanists}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelectorAll('.slot-avatar.empty')).toHaveLength(4);
  });
});
