import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ConfirmCheckbox } from '@/components/ConfirmCheckbox';

describe('ConfirmCheckbox', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders the label text', () => {
    render(<ConfirmCheckbox checked={false} onChange={vi.fn()} label="All Traces Attained" />);
    expect(screen.getByText('All Traces Attained')).toBeInTheDocument();
  });

  it('shows a checkmark when checked is true', () => {
    render(<ConfirmCheckbox checked={true} onChange={vi.fn()} label="Test" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('does not show a checkmark when checked is false', () => {
    render(<ConfirmCheckbox checked={false} onChange={vi.fn()} label="Test" />);
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('does not call onChange on first click', () => {
    const onChange = vi.fn();
    render(<ConfirmCheckbox checked={false} onChange={onChange} label="Test" />);
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows "Click to confirm" after first click', () => {
    render(<ConfirmCheckbox checked={false} onChange={vi.fn()} label="Test Label" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Click to confirm')).toBeInTheDocument();
  });

  it('calls onChange with toggled value on second click within timeout', () => {
    const onChange = vi.fn();
    render(<ConfirmCheckbox checked={false} onChange={onChange} label="Test" />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when already checked and confirmed', () => {
    const onChange = vi.fn();
    render(<ConfirmCheckbox checked={true} onChange={onChange} label="Test" />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('resets to original label after 3 seconds', () => {
    render(<ConfirmCheckbox checked={false} onChange={vi.fn()} label="Test Label" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Click to confirm')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('does not call onChange after timeout resets state', () => {
    const onChange = vi.fn();
    render(<ConfirmCheckbox checked={false} onChange={onChange} label="Test" />);
    fireEvent.click(screen.getByRole('button'));
    act(() => vi.advanceTimersByTime(3000));
    // Second click after reset — should enter confirm mode again, not fire onChange
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
