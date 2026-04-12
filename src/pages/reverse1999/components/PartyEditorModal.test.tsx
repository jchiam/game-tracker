import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartyEditorModal } from '@/pages/reverse1999/components/PartyEditorModal';
import type { R1999Party } from '@/types';
import type { Arcanist } from '@/data/reverse1999/arcanists';

vi.mock('@/utils/toast', () => ({ addToast: vi.fn() }));
import * as toastModule from '@/utils/toast';

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
  {
    id: 'regulus',
    name: 'Regulus',
    afflatus: 'Star',
    damageType: 'Reality',
    imageUrl: '/regulus.webp',
  },
];

function makeParty(overrides: Partial<R1999Party> = {}): R1999Party {
  return {
    id: 'party-1',
    profileId: 'user-1',
    name: 'My Lineup',
    notes: 'Some notes',
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('PartyEditorModal (R1999)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "Create New Lineup" title when no party is provided', () => {
    render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /create new lineup/i })).toBeInTheDocument();
  });

  it('shows "Edit Lineup" title when editing an existing party', () => {
    render(
      <PartyEditorModal
        party={makeParty()}
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /edit lineup/i })).toBeInTheDocument();
  });

  it('pre-fills name and notes when editing an existing party', () => {
    render(
      <PartyEditorModal
        party={makeParty({ name: 'Limbo Team', notes: 'Best lineup' })}
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Limbo Team')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Best lineup')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
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
        availableArcanists={availableArcanists}
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
        availableArcanists={availableArcanists}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /save lineup/i }));
    expect(toastModule.addToast).toHaveBeenCalledWith('Please enter a lineup name.', 'warning');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with name and members when saved with a valid name', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/limbo of ruin/i), 'New Lineup');
    fireEvent.click(screen.getByRole('button', { name: /save lineup/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Lineup', members: [] }),
    );
  });

  it('renders 4 team slots', () => {
    render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Slot 1')).toBeInTheDocument();
    expect(screen.getByText('Slot 4')).toBeInTheDocument();
  });

  it('opens arcanist picker when a slot is clicked', () => {
    render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    expect(screen.getByPlaceholderText(/search arcanist/i)).toBeInTheDocument();
  });

  it('selects an arcanist into the slot when clicked from the picker', () => {
    render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.click(screen.getByText('An-an Lee'));
    expect(screen.getByText('An-an Lee')).toBeInTheDocument();
    // Picker should close after selection
    expect(screen.queryByPlaceholderText(/search arcanist/i)).not.toBeInTheDocument();
  });

  it('removes a member from a slot when the remove button is clicked', () => {
    const { container } = render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.click(screen.getByText('An-an Lee'));
    fireEvent.click(container.querySelector('.remove-member-btn')!);
    expect(screen.getByText('Slot 1')).toBeInTheDocument();
  });

  it('closes the picker when cancel is clicked', () => {
    const { container } = render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    expect(screen.getByPlaceholderText(/search arcanist/i)).toBeInTheDocument();
    fireEvent.click(container.querySelector('.cancel-picker')!);
    expect(screen.queryByPlaceholderText(/search arcanist/i)).not.toBeInTheDocument();
  });

  it('filters the arcanist picker list by search term', async () => {
    const user = userEvent.setup();
    render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Slot 1'));
    await user.type(screen.getByPlaceholderText(/search arcanist/i), 'An');
    expect(screen.getByText('An-an Lee')).toBeInTheDocument();
    expect(screen.queryByText('Vertin')).not.toBeInTheDocument();
    expect(screen.queryByText('Regulus')).not.toBeInTheDocument();
  });

  it('excludes an arcanist already assigned to another slot from the picker', () => {
    const { container } = render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // Assign An-an Lee to slot 1
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.click(screen.getByText('An-an Lee'));
    // Open picker for slot 2 — An-an Lee should not appear
    fireEvent.click(screen.getByText('Slot 2'));
    const pickerItemTexts = Array.from(container.querySelectorAll('.picker-item span')).map(
      (el) => el.textContent,
    );
    expect(pickerItemTexts).not.toContain('An-an Lee');
  });

  it('includes notes in the onSave payload', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/limbo of ruin/i), 'My Lineup');
    await user.type(screen.getByPlaceholderText(/strategy/i), 'Rush the boss');
    fireEvent.click(screen.getByRole('button', { name: /save lineup/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Lineup', notes: 'Rush the boss' }),
    );
  });

  it('passes the existing party id when saving an edit', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <PartyEditorModal
        party={makeParty({ id: 'existing-id', name: 'Old Name' })}
        availableArcanists={availableArcanists}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    const nameInput = screen.getByDisplayValue('Old Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    fireEvent.click(screen.getByRole('button', { name: /save lineup/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'existing-id', name: 'New Name' }),
    );
  });

  it('calls onClose when the modal overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <PartyEditorModal
        availableArcanists={availableArcanists}
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
        availableArcanists={availableArcanists}
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
