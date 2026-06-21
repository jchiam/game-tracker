import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartiesTab } from './PartiesTab';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';
import { createMockSession } from '@/test/mocks/supabase';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

vi.mock('@/utils/toast', () => ({
  addToast: vi.fn(),
}));

describe('PartiesTab', () => {
  const defaultProps = {
    parties: [],
    availableOperators: ALL_OPERATORS,
    onSaveParty: vi.fn().mockResolvedValue('new-id'),
    onDeleteParty: vi.fn().mockResolvedValue(true),
    session: createMockSession(),
  };

  it('shows sign-in message when no session', () => {
    render(<PartiesTab {...defaultProps} session={null} />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('shows empty state when no parties', () => {
    render(<PartiesTab {...defaultProps} />);
    expect(screen.getByText(/No squads configured/)).toBeInTheDocument();
  });

  it('renders party cards', () => {
    const parties = [
      {
        id: 'p1',
        profileId: 'user-1',
        name: 'Squad A',
        notes: null,
        members: [],
        createdAt: '2026-01-01',
      },
    ];
    render(<PartiesTab {...defaultProps} parties={parties} />);
    expect(screen.getByText('Squad A')).toBeInTheDocument();
  });

  it('opens create modal when button clicked', async () => {
    const user = userEvent.setup();
    render(<PartiesTab {...defaultProps} />);
    await user.click(screen.getByText('Create New Squad'));
    expect(screen.getByPlaceholderText('e.g. Boss Rush Team')).toBeInTheDocument();
  });
});
