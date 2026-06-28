import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubStatList, type SubStatValue } from '@/components/SubStatList';

const STATS = ['HP', 'ATK', 'DEF', 'CRIT Rate', 'CRIT DMG'];

describe('SubStatList — stat-value variant', () => {
  it('renders a stat select plus a value input per row, with the Value placeholder', () => {
    const values: SubStatValue[] = [{ type: 'HP', value: '3.2%' }];
    render(
      <SubStatList
        variant="stat-value"
        values={values}
        options={STATS}
        namePrefix="substat"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText('Value')).toHaveValue('3.2%');
    expect(document.querySelector('select[name="substat-type-0"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="substat-value-0"]')).toBeInTheDocument();
  });

  it('emits a new array with only the changed row replaced, not mutating the input', () => {
    const onChange = vi.fn();
    const values: SubStatValue[] = [
      { type: 'HP', value: '1' },
      { type: 'ATK', value: '2' },
    ];
    const frozen = Object.freeze([
      Object.freeze({ ...values[0] }),
      Object.freeze({ ...values[1] }),
    ]);
    render(
      <SubStatList
        variant="stat-value"
        values={frozen as unknown as SubStatValue[]}
        options={STATS}
        namePrefix="substat"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getAllByPlaceholderText('Value')[0], { target: { value: '9' } });
    const emitted = onChange.mock.calls[0][0] as SubStatValue[];
    expect(emitted[0]).toEqual({ type: 'HP', value: '9' });
    expect(emitted[0]).not.toBe(frozen[0]);
    expect(emitted[1]).toBe(frozen[1]); // untouched row kept by reference
    expect(frozen[0].value).toBe('1'); // original not mutated
  });

  it('adds a row with an empty value on add', () => {
    const onChange = vi.fn();
    render(
      <SubStatList
        variant="stat-value"
        values={[]}
        options={STATS}
        namePrefix="substat"
        addLabel="+ Add Substat"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Add Substat'));
    expect(onChange).toHaveBeenCalledWith([{ type: 'HP', value: '' }]);
  });
});

describe('SubStatList — stat-only variant', () => {
  it('emits a new string[] with only that index replaced', () => {
    const onChange = vi.fn();
    render(
      <SubStatList
        variant="stat-only"
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
});

describe('SubStatList — shared behaviour', () => {
  it('hides the add button at the cap and shows it again below', () => {
    const { rerender } = render(
      <SubStatList
        variant="stat-only"
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
        variant="stat-only"
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
        variant="stat-value"
        values={[{ type: 'DEF', value: '1' }]}
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
      <SubStatList
        variant="stat-only"
        values={['HP']}
        options={STATS}
        namePrefix="substat"
        onChange={vi.fn()}
      />,
    );
    expect(container.querySelector('.substat-row')).toBeInTheDocument();
    expect(container.querySelector('.remove-substat')).toBeInTheDocument();
    expect(container.querySelector('.add-substat-btn')).toBeInTheDocument();
  });
});
