import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '@/components/Select';

describe('Select', () => {
  it('renders one option per string and selects the matching value', () => {
    render(<Select name="stat" value="ATK%" options={['HP%', 'ATK%']} onChange={vi.fn()} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toHaveValue('ATK%');
    expect(screen.getByRole('option', { name: 'HP%' })).toHaveValue('HP%');
    expect(screen.getByRole('option', { name: 'ATK%' })).toHaveValue('ATK%');
  });

  it('displays the label but emits the value for value/label options', () => {
    const onChange = vi.fn();
    render(
      <Select
        name="weapon"
        value="w1"
        options={[
          { value: 'w1', label: 'Blade (5★)' },
          { value: 'w2', label: 'Spear (4★)' },
        ]}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('option', { name: 'Blade (5★)' })).toHaveValue('w1');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'w2' } });
    expect(onChange).toHaveBeenCalledWith('w2');
  });

  it('renders a leading empty-value placeholder option', () => {
    render(
      <Select
        name="set"
        value=""
        placeholder="-- No Set --"
        options={['101', '102']}
        onChange={vi.fn()}
      />,
    );
    const placeholder = screen.getByRole('option', { name: '-- No Set --' }) as HTMLOptionElement;
    expect(placeholder).toHaveValue('');
    expect(placeholder.selected).toBe(true);
  });

  it('forwards the name attribute and renders a real <select>', () => {
    const { container } = render(
      <Select name="cartridge-name" value="" options={['A']} onChange={vi.fn()} />,
    );
    expect(container.querySelector('select[name="cartridge-name"]')).toBeInTheDocument();
  });

  it('preserves option source order', () => {
    render(<Select name="s" value="b" options={['c', 'a', 'b']} onChange={vi.fn()} />);
    const opts = screen.getAllByRole('option').map((o) => (o as HTMLOptionElement).value);
    expect(opts).toEqual(['c', 'a', 'b']);
  });

  it('applies the md density class by default and a passed className', () => {
    const { container } = render(
      <Select name="s" value="a" options={['a']} onChange={vi.fn()} className="operator-select" />,
    );
    const select = container.querySelector('select')!;
    expect(select).toHaveClass('game-select', 'game-select-md', 'operator-select');
  });

  it('omits the md class for size="sm"', () => {
    const { container } = render(
      <Select name="s" value="a" options={['a']} size="sm" onChange={vi.fn()} />,
    );
    const select = container.querySelector('select')!;
    expect(select).toHaveClass('game-select');
    expect(select).not.toHaveClass('game-select-md');
  });
});
