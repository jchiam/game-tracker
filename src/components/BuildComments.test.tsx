import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuildComments } from '@/components/BuildComments';

describe('BuildComments', () => {
  it('renders the default label and the current value', () => {
    render(<BuildComments value="Focus crit" onChange={vi.fn()} />);
    expect(screen.getByText('Build Comments')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Focus crit')).toBeInTheDocument();
  });

  it('emits the new string on change', () => {
    const onChange = vi.fn();
    render(<BuildComments value="" placeholder="Additional notes…" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Additional notes…'), {
      target: { value: 'Speed tuning' },
    });
    expect(onChange).toHaveBeenCalledWith('Speed tuning');
  });

  it('accepts a custom label', () => {
    render(<BuildComments value="" label="Notes" onChange={vi.fn()} />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });
});
