import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartiesTab } from '@/pages/reverse1999/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { R1999Party } from '@/types';
import type { Arcanist } from '@/data/reverse1999/arcanists';

const availableArcanists: Arcanist[] = [
  {
    id: 'an_an',
    name: 'An-an Lee',
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: '/an_an.webp',
    hasEuphoria: false,
  },
];

function makeParty(overrides: Partial<R1999Party> = {}): R1999Party {
  return {
    id: 'party-1',
    profileId: 'user-1',
    name: 'Team Alpha',
    notes: null,
    tier: null,
    isFavorited: false,
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const defaultProps = {
  parties: [],
  availableArcanists,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
  onToggleFavorite: vi.fn(),
};

describe('PartiesTab (R1999)', () => {
  it('shows sign-in prompt when there is no session', () => {
    renderWithProviders(<PartiesTab {...defaultProps} session={null} />);
    expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
  });

  it('does not show lineup UI when there is no session', () => {
    renderWithProviders(<PartiesTab {...defaultProps} session={null} />);
    expect(screen.queryByText('Your Lineups')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create new lineup/i })).not.toBeInTheDocument();
  });

  it('shows empty state when session exists but no parties', () => {
    const session = createMockSession();
    renderWithProviders(<PartiesTab {...defaultProps} parties={[]} session={session} />);
    expect(screen.getByText(/no lineups configured/i)).toBeInTheDocument();
  });

  it('renders party cards when parties exist', () => {
    const session = createMockSession();
    renderWithProviders(
      <PartiesTab
        {...defaultProps}
        parties={[
          makeParty({ name: 'Team Alpha' }),
          makeParty({ id: 'party-2', name: 'Team Beta' }),
        ]}
        session={session}
      />,
    );
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
  });

  it('shows the "Create New Lineup" button when authenticated', () => {
    const session = createMockSession();
    renderWithProviders(<PartiesTab {...defaultProps} session={session} />);
    expect(screen.getByRole('button', { name: /create new lineup/i })).toBeInTheDocument();
  });

  it('opens the lineup editor modal when create button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<PartiesTab {...defaultProps} session={session} />);
    fireEvent.click(screen.getByRole('button', { name: /create new lineup/i }));
    expect(screen.getByRole('heading', { name: /create new lineup/i })).toBeInTheDocument();
  });

  it('calls onDeleteParty when a party card delete button is clicked', () => {
    const onDeleteParty = vi.fn().mockResolvedValue(true);
    const session = createMockSession();
    renderWithProviders(
      <PartiesTab
        {...defaultProps}
        parties={[makeParty()]}
        onDeleteParty={onDeleteParty}
        session={session}
      />,
    );
    fireEvent.click(screen.getByTitle('Delete Lineup'));
    expect(onDeleteParty).toHaveBeenCalledWith('party-1');
  });

  it('opens the edit modal when a party card edit button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(
      <PartiesTab
        {...defaultProps}
        parties={[makeParty({ name: 'My Lineup' })]}
        session={session}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit Lineup'));
    expect(screen.getByRole('heading', { name: /edit lineup/i })).toBeInTheDocument();
  });

  it('closes the lineup editor modal after saving a new lineup', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    const onSaveParty = vi.fn().mockResolvedValue('party-1');
    renderWithProviders(
      <PartiesTab {...defaultProps} onSaveParty={onSaveParty} session={session} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /create new lineup/i }));
    expect(screen.getByRole('heading', { name: /create new lineup/i })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/limbo of ruin/i), 'My Lineup');
    fireEvent.click(screen.getByRole('button', { name: /save lineup/i }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create new lineup/i })).not.toBeInTheDocument();
    });
  });

  it('closes the lineup editor modal when the cancel button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<PartiesTab {...defaultProps} session={session} />);
    fireEvent.click(screen.getByRole('button', { name: /create new lineup/i }));
    expect(screen.getByRole('heading', { name: /create new lineup/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.queryByRole('heading', { name: /create new lineup/i })).not.toBeInTheDocument();
  });
});
