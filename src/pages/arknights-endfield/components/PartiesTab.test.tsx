import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/arknights-endfield/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => `mugshot:${url}`),
  getAvatarUrl: vi.fn((url: string) => `avatar:${url}`),
}));

const firstOperator = ALL_OPERATORS[0];

const party: Party = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Squad Alpha',
  notes: null,
  tier: 'S',
  isFavorited: false,
  members: [{ entityId: firstOperator.id, slotIndex: 0 }],
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultProps = {
  parties: [party],
  availableOperators: ALL_OPERATORS,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab (AE config wiring)', () => {
  it('uses the Squad noun with the tier selector enabled', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Squads')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Squad' }));
    expect(screen.getByPlaceholderText(/boss rush/i)).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders the tier banner and favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('party-1', true);
  });

  it('renders the canonical party card without the endfield variant', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(document.querySelector('.parties-tab')).not.toHaveClass('endfield');
  });

  it('resolves member images through getMugshotUrl without a slot accent', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText(firstOperator.name);
    expect(img).toHaveAttribute('src', `mugshot:${firstOperator.imageUrl}`);
  });
});
