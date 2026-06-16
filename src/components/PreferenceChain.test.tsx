import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreferenceChain } from '@/components/PreferenceChain';
import type { StatPreference } from '@/types';

const sampleOptions = ['ATK%', 'CRIT Rate', 'CRIT DMG', 'Speed'];

const defaultProps = {
  values: [] as StatPreference[],
  options: sampleOptions,
  onChange: vi.fn(),
  namePrefix: 'test-pref',
};

describe('PreferenceChain', () => {
  it('renders only the add button when values list is empty', () => {
    render(<PreferenceChain {...defaultProps} />);
    expect(screen.getByText('+ Add Priority')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('calls onChange with first option when Add Priority is clicked on empty chain', () => {
    const onChange = vi.fn();
    render(<PreferenceChain {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText('+ Add Priority'));

    expect(onChange).toHaveBeenCalledWith([{ stat: 'ATK%', operator: null, orderIndex: 0 }]);
  });

  it('calls onChange and appends first option with previous item operator set to > when Add Priority is clicked on populated chain', () => {
    const onChange = vi.fn();
    const values: StatPreference[] = [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }];
    render(<PreferenceChain {...defaultProps} values={values} onChange={onChange} />);

    fireEvent.click(screen.getByText('+ Add Priority'));

    expect(onChange).toHaveBeenCalledWith([
      { stat: 'CRIT Rate', operator: '>', orderIndex: 0 },
      { stat: 'ATK%', operator: null, orderIndex: 1 },
    ]);
  });

  it('renders dropdown selects for populated values list', () => {
    const values: StatPreference[] = [
      { stat: 'CRIT Rate', operator: '>', orderIndex: 0 },
      { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
    ];
    render(<PreferenceChain {...defaultProps} values={values} />);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3); // 2 stats selects + 1 operator select
    expect(selects[0]).toHaveValue('CRIT Rate');
    expect(selects[1]).toHaveValue('>');
    expect(selects[2]).toHaveValue('CRIT DMG');
  });

  it('calls onChange with updated stat when preference select value changes', () => {
    const onChange = vi.fn();
    const values: StatPreference[] = [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }];
    render(<PreferenceChain {...defaultProps} values={values} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Speed' } });

    expect(onChange).toHaveBeenCalledWith([{ stat: 'Speed', operator: null, orderIndex: 0 }]);
  });

  it('calls onChange with updated operator when operator select changes', () => {
    const onChange = vi.fn();
    const values: StatPreference[] = [
      { stat: 'CRIT Rate', operator: '>', orderIndex: 0 },
      { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
    ];
    render(<PreferenceChain {...defaultProps} values={values} onChange={onChange} />);

    const operatorSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(operatorSelect, { target: { value: 'OR' } });

    expect(onChange).toHaveBeenCalledWith([
      { stat: 'CRIT Rate', operator: 'OR', orderIndex: 0 },
      { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
    ]);
  });

  it('calls onChange with removed item and updates tail operator when remove button is clicked', () => {
    const onChange = vi.fn();
    const values: StatPreference[] = [
      { stat: 'CRIT Rate', operator: '>', orderIndex: 0 },
      { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
    ];
    render(<PreferenceChain {...defaultProps} values={values} onChange={onChange} />);

    fireEvent.click(screen.getByText('✕'));

    expect(onChange).toHaveBeenCalledWith([{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }]);
  });
});
