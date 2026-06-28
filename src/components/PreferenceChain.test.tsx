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

describe('PreferenceChain — ranked-list mode', () => {
  const weaponOptions = [
    { value: 'defender', label: 'Defender' },
    { value: 'last-light', label: 'Last Light' },
    { value: 'sunder', label: 'Sunder' },
  ];

  const rankedProps = {
    variant: 'ranked-list' as const,
    values: [] as string[],
    options: weaponOptions,
    onChange: vi.fn(),
    namePrefix: 'test-ranked',
    addLabel: '+ Add Weapon',
  };

  it('renders no operator selects', () => {
    render(<PreferenceChain {...rankedProps} values={['defender', 'last-light']} />);
    // Only the per-row weapon selects, no operator select between rows
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.queryByText('OR')).not.toBeInTheDocument();
  });

  it('appends the first not-yet-ranked option on add', () => {
    const onChange = vi.fn();
    render(<PreferenceChain {...rankedProps} values={['defender']} onChange={onChange} />);

    fireEvent.click(screen.getByText('+ Add Weapon'));

    expect(onChange).toHaveBeenCalledWith(['defender', 'last-light']);
  });

  it('disables add when all options are ranked (dedupe of selectable options)', () => {
    render(<PreferenceChain {...rankedProps} values={['defender', 'last-light', 'sunder']} />);
    expect(screen.getByText('+ Add Weapon')).toBeDisabled();
  });

  it('emits the value, not the label, when a row select changes', () => {
    const onChange = vi.fn();
    render(<PreferenceChain {...rankedProps} values={['defender']} onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'sunder' } });

    expect(onChange).toHaveBeenCalledWith(['sunder']);
  });

  it('removes the targeted item, keeping the rest in order', () => {
    const onChange = vi.fn();
    render(
      <PreferenceChain
        {...rankedProps}
        values={['defender', 'last-light', 'sunder']}
        onChange={onChange}
      />,
    );

    // Remove the first row
    fireEvent.click(screen.getAllByLabelText('Remove')[0]);

    expect(onChange).toHaveBeenCalledWith(['last-light', 'sunder']);
  });

  it('reorders an item upward when its up control is clicked', () => {
    const onChange = vi.fn();
    render(
      <PreferenceChain {...rankedProps} values={['defender', 'last-light']} onChange={onChange} />,
    );

    // Move the second row up
    fireEvent.click(screen.getAllByLabelText('Move up')[1]);

    expect(onChange).toHaveBeenCalledWith(['last-light', 'defender']);
  });

  it('disables up on the first row and down on the last row', () => {
    render(<PreferenceChain {...rankedProps} values={['defender', 'last-light']} />);

    expect(screen.getAllByLabelText('Move up')[0]).toBeDisabled();
    expect(screen.getAllByLabelText('Move down')[1]).toBeDisabled();
  });
});
