import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartyEditorModal } from './PartyEditorModal';
import { ALL_OPERATORS } from '@/data/arknights-endfield/operators';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
  getAvatarUrl: (path: string) => path,
}));

vi.mock('@/utils/toast', () => ({
  addToast: vi.fn(),
}));

describe('PartyEditorModal', () => {
  const defaultProps = {
    availableOperators: ALL_OPERATORS,
    onSave: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders create mode by default', () => {
    render(<PartyEditorModal {...defaultProps} />);
    expect(screen.getByText('Create New Squad')).toBeInTheDocument();
  });

  it('renders edit mode when party prop provided', () => {
    render(
      <PartyEditorModal
        {...defaultProps}
        party={{
          id: 'p1',
          profileId: 'user-1',
          name: 'Existing',
          notes: null,
          members: [],
          createdAt: '2026-01-01',
        }}
      />,
    );
    expect(screen.getByText('Edit Squad')).toBeInTheDocument();
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

  it('shows warning toast on empty name', async () => {
    const { addToast } = await import('@/utils/toast');
    const user = userEvent.setup();
    render(<PartyEditorModal {...defaultProps} />);
    await user.click(screen.getByText('Save Squad'));
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('name'), 'warning');
  });
});
