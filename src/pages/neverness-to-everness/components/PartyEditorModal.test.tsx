import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartyEditorModal } from '@/pages/neverness-to-everness/components/PartyEditorModal';
import type { N2EParty } from '@/types';
import type { N2ECharacter } from '@/data/neverness-to-everness/characters';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => url),
  getAvatarUrl: vi.fn((url: string) => url),
}));

vi.mock('@/utils/toast', () => ({
  addToast: vi.fn(),
}));

import { addToast } from '@/utils/toast';

const sampleChars: N2ECharacter[] = [
  {
    id: 'baicang',
    name: 'Baicang',
    rarity: 'S',
    esperType: 'Incantation',
    arcType: 'Burst',
    roles: ['DPS'],
    imageUrl: '/baicang.webp',
  },
  {
    id: 'jade',
    name: 'Jade',
    rarity: 'A',
    esperType: 'Cosmos',
    arcType: 'Solid',
    roles: ['Support'],
    imageUrl: '/jade.webp',
  },
];

const existingParty: N2EParty = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Alpha Team',
  notes: 'Some notes',
  tier: 'S',
  isFavorited: false,
  members: [{ characterId: 'baicang', slotIndex: 0 }],
  createdAt: new Date().toISOString(),
};

const defaultProps = {
  availableCharacters: sampleChars,
  onSave: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
};

describe('PartyEditorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create mode title when no party provided', () => {
    render(<PartyEditorModal {...defaultProps} />);
    expect(screen.getByText(/create new lineup/i)).toBeInTheDocument();
  });

  it('renders edit mode title when party is provided', () => {
    render(<PartyEditorModal party={existingParty} {...defaultProps} />);
    expect(screen.getByText(/edit lineup/i)).toBeInTheDocument();
  });

  it('pre-fills form fields in edit mode', () => {
    render(<PartyEditorModal party={existingParty} {...defaultProps} />);
    const nameInput = document.querySelector('input[name="lineup-name"]') as HTMLInputElement;
    expect(nameInput.value).toBe('Alpha Team');
    expect(screen.getByText('Baicang')).toBeInTheDocument();
  });

  it('renders 4 team slots', () => {
    const { container } = render(<PartyEditorModal {...defaultProps} />);
    expect(container.querySelectorAll('.builder-slot')).toHaveLength(4);
  });

  it('opens character picker when a slot is clicked', () => {
    render(<PartyEditorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Slot 1'));
    expect(screen.getByPlaceholderText(/search esper/i)).toBeInTheDocument();
  });

  it('selects a character from picker into the slot', () => {
    render(<PartyEditorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.click(screen.getByText('Baicang'));
    expect(screen.queryByPlaceholderText(/search esper/i)).not.toBeInTheDocument();
    expect(screen.getByText('Baicang')).toBeInTheDocument();
  });

  it('removes a member when remove button is clicked', () => {
    render(<PartyEditorModal party={existingParty} {...defaultProps} />);
    const removeBtns = document.querySelectorAll('.remove-member-btn');
    fireEvent.click(removeBtns[0]);
    expect(screen.queryByAltText('Baicang')).not.toBeInTheDocument();
  });

  it('filters picker characters by search term', () => {
    render(<PartyEditorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Slot 1'));
    fireEvent.change(screen.getByPlaceholderText(/search esper/i), {
      target: { value: 'Jade' },
    });
    expect(screen.getByText('Jade')).toBeInTheDocument();
    expect(screen.queryByText('Baicang')).not.toBeInTheDocument();
  });

  it('excludes already-selected members from picker', () => {
    render(<PartyEditorModal party={existingParty} {...defaultProps} />);
    fireEvent.click(screen.getByText('Slot 2'));
    const pickerItems = document.querySelectorAll('.picker-item');
    expect(pickerItems).toHaveLength(1);
    expect(pickerItems[0]).toHaveTextContent('Jade');
  });

  it('shows warning toast when saving with empty name', () => {
    render(<PartyEditorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Save Lineup'));
    expect(addToast).toHaveBeenCalledWith('Please enter a lineup name.', 'warning');
  });

  it('calls onSave with form data when name is filled', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PartyEditorModal {...defaultProps} onSave={onSave} />);
    const nameInput = document.querySelector('input[name="lineup-name"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'My Team' } });
    fireEvent.click(screen.getByText('Save Lineup'));
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      name: 'My Team',
      tier: null,
      notes: '',
      members: [],
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<PartyEditorModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles tier buttons', () => {
    render(<PartyEditorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('S'));
    const nameInput = document.querySelector('input[name="lineup-name"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Team' } });
    fireEvent.click(screen.getByText('Save Lineup'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({ tier: 'S' }));
  });

  it('deselects tier when same tier clicked twice', () => {
    render(<PartyEditorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('A'));
    fireEvent.click(screen.getByText('A'));
    const nameInput = document.querySelector('input[name="lineup-name"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Team' } });
    fireEvent.click(screen.getByText('Save Lineup'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({ tier: null }));
  });

  it('closes picker when cancel button is clicked', () => {
    render(<PartyEditorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Slot 1'));
    expect(screen.getByPlaceholderText(/search esper/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel', { selector: '.cancel-picker' }));
    expect(screen.queryByPlaceholderText(/search esper/i)).not.toBeInTheDocument();
  });
});
