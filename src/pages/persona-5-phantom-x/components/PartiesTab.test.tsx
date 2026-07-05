import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/persona-5-phantom-x/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import { ALL_THIEVES } from '@/data/persona-5-phantom-x/thieves';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => `mugshot:${url}`),
  getAvatarUrl: vi.fn((url: string) => `avatar:${url}`),
}));

const firstThief = ALL_THIEVES[0];

const party: Party = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Party Alpha',
  notes: null,
  tier: 'S',
  isFavorited: false,
  members: [{ entityId: firstThief.id, slotIndex: 0 }],
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultProps = {
  parties: [party],
  availableThieves: ALL_THIEVES,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab (P5X config wiring)', () => {
  it('uses the Party noun with the tier selector enabled', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Parties')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    expect(screen.getByPlaceholderText(/kamoshida palace/i)).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders the tier banner and favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('party-1', true);
  });

  it('renders the canonical party card without a variant class', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(document.querySelector('.parties-tab')).toBeInTheDocument();
    expect(document.querySelector('.parties-tab')?.className.trim()).toBe('parties-tab');
  });

  it('resolves member images through getMugshotUrl without a slot accent', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText(firstThief.name);
    expect(img).toHaveAttribute('src', `mugshot:${firstThief.imageUrl}`);
  });
});
