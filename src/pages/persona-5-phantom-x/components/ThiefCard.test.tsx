import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThiefCard } from './ThiefCard';
import type { P5xTrackedThief } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
}));

function makeThief(overrides: Partial<P5xTrackedThief> = {}): P5xTrackedThief {
  return {
    id: 'ann-takamaki',
    name: 'Ann Takamaki',
    codename: 'Panther',
    personaName: 'Carmen',
    rarity: 5,
    role: 'Multi-target',
    element: 'Fire',
    imageUrl: '/assets/persona-5-phantom-x/thieves/ann-takamaki.webp',
    dbId: 'db-1',
    isFavorited: false,
    level: 45,
    awareness: 3,
    ...overrides,
  };
}

describe('ThiefCard', () => {
  const defaultProps = {
    thief: makeThief(),
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdateAwareness: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Render ---

  it('renders thief name and role/element badges', () => {
    render(<ThiefCard {...defaultProps} />);
    expect(screen.getByText('Ann Takamaki')).toBeInTheDocument();
    expect(screen.getByText('Multi-target')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
  });

  it('slugs verbatim source values into badge modifier classes', () => {
    render(<ThiefCard {...defaultProps} />);
    expect(screen.getByText('Multi-target').className).toBe(
      'game-badge p5x-role-badge p5x-role-multi-target',
    );
    expect(screen.getByText('Fire').className).toBe(
      'game-badge p5x-element-badge p5x-element-fire',
    );
  });

  it('renders level and awareness stat chips', () => {
    render(<ThiefCard {...defaultProps} />);
    expect(screen.getByText('Lv 45')).toBeInTheDocument();
    expect(screen.getAllByText('A3').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the bound Persona name as the static line', () => {
    const { container } = render(<ThiefCard {...defaultProps} />);
    const line = container.querySelector('.game-card-static-line');
    expect(line).toHaveTextContent('Carmen');
  });

  it('does not render a rarity-star indicator', () => {
    const { container } = render(<ThiefCard {...defaultProps} />);
    expect(container.querySelector('.rarity-indicator')).toBeNull();
    expect(screen.queryByText('★★★★★')).not.toBeInTheDocument();
  });

  // --- Investment gradient wiring (shared rust→teal color language) ---

  it('colors the level chip by investment — rust at min, teal at max', () => {
    const { rerender } = render(<ThiefCard {...defaultProps} thief={makeThief({ level: 1 })} />);
    const lowChip = screen.getByText('Lv 1');
    expect(lowChip.style.color).toBe('rgb(138, 96, 80)'); // rust
    expect(lowChip.style.borderColor).toBe('rgba(138, 96, 80, 0.5)');

    rerender(<ThiefCard {...defaultProps} thief={makeThief({ level: 80 })} />);
    expect(screen.getByText('Lv 80').style.color).toBe('rgb(64, 200, 160)'); // teal
  });

  it('colors the awareness chip by investment', () => {
    // Scope to the summary chip — `A0` also appears as an edit-body button.
    const { container } = render(
      <ThiefCard {...defaultProps} thief={makeThief({ awareness: 0 })} />,
    );
    const chips = container.querySelectorAll<HTMLElement>('.game-card-static-stats .stat-chip');
    const awarenessChip = chips[1]; // [0] = Lv, [1] = A
    expect(awarenessChip).toHaveTextContent('A0');
    expect(awarenessChip.style.color).toBe('rgb(138, 96, 80)'); // rust at A0
  });

  it('drives the level slider fill from the investment gradient via the canonical class', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} thief={makeThief({ level: 1 })} />);
    await user.click(screen.getByTitle('Edit'));
    const slider = screen.getByRole('slider');
    expect(slider).toHaveClass('level-slider');
    expect(slider.style.getPropertyValue('--slider-fill-color')).toBe('rgb(138, 96, 80)');
  });

  // --- Edit body ---

  it('level slider is bounded 1–80 and reports changes', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '80');
    fireEvent.change(slider, { target: { value: '72' } });
    expect(defaultProps.onUpdateLevel).toHaveBeenCalledWith('ann-takamaki', 72);
  });

  it('renders all seven awareness buttons A0–A6 and reports selection', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    for (let a = 0; a <= 6; a++) {
      expect(screen.getByRole('button', { name: `A${a}` })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: 'A6' }));
    expect(defaultProps.onUpdateAwareness).toHaveBeenCalledWith('ann-takamaki', 6);
  });

  // --- Controls ---

  it('toggles favorite', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Favorite Thief'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('ann-takamaki', true);
  });

  it('calls onRemove with the thief id', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Remove Thief'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('ann-takamaki', expect.anything());
  });
});
