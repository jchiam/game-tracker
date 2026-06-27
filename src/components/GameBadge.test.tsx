import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GameBadge } from '@/components/GameBadge';

describe('GameBadge', () => {
  it('renders label with variant and modifier classes', () => {
    render(<GameBadge label="Fire" variant="element" modifier="fire" />);
    const badge = screen.getByText('Fire');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('game-badge', 'element-badge', 'element-fire');
  });

  it('works with afflatus variant', () => {
    render(<GameBadge label="Plant" variant="afflatus" modifier="plant" />);
    const badge = screen.getByText('Plant');
    expect(badge).toHaveClass('afflatus-badge', 'afflatus-plant');
  });

  it('works with esper variant', () => {
    render(<GameBadge label="Cosmos" variant="esper" modifier="cosmos" />);
    const badge = screen.getByText('Cosmos');
    expect(badge).toHaveClass('esper-badge', 'esper-cosmos');
  });
});
