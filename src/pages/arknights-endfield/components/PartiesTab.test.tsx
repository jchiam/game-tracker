import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartiesTab } from './PartiesTab';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';
import { createMockSession } from '@/test/mocks/supabase';
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
    id: 'party-1',
    profileId: 'user-1',
    name: 'Squad Alpha',
    notes: null,
    members: [],
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('PartiesTab', () => {
  const defaultProps = {
    parties: [] as EndfieldParty[],
    availableOperators: ALL_OPERATORS,
    onSaveParty: vi.fn().mockResolvedValue('new-id'),
    onDeleteParty: vi.fn().mockResolvedValue(true),
    session: createMockSession(),
  };

  it('shows sign-in message when no session', () => {
    render(<PartiesTab {...defaultProps} session={null} />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('does not show squad UI when no session', () => {
    render(<PartiesTab {...defaultProps} session={null} />);
    expect(screen.queryByText('Your Squads')).not.toBeInTheDocument();
    expect(screen.queryByText('Create New Squad')).not.toBeInTheDocument();
  });

  it('shows empty state when no parties', () => {
    render(<PartiesTab {...defaultProps} />);
    expect(screen.getByText(/No squads configured/)).toBeInTheDocument();
  });

  it('renders party cards when parties exist', () => {
    render(
      <PartiesTab
        {...defaultProps}
        parties={[makeParty({ name: 'Alpha' }), makeParty({ id: 'p2', name: 'Beta' })]}
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows "Create New Squad" button when authenticated', () => {
    render(<PartiesTab {...defaultProps} />);
    expect(screen.getByText('Create New Squad')).toBeInTheDocument();
  });

  it('opens create modal when create button clicked', () => {
    render(<PartiesTab {...defaultProps} />);
    fireEvent.click(screen.getByText('Create New Squad'));
    expect(screen.getByRole('heading', { name: /create new squad/i })).toBeInTheDocument();
  });

  it('calls onDeleteParty when a party card delete button clicked', () => {
    const onDeleteParty = vi.fn().mockResolvedValue(true);
    render(<PartiesTab {...defaultProps} parties={[makeParty()]} onDeleteParty={onDeleteParty} />);
    fireEvent.click(screen.getByTitle('Delete Squad'));
    expect(onDeleteParty).toHaveBeenCalledWith('party-1');
  });

  it('opens edit modal when a party card edit button clicked', () => {
    render(<PartiesTab {...defaultProps} parties={[makeParty({ name: 'My Squad' })]} />);
    fireEvent.click(screen.getByTitle('Edit Squad'));
    expect(screen.getByRole('heading', { name: /edit squad/i })).toBeInTheDocument();
  });

  it('closes create modal after saving', async () => {
    const user = userEvent.setup();
    const onSaveParty = vi.fn().mockResolvedValue('party-1');
    render(<PartiesTab {...defaultProps} onSaveParty={onSaveParty} />);
    fireEvent.click(screen.getByText('Create New Squad'));
    expect(screen.getByRole('heading', { name: /create new squad/i })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('e.g. Boss Rush Team'), 'New Squad');
    fireEvent.click(screen.getByText('Save Squad'));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create new squad/i })).not.toBeInTheDocument();
    });
  });

  it('closes modal when cancel button clicked', () => {
    render(<PartiesTab {...defaultProps} />);
    fireEvent.click(screen.getByText('Create New Squad'));
    expect(screen.getByRole('heading', { name: /create new squad/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.queryByRole('heading', { name: /create new squad/i })).not.toBeInTheDocument();
  });
});
