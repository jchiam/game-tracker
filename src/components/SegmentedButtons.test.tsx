import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedButtons, type SegmentedOption } from '@/components/SegmentedButtons';

const rarity: SegmentedOption[] = [
  { value: 'B', label: 'B', modifier: 'rarity-b' },
  { value: 'A', label: 'A', modifier: 'rarity-a' },
  { value: 'S', label: 'S', modifier: 'rarity-s' },
];

const phase: SegmentedOption[] = [0, 1, 2, 3, 4, 5].map((p) => ({
  value: String(p),
  label: `P${p}`,
}));

describe('SegmentedButtons — single-exact selection', () => {
  it('marks only the selected option active and emits its value', () => {
    const onChange = vi.fn();
    render(<SegmentedButtons options={rarity} value="A" onChange={onChange} />);
    expect(screen.getByText('A')).toHaveClass('active');
    expect(screen.getByText('B')).not.toHaveClass('active');
    fireEvent.click(screen.getByText('S'));
    expect(onChange).toHaveBeenCalledWith('S');
  });

  it('emits null when the active option is clicked with allowDeselect', () => {
    const onChange = vi.fn();
    render(<SegmentedButtons options={rarity} value="A" allowDeselect onChange={onChange} />);
    fireEvent.click(screen.getByText('A'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('emits the value (not null) on the active option without allowDeselect', () => {
    const onChange = vi.fn();
    render(<SegmentedButtons options={rarity} value="A" onChange={onChange} />);
    fireEvent.click(screen.getByText('A'));
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('renders the per-option modifier class under static coloring', () => {
    render(<SegmentedButtons options={rarity} value="S" onChange={vi.fn()} />);
    expect(screen.getByText('S')).toHaveClass('toggle-btn', 'rarity-s', 'active');
  });
});

describe('SegmentedButtons — investment coloring', () => {
  it('colours the single active button inline from the gradient, others bare', () => {
    render(<SegmentedButtons options={phase} value="3" coloring="investment" onChange={vi.fn()} />);
    const p3 = screen.getByText('P3');
    expect(p3).toHaveClass('active');
    expect(p3.getAttribute('style')).toContain('background');
    // No threshold trail: lower rungs are not active and carry no inline colour
    expect(screen.getByText('P2')).not.toHaveClass('active');
    expect(screen.getByText('P2').getAttribute('style')).toBeFalsy();
    expect(screen.getByText('P5').getAttribute('style')).toBeFalsy();
  });
});

describe('SegmentedButtons — cumulative fill', () => {
  const rungs: SegmentedOption[] = ['A', 'B', 'C', 'D', 'E', 'F'].map((letter, i) => ({
    value: String(i + 1),
    label: letter,
  }));

  /** Rung state per label, in row order — the whole row's rendering in one shot. */
  function rowStates() {
    return rungs.map(({ label }) => {
      const btn = screen.getByText(label);
      for (const state of ['attained', 'add', 'drop'] as const) {
        if (btn.classList.contains(`rung-${state}`)) return state;
      }
      return 'empty';
    });
  }

  function renderRow(props: Partial<Parameters<typeof SegmentedButtons>[0]> = {}) {
    return render(
      <SegmentedButtons
        options={rungs}
        value="3"
        fill="cumulative"
        coloring="investment"
        onChange={vi.fn()}
        {...props}
      />,
    );
  }

  it('fills every rung up to the selected one, each with its own gradient colour', () => {
    renderRow();
    expect(rowStates()).toEqual(['attained', 'attained', 'attained', 'empty', 'empty', 'empty']);
    // Own position on the ramp, not the selected rung's colour
    const a = screen.getByText('A').getAttribute('style');
    const c = screen.getByText('C').getAttribute('style');
    expect(a).toContain('background');
    expect(c).toContain('background');
    expect(a).not.toBe(c);
    expect(screen.getByText('D').getAttribute('style')).toBeFalsy();
  });

  it('marks the whole attained run as pressed', () => {
    renderRow();
    const pressed = rungs.map(({ label }) => screen.getByText(label).getAttribute('aria-pressed'));
    expect(pressed).toEqual(['true', 'true', 'true', 'false', 'false', 'false']);
  });

  it('previews the added range when hovering above the selection', () => {
    renderRow();
    fireEvent.mouseEnter(screen.getByText('E'));
    expect(rowStates()).toEqual(['attained', 'attained', 'attained', 'add', 'add', 'empty']);
  });

  it('previews the dropped range when hovering below the selection', () => {
    renderRow({ value: '5' });
    fireEvent.mouseEnter(screen.getByText('B'));
    expect(rowStates()).toEqual(['attained', 'attained', 'drop', 'drop', 'drop', 'empty']);
  });

  it('previews clearing the whole run when hovering the selected rung with allowDeselect', () => {
    renderRow({ value: '4', allowDeselect: true });
    fireEvent.mouseEnter(screen.getByText('D'));
    expect(rowStates()).toEqual(['drop', 'drop', 'drop', 'drop', 'empty', 'empty']);
  });

  it('leaves the run untouched when hovering the selected rung without allowDeselect', () => {
    renderRow({ value: '4' });
    fireEvent.mouseEnter(screen.getByText('D'));
    expect(rowStates()).toEqual(['attained', 'attained', 'attained', 'attained', 'empty', 'empty']);
  });

  it('restores the resting state when the pointer leaves the row', () => {
    const { container } = renderRow();
    fireEvent.mouseEnter(screen.getByText('F'));
    expect(rowStates()).toEqual(['attained', 'attained', 'attained', 'add', 'add', 'add']);
    fireEvent.mouseLeave(container.querySelector('.segmented-buttons')!);
    expect(rowStates()).toEqual(['attained', 'attained', 'attained', 'empty', 'empty', 'empty']);
  });

  it('previews identically on keyboard focus and restores on blur', () => {
    renderRow();
    fireEvent.focus(screen.getByText('E'));
    expect(rowStates()).toEqual(['attained', 'attained', 'attained', 'add', 'add', 'empty']);
    fireEvent.blur(screen.getByText('E'));
    expect(rowStates()).toEqual(['attained', 'attained', 'attained', 'empty', 'empty', 'empty']);
  });

  it('opts every rung out of the base per-button hover', () => {
    renderRow();
    for (const { label } of rungs) {
      expect(screen.getByText(label)).toHaveClass('is-rung');
    }
  });

  it('keeps click and deselect semantics unchanged', () => {
    const onChange = vi.fn();
    renderRow({ onChange, allowDeselect: true });
    fireEvent.click(screen.getByText('E'));
    expect(onChange).toHaveBeenCalledWith('5');
    fireEvent.click(screen.getByText('C')); // the selected rung
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('leaves exact-mode rows without rung classes or hover state', () => {
    render(<SegmentedButtons options={rungs} value="3" coloring="investment" onChange={vi.fn()} />);
    expect(screen.getByText('C')).not.toHaveClass('is-rung');
    fireEvent.mouseEnter(screen.getByText('E'));
    expect(screen.getByText('D').getAttribute('style')).toBeFalsy();
    const pressed = rungs.map(({ label }) => screen.getByText(label).getAttribute('aria-pressed'));
    expect(pressed).toEqual(['false', 'false', 'true', 'false', 'false', 'false']);
  });
});

describe('SegmentedButtons — container', () => {
  it('applies the host row-wrapper className to the container', () => {
    const { container } = render(
      <SegmentedButtons options={phase} value="0" className="euphoria-row" onChange={vi.fn()} />,
    );
    expect(container.querySelector('.segmented-buttons.euphoria-row')).toBeInTheDocument();
  });

  it('adds the compact size class to buttons', () => {
    render(<SegmentedButtons options={rarity} value="A" size="compact" onChange={vi.fn()} />);
    expect(screen.getByText('A')).toHaveClass('compact');
  });
});
