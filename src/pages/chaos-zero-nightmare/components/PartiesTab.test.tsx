import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/chaos-zero-nightmare/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import { ALL_CZN_COMBATANTS } from '@/data/chaos-zero-nightmare/combatants';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => `mugshot:${url}`),
  getAvatarUrl: vi.fn((url: string) => `avatar:${url}`),
}));

const first = ALL_CZN_COMBATANTS[0];

const party: Party = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Nightmare Team',
  notes: null,
  tier: 'S',
  isFavorited: false,
  members: [{ entityId: first.id, slotIndex: 0 }],
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultProps = {
  parties: [party],
  availableCombatants: ALL_CZN_COMBATANTS,
  onSaveParty: vi.fn().mockResolvedValue({ partyId: 'party-1' }),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab (CZN config wiring)', () => {
  it('uses the Party noun with the tier selector enabled', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Parties')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    expect(screen.getByPlaceholderText(/nightmare clear/i)).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders exactly three member slots and no companion panel in the editor', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    const slots = document.querySelectorAll('.team-slots .builder-slot');
    expect(slots).toHaveLength(3);
    expect(Array.from(slots).map((s) => s.textContent?.replace(/^\+/, ''))).toEqual([
      'Combatant 1',
      'Combatant 2',
      'Combatant 3',
    ]);
    expect(document.querySelector('.party-editor .companion-panel')).toBeNull();
  });

  it('renders the tier banner and favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('party-1', true);
  });

  it('resolves picker list images through getAvatarUrl', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    fireEvent.click(document.querySelectorAll('.builder-slot')[0]);
    expect(screen.getByPlaceholderText('Search combatant...')).toBeInTheDocument();
    const pickerImg = document.querySelector('.picker-item img') as HTMLImageElement;
    expect(pickerImg).toHaveAttribute('src', `avatar:${first.imageUrl}`);
  });

  it('applies the czn attribute slot accent and resolves images through getMugshotUrl', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText(first.name);
    expect(img).toHaveAttribute('src', `mugshot:${first.imageUrl}`);
    const accented = document.querySelector('.slot-avatar[class*="czn-element-"]');
    expect(accented).not.toBeNull();
  });
});
