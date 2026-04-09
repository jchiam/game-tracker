import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddCharacterModal } from '@/pages/honkai-star-rail/components/AddCharacterModal';
import type { Character } from '@/data/honkai-star-rail/characters';
import type { HsrTrackedCharacter } from '@/types';

const availableCharacters: Character[] = [
  { id: 'acheron', name: 'Acheron', element: 'Thunder', path: 'Nihility', imageUrl: '/acheron.webp' },
  { id: 'blade', name: 'Blade', element: 'Wind', path: 'Destruction', imageUrl: '/blade.webp' },
  { id: 'kafka', name: 'Kafka', element: 'Thunder', path: 'Nihility', imageUrl: '/kafka.webp' },
];

const emptyTracked: HsrTrackedCharacter[] = [];

describe('AddCharacterModal', () => {
  it('renders the modal title', () => {
    render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={emptyTracked}
        onAddCharacter={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /add character/i })).toBeInTheDocument();
  });

  it('renders all available characters', () => {
    render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={emptyTracked}
        onAddCharacter={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Acheron')).toBeInTheDocument();
    expect(screen.getByText('Blade')).toBeInTheDocument();
    expect(screen.getByText('Kafka')).toBeInTheDocument();
  });

  it('filters out already-tracked characters', () => {
    const tracked = [
      {
        ...availableCharacters[0],
        dbId: 'db-1',
        isFavorited: false,
        level: 60,
        tracesAttained: false,
        relics: { head: null, hands: null, body: null, feet: null, sphere: null, rope: null },
        buildPreferences: { mainStats: { body: [], feet: [], sphere: [], rope: [] }, subStats: [] },
      },
    ] as HsrTrackedCharacter[];
    render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={tracked}
        onAddCharacter={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('Acheron')).not.toBeInTheDocument();
    expect(screen.getByText('Blade')).toBeInTheDocument();
  });

  it('filters characters by search input', async () => {
    const user = userEvent.setup();
    render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={emptyTracked}
        onAddCharacter={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/search/i), 'Kafka');
    expect(screen.getByText('Kafka')).toBeInTheDocument();
    expect(screen.queryByText('Acheron')).not.toBeInTheDocument();
    expect(screen.queryByText('Blade')).not.toBeInTheDocument();
  });

  it('shows no-results message when search finds nothing', async () => {
    const user = userEvent.setup();
    render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={emptyTracked}
        onAddCharacter={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/search/i), 'zzznomatch');
    expect(screen.getByText(/no characters found/i)).toBeInTheDocument();
  });

  it('calls onAddCharacter when a character is clicked', () => {
    const onAddCharacter = vi.fn();
    render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={emptyTracked}
        onAddCharacter={onAddCharacter}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Blade'));
    expect(onAddCharacter).toHaveBeenCalledWith(availableCharacters[1]);
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={emptyTracked}
        onAddCharacter={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={emptyTracked}
        onAddCharacter={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(container.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <AddCharacterModal
        availableCharacters={availableCharacters}
        trackedCharacters={emptyTracked}
        onAddCharacter={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(container.querySelector('.modal-content')!);
    expect(onClose).not.toHaveBeenCalled();
  });
});
