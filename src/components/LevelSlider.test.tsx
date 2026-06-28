import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelSlider } from '@/components/LevelSlider';

describe('LevelSlider', () => {
  it('renders a .level-slider range input bound to value/min/max', () => {
    const { container } = render(
      <LevelSlider name="level" value={45} min={1} max={90} onChange={vi.fn()} />,
    );
    const input = container.querySelector('input[name="level"]') as HTMLInputElement;
    expect(input).toHaveClass('level-slider');
    expect(input.type).toBe('range');
    expect(input).toHaveValue('45');
    expect(input.min).toBe('1');
    expect(input.max).toBe('90');
  });

  it('emits the new integer value on change', () => {
    const onChange = vi.fn();
    render(<LevelSlider name="level" value={1} min={1} max={90} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it('fills the track proportionally to (value - min)/(max - min)', () => {
    const { container } = render(
      <LevelSlider name="level" value={10} min={0} max={20} onChange={vi.fn()} />,
    );
    const input = container.querySelector('input')!;
    // 50% fill
    expect(input.getAttribute('style')).toContain('50%');
  });

  it('renders a .level-value readout only when showValue is set', () => {
    const { container, rerender } = render(
      <LevelSlider name="level" value={7} min={0} max={20} onChange={vi.fn()} />,
    );
    expect(container.querySelector('.level-value')).not.toBeInTheDocument();
    rerender(<LevelSlider name="level" value={7} min={0} max={20} showValue onChange={vi.fn()} />);
    expect(container.querySelector('.level-value')).toHaveTextContent('7');
  });
});
