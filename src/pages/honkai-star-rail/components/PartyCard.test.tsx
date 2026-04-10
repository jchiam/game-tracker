import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartyCard } from '@/pages/honkai-star-rail/components/PartyCard';
import type { HsrParty } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';

const availableCharacters: Character[] = [
  {
    id: 'acheron',
    name: 'Acheron',
    element: 'Thunder',
    path: 'Nihility',
    imageUrl: '/acheron.webp',
  },
  { id: 'blade', name: 'Blade', element: 'Wind', path: 'Destruction', imageUrl: '/blade.webp' },
];

function makeParty(overrides: Partial<HsrParty> = {}): HsrParty {
  return {
    id: 'party-1',
    profileId: 'user-1',
    name: 'Test Party',
    notes: null,
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('PartyCard', () => {
  it('renders the party name', () => {
    render(
      <PartyCard
        party={makeParty()}
        availableCharacters={availableCharacters}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Test Party')).toBeInTheDocument();
  });

  it('renders 4 member slots', () => {
    render(
      <PartyCard
        party={makeParty()}
        availableCharacters={availableCharacters}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getAllByText('+')).toHaveLength(4);
  });

  it('renders character names for party members', () => {
    const party = makeParty({
      members: [
        { characterId: 'acheron', slotIndex: 0 },
        { characterId: 'blade', slotIndex: 1 },
      ],
    });
    render(
      <PartyCard
        party={party}
        availableCharacters={availableCharacters}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Acheron')).toBeInTheDocument();
    expect(screen.getByText('Blade')).toBeInTheDocument();
  });

  it('shows party notes when present', () => {
    const party = makeParty({ notes: 'Great team for MoC' });
    render(
      <PartyCard
        party={party}
        availableCharacters={availableCharacters}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Great team for MoC')).toBeInTheDocument();
  });

  it('does not render notes section when notes is null', () => {
    render(
      <PartyCard
        party={makeParty({ notes: null })}
        availableCharacters={availableCharacters}
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
        availableCharacters={availableCharacters}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit Party'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <PartyCard
        party={makeParty()}
        availableCharacters={availableCharacters}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByTitle('Delete Party'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  // --- Slot avatar CSS classes ---

  it('occupied slot avatar has an element-specific CSS class', () => {
    const party = makeParty({ members: [{ characterId: 'acheron', slotIndex: 0 }] });
    const { container } = render(
      <PartyCard
        party={party}
        availableCharacters={availableCharacters}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelector('.slot-avatar.element-thunder')).toBeInTheDocument();
  });

  it('empty slot avatar has the "empty" CSS class', () => {
    const { container } = render(
      <PartyCard
        party={makeParty()}
        availableCharacters={availableCharacters}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelectorAll('.slot-avatar.empty')).toHaveLength(4);
  });
});
