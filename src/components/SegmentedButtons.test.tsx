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
