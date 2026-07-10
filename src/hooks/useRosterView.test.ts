import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRosterView, type RosterViewConfig } from '@/hooks/useRosterView';

type SortKey = 'ALPHA' | 'LEVEL';

function makeConfig(
  overrides: Partial<RosterViewConfig<SortKey, string>> = {},
): RosterViewConfig<SortKey, string> {
  return {
    sortModes: [
      { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
      { key: 'LEVEL', label: 'Lv', described: 'by Level' },
    ],
    searchPlaceholder: 'Search by name...',
    addTitle: 'Add Thing',
    addDisabled: false,
    filterRoster: vi.fn().mockReturnValue([]),
    ...overrides,
  };
}

function setup(overrides: Partial<RosterViewConfig<SortKey, string>> = {}) {
  const config = makeConfig(overrides);
  const utils = renderHook(
    (props: { config: RosterViewConfig<SortKey, string> }) => useRosterView(props.config),
    { initialProps: { config } },
  );
  return { ...utils, config };
}

describe('useRosterView', () => {
  it('starts on the roster view with empty search, default sort, closed modal', () => {
    const { result } = setup();
    expect(result.current.view).toBe('roster');
    expect(result.current.search.value).toBe('');
    expect(result.current.sort.active).toBe(true);
    expect(result.current.isAddModalOpen).toBe(false);
  });

  it('switches view via setView', () => {
    const { result } = setup();
    act(() => result.current.setView('second'));
    expect(result.current.view).toBe('second');
  });

  it('exposes the configured search placeholder and updates the term', () => {
    const filterRoster = vi.fn().mockReturnValue([]);
    const { result } = setup({ filterRoster });
    expect(result.current.search.placeholder).toBe('Search by name...');
    act(() => result.current.search.onChange('vertin'));
    expect(result.current.search.value).toBe('vertin');
    expect(filterRoster).toHaveBeenLastCalledWith('vertin', 'ALPHA');
  });

  it('generates the sort descriptor from the default mode', () => {
    const { result } = setup();
    expect(result.current.sort.label).toBe('AZ');
    expect(result.current.sort.title).toBe('Sorted alphabetically — click to sort by Level');
  });

  it('toggling sort switches to the alternate mode and back', () => {
    const filterRoster = vi.fn().mockReturnValue([]);
    const { result } = setup({ filterRoster });

    act(() => result.current.sort.onToggle());
    expect(result.current.sort.active).toBe(false);
    expect(result.current.sort.label).toBe('Lv');
    expect(result.current.sort.title).toBe('Sorted by Level — click to sort alphabetically');
    expect(filterRoster).toHaveBeenLastCalledWith('', 'LEVEL');

    act(() => result.current.sort.onToggle());
    expect(result.current.sort.active).toBe(true);
    expect(result.current.sort.label).toBe('AZ');
  });

  it('cycles through three sort modes and wraps back to the default', () => {
    const filterRoster = vi.fn().mockReturnValue([]);
    const threeModes = renderHook(() =>
      useRosterView<'ALPHA' | 'LEVEL' | 'SCORE', string>({
        sortModes: [
          { key: 'ALPHA', label: 'AZ', described: 'alphabetically' },
          { key: 'LEVEL', label: 'Lv', described: 'by Level' },
          { key: 'SCORE', label: '★', described: 'by Score' },
        ],
        searchPlaceholder: 'Search...',
        addTitle: 'Add',
        addDisabled: false,
        filterRoster,
      }),
    );

    expect(threeModes.result.current.sort.label).toBe('AZ');
    expect(threeModes.result.current.sort.title).toBe(
      'Sorted alphabetically — click to sort by Level',
    );

    act(() => threeModes.result.current.sort.onToggle());
    expect(threeModes.result.current.sort.label).toBe('Lv');
    expect(filterRoster).toHaveBeenLastCalledWith('', 'LEVEL');

    act(() => threeModes.result.current.sort.onToggle());
    expect(threeModes.result.current.sort.label).toBe('★');
    expect(threeModes.result.current.sort.active).toBe(false);
    expect(filterRoster).toHaveBeenLastCalledWith('', 'SCORE');

    act(() => threeModes.result.current.sort.onToggle());
    expect(threeModes.result.current.sort.label).toBe('AZ');
    expect(threeModes.result.current.sort.active).toBe(true);
    expect(filterRoster).toHaveBeenLastCalledWith('', 'ALPHA');
  });

  it('returns the roster produced by filterRoster', () => {
    const filterRoster = vi.fn().mockReturnValue(['a', 'b']);
    const { result } = setup({ filterRoster });
    expect(result.current.filteredRoster).toEqual(['a', 'b']);
  });

  it('does not re-filter when unrelated state changes', () => {
    const filterRoster = vi.fn().mockReturnValue([]);
    const { result } = setup({ filterRoster });
    filterRoster.mockClear();
    act(() => result.current.add.onClick());
    expect(filterRoster).not.toHaveBeenCalled();
  });

  it('add descriptor carries the configured title and disabled flag', () => {
    const { result } = setup({ addTitle: 'Add Arcanist', addDisabled: true });
    expect(result.current.add.title).toBe('Add Arcanist');
    expect(result.current.add.disabled).toBe(true);
  });

  it('add.onClick opens the modal and closeAddModal closes it', () => {
    const { result } = setup();
    act(() => result.current.add.onClick());
    expect(result.current.isAddModalOpen).toBe(true);
    act(() => result.current.closeAddModal());
    expect(result.current.isAddModalOpen).toBe(false);
  });
});
