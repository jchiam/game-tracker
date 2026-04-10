import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartyEditorModal } from '@/pages/honkai-star-rail/components/PartyEditorModal';
import type { HsrParty } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';

vi.mock('@/utils/toast', () => ({ addToast: vi.fn() }));
import * as toastModule from '@/utils/toast';

const availableCharacters: Character[] = [
  {
    id: 'acheron',
    name: 'Acheron',
    element: 'Thunder',
    path: 'Nihility',
    imageUrl: '/acheron.webp',
  },
  { id: 'blade', name: 'Blade', element: 'Wind', path: 'Destruction', imageUrl: '/blade.webp' },
  { id: 'kafka', name: 'Kafka', element: 'Thunder', path: 'Nihility', imageUrl: '/kafka.webp' },
];

function makeParty(overrides: Partial<HsrParty> = {}): HsrParty {
  return {
    id: 'party-1',
    profileId: 'user-1',
    name: 'My Team',
    notes: 'Some notes',
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('PartyEditorModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "Create New Party" title when no party is provided', () => {
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /create new party/i })).toBeInTheDocument();
  });

  it('shows "Edit Party" title when editing an existing party', () => {
    render(
      <PartyEditorModal
        party={makeParty()}
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /edit party/i })).toBeInTheDocument();
  });

  it('pre-fills name and notes when editing an existing party', () => {
    render(
      <PartyEditorModal
        party={makeParty({ name: 'Chaos Team', notes: 'Best team' })}
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Chaos Team')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Best team')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close (✕) button is clicked', () => {
    const onClose = vi.fn();
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a warning toast and does not call onSave when name is empty', () => {
    const onSave = vi.fn();
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /save party/i }));
    expect(toastModule.addToast).toHaveBeenCalledWith('Please enter a party name.', 'warning');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with name and members when saved with a valid name', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/memory of chaos/i), 'New Team');
    fireEvent.click(screen.getByRole('button', { name: /save party/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Team', members: [] }));
  });

  it('renders 4 team slots', () => {
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Slot 1')).toBeInTheDocument();
    expect(screen.getByText('Slot 4')).toBeInTheDocument();
  });

  it('opens character picker when a slot is clicked', () => {
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    expect(screen.getByPlaceholderText(/search character/i)).toBeInTheDocument();
  });

  it('selects a character into the slot when clicked from the picker', () => {
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.click(screen.getByText('Acheron'));
    expect(screen.getByText('Acheron')).toBeInTheDocument();
    // Picker should close after selection
    expect(screen.queryByPlaceholderText(/search character/i)).not.toBeInTheDocument();
  });

  it('removes a member from a slot when the remove button is clicked', () => {
    const { container } = render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.click(screen.getByText('Acheron'));
    // Use class selector to target the member-removal button (not the modal close button)
    fireEvent.click(container.querySelector('.remove-member-btn')!);
    expect(screen.getByText('Slot 1')).toBeInTheDocument();
  });

  it('closes the picker when cancel is clicked', () => {
    const { container } = render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    expect(screen.getByPlaceholderText(/search character/i)).toBeInTheDocument();
    // Use class selector to target the picker cancel button (not the footer cancel)
    fireEvent.click(container.querySelector('.cancel-picker')!);
    expect(screen.queryByPlaceholderText(/search character/i)).not.toBeInTheDocument();
  });

  // --- Picker search filtering ---

  it('filters the character picker list by search term', async () => {
    const user = userEvent.setup();
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    await user.type(screen.getByPlaceholderText(/search character/i), 'Ach');
    expect(screen.getByText('Acheron')).toBeInTheDocument();
    expect(screen.queryByText('Blade')).not.toBeInTheDocument();
    expect(screen.queryByText('Kafka')).not.toBeInTheDocument();
  });

  it('excludes a character already assigned to another slot from the picker', () => {
    const { container } = render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // Assign Acheron to slot 1
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.click(screen.getByText('Acheron'));
    // Open picker for slot 2 — Acheron is assigned and should not appear as a selectable picker item
    fireEvent.click(screen.getByText('Slot 2'));
    const pickerItemTexts = Array.from(container.querySelectorAll('.picker-item span')).map(
      (el) => el.textContent,
    );
    expect(pickerItemTexts).not.toContain('Acheron');
  });

  // --- Save payload ---

  it('includes notes in the onSave payload', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/memory of chaos/i), 'My Team');
    await user.type(screen.getByPlaceholderText(/strategy/i), 'Rush the boss');
    fireEvent.click(screen.getByRole('button', { name: /save party/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Team', notes: 'Rush the boss' }),
    );
  });

  it('passes the existing party id when saving an edit', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <PartyEditorModal
        party={makeParty({ id: 'existing-id', name: 'Old Name' })}
        availableCharacters={availableCharacters}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    // Clear and retype name
    const nameInput = screen.getByDisplayValue('Old Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    fireEvent.click(screen.getByRole('button', { name: /save party/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'existing-id', name: 'New Name' }),
    );
  });

  // --- Modal overlay and slot active state ---

  it('calls onClose when the modal overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(container.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('active slot gets the "active" CSS class when clicked', () => {
    const { container } = render(
      <PartyEditorModal
        availableCharacters={availableCharacters}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    const slots = container.querySelectorAll('.builder-slot');
    expect(slots[0]).toHaveClass('active');
    expect(slots[1]).not.toHaveClass('active');
  });
});
