import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/zenless-zone-zero/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import { ALL_ZZZ_AGENTS } from '@/data/zenless-zone-zero/agents';

// Config-wiring tests only — the shared view behaviour (slot editing, sorting,
// modal flows, auth gating) is covered by src/components/parties/PartiesView.test.tsx.

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => `mugshot:${url}`),
  getAvatarUrl: vi.fn((url: string) => `avatar:${url}`),
}));

const firstAgent = ALL_ZZZ_AGENTS[0];

const party: Party = {
  id: 'party-1',
  profileId: 'user-1',
  name: 'Shiyu Squad',
  notes: null,
  tier: 'S',
  isFavorited: false,
  members: [{ entityId: firstAgent.id, slotIndex: 0 }],
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultProps = {
  parties: [party],
  availableAgents: ALL_ZZZ_AGENTS,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
  session: createMockSession(),
};

describe('PartiesTab (ZZZ config wiring)', () => {
  it('uses the Party noun with the tier selector enabled', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Your Parties')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    expect(screen.getByPlaceholderText(/shiyu defense/i)).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders exactly three member slots in the editor', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
    const slots = document.querySelectorAll('.builder-slot');
    expect(slots).toHaveLength(3);
  });

  it('renders the tier banner and favorite toggle', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Favourite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('party-1', true);
  });

  it('applies the zzz element slot accent and resolves images through getMugshotUrl', () => {
    renderWithProviders(<PartiesTab {...defaultProps} />);
    const img = screen.getByAltText(firstAgent.name);
    expect(img).toHaveAttribute('src', `mugshot:${firstAgent.imageUrl}`);
    const accented = document.querySelector('.slot-avatar[class*="zzz-element-"]');
    expect(accented).not.toBeNull();
  });
});
