import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from '@/components/ToastContainer';
import type { Toast } from '@/utils/toast';

vi.mock('@/utils/toast', () => ({
  subscribeToast: vi.fn(),
  removeToast: vi.fn(),
}));

import * as toastModule from '@/utils/toast';

const mockSubscribe = vi.mocked(toastModule.subscribeToast);
const mockRemove = vi.mocked(toastModule.removeToast);

function setupToasts(toasts: Toast[]) {
  mockSubscribe.mockImplementation((listener) => {
    listener(toasts);
    return () => {};
  });
}

describe('ToastContainer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when there are no toasts', () => {
    setupToasts([]);
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a toast message', () => {
    setupToasts([{ id: '1', message: 'Something went wrong', type: 'error' }]);
    render(<ToastContainer />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    setupToasts([
      { id: '1', message: 'First toast', type: 'info' },
      { id: '2', message: 'Second toast', type: 'success' },
    ]);
    render(<ToastContainer />);
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
  });

  it('shows the correct icon for each toast type', () => {
    setupToasts([
      { id: '1', message: 'Info msg', type: 'info' },
      { id: '2', message: 'Error msg', type: 'error' },
      { id: '3', message: 'Success msg', type: 'success' },
      { id: '4', message: 'Warning msg', type: 'warning' },
    ]);
    render(<ToastContainer />);
    expect(screen.getByText('ℹ')).toBeInTheDocument();
    expect(screen.getAllByText('✕')[0]).toBeInTheDocument(); // error icon
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('calls removeToast with the toast id when close button is clicked', async () => {
    setupToasts([{ id: 'toast-abc', message: 'Close me', type: 'info' }]);
    const user = userEvent.setup();
    render(<ToastContainer />);
    await user.click(screen.getByRole('button', { name: /close notification/i }));
    expect(mockRemove).toHaveBeenCalledWith('toast-abc');
  });

  it('subscribes to the toast system on mount', () => {
    setupToasts([]);
    render(<ToastContainer />);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });
});
