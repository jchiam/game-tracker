import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubStatList } from '@/components/SubStatList';

const STATS = ['HP', 'ATK', 'DEF', 'CRIT Rate', 'CRIT DMG'];

describe('SubStatList — rows', () => {
  it('renders a stat select per row', () => {
    render(<SubStatList values={['HP']} options={STATS} namePrefix="substat" onChange={vi.fn()} />);
    expect(document.querySelector('select[name="substat-type-0"]')).toBeInTheDocument();
  });

  it('emits a new string[] with only that index replaced', () => {
    const onChange = vi.fn();
    render(
      <SubStatList
        values={['HP', 'ATK']}
        options={STATS}
        namePrefix="substat"
        onChange={onChange}
      />,
    );
    fireEvent.change(document.querySelector('select[name="substat-type-1"]')!, {
      target: { value: 'DEF' },
    });
    expect(onChange).toHaveBeenCalledWith(['HP', 'DEF']);
  });

  it('does not mutate the input array on change', () => {
    const onChange = vi.fn();
    const frozen = Object.freeze(['HP', 'ATK']) as unknown as string[];
    render(
      <SubStatList values={frozen} options={STATS} namePrefix="substat" onChange={onChange} />,
    );
    fireEvent.change(document.querySelector('select[name="substat-type-0"]')!, {
      target: { value: 'DEF' },
    });
    expect(onChange).toHaveBeenCalledWith(['DEF', 'ATK']);
    expect(frozen).toEqual(['HP', 'ATK']); // original untouched
  });

  it('adds a row using the first allowed option on add', () => {
    const onChange = vi.fn();
    render(
      <SubStatList
        values={[]}
        options={STATS}
        namePrefix="substat"
        addLabel="+ Add Substat"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Add Substat'));
    expect(onChange).toHaveBeenCalledWith(['HP']);
  });
});

describe('SubStatList — shared behaviour', () => {
  it('hides the add button at the cap and shows it again below', () => {
    const { rerender } = render(
      <SubStatList
        values={['HP', 'ATK', 'DEF', 'CRIT Rate']}
        options={STATS}
        namePrefix="substat"
        max={4}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('+ Add Substat')).not.toBeInTheDocument();
    rerender(
      <SubStatList
        values={['HP', 'ATK', 'DEF']}
        options={STATS}
        namePrefix="substat"
        max={4}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('+ Add Substat')).toBeInTheDocument();
  });

  it('omits excludeValues from a row except where it is the row’s own value', () => {
    render(
      <SubStatList
        values={['DEF']}
        options={STATS}
        namePrefix="substat"
        excludeValues={['ATK', 'DEF']}
        onChange={vi.fn()}
      />,
    );
    const opts = Array.from(document.querySelectorAll('select[name="substat-type-0"] option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(opts).not.toContain('ATK'); // excluded
    expect(opts).toContain('DEF'); // kept — it is this row's current value
    expect(opts).toContain('HP');
  });

  it('renders the canonical .substat-row / .remove-substat / .add-substat-btn classes', () => {
    const { container } = render(
      <SubStatList values={['HP']} options={STATS} namePrefix="substat" onChange={vi.fn()} />,
    );
    expect(container.querySelector('.substat-row')).toBeInTheDocument();
    expect(container.querySelector('.remove-substat')).toBeInTheDocument();
    expect(container.querySelector('.add-substat-btn')).toBeInTheDocument();
  });

  it('disables row select and remove, and suppresses add, when disabled', () => {
    const { container } = render(
      <SubStatList
        values={['HP', 'ATK']}
        options={STATS}
        namePrefix="substat"
        disabled
        onChange={vi.fn()}
      />,
    );
    const selects = container.querySelectorAll<HTMLSelectElement>('.substat-row select');
    const removes = container.querySelectorAll<HTMLButtonElement>('.remove-substat');
    expect(selects.length).toBe(2);
    expect(Array.from(selects).every((s) => s.disabled)).toBe(true);
    expect(Array.from(removes).every((b) => b.disabled)).toBe(true);
    expect(container.querySelector('.add-substat-btn')).toBeNull();
  });
});

describe('SubStatList — id/label options', () => {
  const ID_STATS = [
    { value: 'attack', label: 'Attack' },
    { value: 'damage-mult', label: 'Damage Mult. +' },
    { value: 'crit-mult', label: 'Crit Mult.' },
  ];

  it('renders options in the given order, applying no reordering', () => {
    render(
      <SubStatList
        values={['attack']}
        options={ID_STATS}
        namePrefix="substat"
        onChange={vi.fn()}
      />,
    );
    const opts = Array.from(document.querySelectorAll('select[name="substat-type-0"] option'))
      .map((o) => (o as HTMLOptionElement).value)
      .filter(Boolean); // drop the leading "- Stat -" placeholder option
    expect(opts).toEqual(['attack', 'damage-mult', 'crit-mult']);
  });

  it('displays the label but stores the value', () => {
    render(
      <SubStatList
        values={['damage-mult']}
        options={ID_STATS}
        namePrefix="substat"
        onChange={vi.fn()}
      />,
    );
    const select = document.querySelector('select[name="substat-type-0"]') as HTMLSelectElement;
    expect(select.value).toBe('damage-mult');
    const selected = select.selectedOptions[0];
    expect(selected.textContent).toBe('Damage Mult. +');
  });

  it('adds a row using the first option value (id), not the label', () => {
    const onChange = vi.fn();
    render(
      <SubStatList
        values={[]}
        options={ID_STATS}
        namePrefix="substat"
        addLabel="+ Add Substat"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Add Substat'));
    expect(onChange).toHaveBeenCalledWith(['attack']);
  });

  it('excludeValues compares against option values (ids)', () => {
    render(
      <SubStatList
        values={['crit-mult']}
        options={ID_STATS}
        namePrefix="substat"
        excludeValues={['attack', 'crit-mult']}
        onChange={vi.fn()}
      />,
    );
    const opts = Array.from(document.querySelectorAll('select[name="substat-type-0"] option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(opts).not.toContain('attack'); // excluded by id
    expect(opts).toContain('crit-mult'); // kept — this row's own value
    expect(opts).toContain('damage-mult');
  });
});
