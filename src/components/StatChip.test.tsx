import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatChip } from '@/components/StatChip';

describe('StatChip', () => {
  it('renders label with stat-chip class', () => {
    render(<StatChip label="Lv 42" />);
    const chip = screen.getByText('Lv 42');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('stat-chip');
  });

  it('applies inline style', () => {
    render(<StatChip label="P5" style={{ color: '#d4af37', borderColor: '#d4af37' }} />);
    const chip = screen.getByText('P5');
    expect(chip).toHaveStyle({ color: '#d4af37', borderColor: '#d4af37' });
  });
});
