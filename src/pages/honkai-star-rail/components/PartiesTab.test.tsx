import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PartiesTab } from '@/pages/honkai-star-rail/components/PartiesTab';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { HsrParty } from '@/types';
import type { Character } from '@/data/honkai-star-rail/characters';

const availableCharacters: Character[] = [
  { id: 'acheron', name: 'Acheron', element: 'Thunder', path: 'Nihility', imageUrl: '/acheron.webp' },
];

function makeParty(overrides: Partial<HsrParty> = {}): HsrParty {
  return {
    id: 'party-1',
    profileId: 'user-1',
    name: 'Team Alpha',
    notes: null,
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const defaultProps = {
  parties: [],
  availableCharacters,
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
};

describe('PartiesTab', () => {
  it('shows sign-in prompt when there is no session', () => {
    renderWithProviders(<PartiesTab {...defaultProps} session={null} />);
    expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
  });

  it('does not show party UI when there is no session', () => {
    renderWithProviders(<PartiesTab {...defaultProps} session={null} />);
    expect(screen.queryByText('Your Lineups')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create new party/i })).not.toBeInTheDocument();
  });

  it('shows empty state when session exists but no parties', () => {
    const session = createMockSession();
    renderWithProviders(<PartiesTab {...defaultProps} parties={[]} session={session} />);
    expect(screen.getByText(/no parties configured/i)).toBeInTheDocument();
  });

  it('renders party cards when parties exist', () => {
    const session = createMockSession();
    renderWithProviders(
      <PartiesTab
        {...defaultProps}
        parties={[makeParty({ name: 'Team Alpha' }), makeParty({ id: 'party-2', name: 'Team Beta' })]}
        session={session}
      />,
    );
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
  });

  it('shows the "Create New Party" button when authenticated', () => {
    const session = createMockSession();
    renderWithProviders(<PartiesTab {...defaultProps} session={session} />);
    expect(screen.getByRole('button', { name: /create new party/i })).toBeInTheDocument();
  });

  it('opens the party editor modal when create button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(<PartiesTab {...defaultProps} session={session} />);
    fireEvent.click(screen.getByRole('button', { name: /create new party/i }));
    expect(screen.getByRole('heading', { name: /create new party/i })).toBeInTheDocument();
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
    fireEvent.click(screen.getByTitle('Delete Party'));
    expect(onDeleteParty).toHaveBeenCalledWith('party-1');
  });

  it('opens the edit modal when a party card edit button is clicked', () => {
    const session = createMockSession();
    renderWithProviders(
      <PartiesTab {...defaultProps} parties={[makeParty({ name: 'My Team' })]} session={session} />,
    );
    fireEvent.click(screen.getByTitle('Edit Party'));
    expect(screen.getByRole('heading', { name: /edit party/i })).toBeInTheDocument();
  });
});
