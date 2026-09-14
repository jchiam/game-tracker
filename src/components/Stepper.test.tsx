import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stepper } from '@/components/Stepper';

describe('Stepper', () => {
  it('emits value + 1 on increment and value - 1 on decrement', () => {
    const onChange = vi.fn();
    render(<Stepper label="Sealed" value={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Sealed' }));
    expect(onChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Sealed' }));
    expect(onChange).toHaveBeenCalledWith(0);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('disables the decrement at the default lower bound of 0', () => {
    const onChange = vi.fn();
    render(<Stepper label="Loose" value={0} onChange={onChange} />);
    const dec = screen.getByRole('button', { name: 'Decrease Loose' });
    expect(dec).toBeDisabled();
    fireEvent.click(dec);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Increase Loose' })).toBeEnabled();
  });

  it('disables the increment at max', () => {
    render(<Stepper label="Boxed" value={3} max={3} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Increase Boxed' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease Boxed' })).toBeEnabled();
  });

  it('honours a custom min', () => {
    render(<Stepper label="Level" value={1} min={1} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Decrease Level' })).toBeDisabled();
  });

  it('disables both buttons when disabled', () => {
    render(<Stepper label="Sealed" value={1} disabled onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Decrease Sealed' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase Sealed' })).toBeDisabled();
  });

  it('names the group and shows the value', () => {
    render(<Stepper label="Sealed" value={4} onChange={vi.fn()} size="compact" />);
    const group = screen.getByRole('group', { name: 'Sealed' });
    expect(group).toHaveClass('stepper', 'compact');
    expect(group.querySelector('.stepper-value')).toHaveTextContent('4');
  });
});
