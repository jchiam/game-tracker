import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartyEditorModal } from './PartyEditorModal';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';
import type { EndfieldParty } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

vi.mock('@/utils/toast', () => ({
  addToast: vi.fn(),
}));

function makeParty(overrides: Partial<EndfieldParty> = {}): EndfieldParty {
  return {
    id: 'p1',
    profileId: 'user-1',
    name: 'Existing Squad',
    notes: 'Some notes',
    members: [{ operatorId: 'ember', slotIndex: 0 }],
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('PartyEditorModal', () => {
  const defaultProps = {
    availableOperators: ALL_OPERATORS,
    onSave: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
  };

  // --- Create mode ---

  it('renders create mode by default', () => {
    render(<PartyEditorModal {...defaultProps} />);
    expect(screen.getByText('Create New Squad')).toBeInTheDocument();
  });

  it('renders 4 empty slots in create mode', () => {
    const { container } = render(<PartyEditorModal {...defaultProps} />);
    expect(container.querySelectorAll('.builder-slot.empty')).toHaveLength(4);
  });

  it('shows warning toast on empty name', async () => {
    const { addToast } = await import('@/utils/toast');
    const user = userEvent.setup();
    render(<PartyEditorModal {...defaultProps} />);
    await user.click(screen.getByText('Save Squad'));
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('name'), 'warning');
  });

  it('calls onSave with name and members', async () => {
    const user = userEvent.setup();
    render(<PartyEditorModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('e.g. Boss Rush Team'), 'My Team');
    await user.click(screen.getByText('Save Squad'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Team', members: [] }),
    );
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<PartyEditorModal {...defaultProps} />);
    await user.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // --- Edit mode ---

  it('renders edit mode when party prop provided', () => {
    render(<PartyEditorModal {...defaultProps} party={makeParty()} />);
    expect(screen.getByText('Edit Squad')).toBeInTheDocument();
  });

  it('pre-fills name and notes in edit mode', () => {
    render(<PartyEditorModal {...defaultProps} party={makeParty()} />);
    expect(screen.getByDisplayValue('Existing Squad')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Some notes')).toBeInTheDocument();
  });

  it('pre-fills existing members in edit mode', () => {
    const { container } = render(<PartyEditorModal {...defaultProps} party={makeParty()} />);
    expect(container.querySelectorAll('.builder-slot.occupied')).toHaveLength(1);
    expect(container.querySelectorAll('.builder-slot.empty')).toHaveLength(3);
  });

  // --- Slot interaction ---

  it('opens operator picker when an empty slot is clicked', () => {
    const { container } = render(<PartyEditorModal {...defaultProps} />);
    const emptySlot = container.querySelector('.builder-slot.empty');
    fireEvent.click(emptySlot!);
    expect(screen.getByPlaceholderText('Search operator...')).toBeInTheDocument();
  });

  it('adds operator to slot when picked from picker', () => {
    const { container } = render(<PartyEditorModal {...defaultProps} />);
    const emptySlot = container.querySelector('.builder-slot.empty');
    fireEvent.click(emptySlot!);
    fireEvent.click(screen.getByText('Ember'));
    expect(container.querySelectorAll('.builder-slot.occupied')).toHaveLength(1);
  });

  it('filters picker by search term', async () => {
    const user = userEvent.setup();
    const { container } = render(<PartyEditorModal {...defaultProps} />);
    const emptySlot = container.querySelector('.builder-slot.empty');
    fireEvent.click(emptySlot!);
    await user.type(screen.getByPlaceholderText('Search operator...'), 'Ember');
    const pickerItems = container.querySelectorAll('.picker-item');
    expect(pickerItems.length).toBeGreaterThan(0);
    expect(screen.getByText('Ember')).toBeInTheDocument();
  });

  it('closes picker when cancel button clicked', () => {
    const { container } = render(<PartyEditorModal {...defaultProps} />);
    const emptySlot = container.querySelector('.builder-slot.empty');
    fireEvent.click(emptySlot!);
    expect(screen.getByPlaceholderText('Search operator...')).toBeInTheDocument();
    fireEvent.click(container.querySelector('.cancel-picker')!);
    expect(screen.queryByPlaceholderText('Search operator...')).not.toBeInTheDocument();
  });

  it('removes a member when the remove button on an occupied slot is clicked', () => {
    const { container } = render(<PartyEditorModal {...defaultProps} party={makeParty()} />);
    expect(container.querySelectorAll('.builder-slot.occupied')).toHaveLength(1);
    const removeBtn = container.querySelector('.remove-member-btn');
    fireEvent.click(removeBtn!);
    expect(container.querySelectorAll('.builder-slot.occupied')).toHaveLength(0);
  });

  it('excludes already-selected operators from picker', () => {
    const { container } = render(<PartyEditorModal {...defaultProps} party={makeParty()} />);
    const emptySlot = container.querySelector('.builder-slot.empty');
    fireEvent.click(emptySlot!);
    const pickerNames = Array.from(container.querySelectorAll('.picker-item span')).map(
      (el) => el.textContent,
    );
    expect(pickerNames).not.toContain('Ember');
  });
});
