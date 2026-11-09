import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatantCard } from './CombatantCard';
import type { CznTrackedCombatant } from '@/types';

const baseCombatant: CznTrackedCombatant = {
  id: 'mei-lin',
  name: 'Mei Lin',
  rarity: 5,
  class: 'Striker',
  element: 'Passion',
  faction: 'Terrascion',
  imageUrl: '/assets/chaos-zero-nightmare/combatants/mei-lin.webp',
  dbId: 'db-1',
  isFavorited: false,
  level: 45,
  ego: 2,
  potentialAttained: false,
};

describe('CombatantCard', () => {
  const defaultProps = {
    combatant: baseCombatant,
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdateEgo: vi.fn(),
    onTogglePotential: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The edit body is aria-hidden until the edit toggle is clicked.
  async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByTitle('Edit'));
  }

  it('renders name with rarity, class, and attribute badges', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('Mei Lin')).toBeInTheDocument();
    expect(screen.getByText('5★').className).toBe('game-badge czn-rarity-badge czn-rarity-5');
    expect(screen.getByText('Striker').className).toBe(
      'game-badge czn-class-badge czn-class-striker',
    );
    expect(screen.getByText('Passion').className).toBe(
      'game-badge czn-element-badge czn-element-passion',
    );
  });

  it('renders a 4★ rarity badge', () => {
    render(<CombatantCard {...defaultProps} combatant={{ ...baseCombatant, rarity: 4 }} />);
    expect(screen.getByText('4★').className).toBe('game-badge czn-rarity-badge czn-rarity-4');
  });

  it('renders unknown class and attribute strings verbatim with the neutral fallback class', () => {
    render(
      <CombatantCard
        {...defaultProps}
        combatant={{ ...baseCombatant, class: 'Oracle', element: 'Chaos' }}
      />,
    );
    expect(screen.getByText('Oracle').className).toBe(
      'game-badge czn-class-badge czn-class-unknown',
    );
    expect(screen.getByText('Chaos').className).toBe(
      'game-badge czn-element-badge czn-element-unknown',
    );
  });

  it('does not render the faction anywhere on the card', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.queryByText('Terrascion')).not.toBeInTheDocument();
  });

  it('renders level, Ego (T prefix), and Potential summary chips', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('Lv 45')).toBeInTheDocument();
    expect(screen.getAllByText('T2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Potential ✗')).toBeInTheDocument();
  });

  it('shows Potential ✓ when the tree is fully unlocked', () => {
    render(
      <CombatantCard {...defaultProps} combatant={{ ...baseCombatant, potentialAttained: true }} />,
    );
    expect(screen.getByText('Potential ✓')).toBeInTheDocument();
    expect(screen.queryByText('Potential ✗')).not.toBeInTheDocument();
  });

  it('level slider spans 1–62 and reports changes', () => {
    const { container } = render(<CombatantCard {...defaultProps} />);
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.min).toBe('1');
    expect(slider.max).toBe('62');
    fireEvent.change(slider, { target: { value: '62' } });
    expect(defaultProps.onUpdateLevel).toHaveBeenCalledWith('mei-lin', 62);
  });

  it('renders edit sections in the order Level → Manifest Ego → Potential', async () => {
    const user = userEvent.setup();
    const { container } = render(<CombatantCard {...defaultProps} />);
    await enterEditMode(user);
    const labels = Array.from(container.querySelectorAll('.section-header')).map((el) =>
      el.textContent?.replace(/\d+ \/ \d+|T\d/g, '').trim(),
    );
    expect(labels).toEqual(['Level', 'Manifest Ego', 'Potential']);
  });

  it('renders the Manifest Ego row as T0–T6 and reports the numeric rank', async () => {
    const user = userEvent.setup();
    const { container } = render(<CombatantCard {...defaultProps} />);
    await enterEditMode(user);
    const rungs = Array.from(container.querySelectorAll<HTMLButtonElement>('.ego-row .toggle-btn'));
    expect(rungs.map((b) => b.textContent)).toEqual(['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6']);
    await user.click(screen.getByRole('button', { name: 'T6' }));
    expect(defaultProps.onUpdateEgo).toHaveBeenCalledWith('mei-lin', 6);
  });

  it('toggles Potential through the confirm checkbox', async () => {
    const user = userEvent.setup();
    render(<CombatantCard {...defaultProps} />);
    await enterEditMode(user);
    const checkbox = screen.getByText('Potential Fully Unlocked').closest('button') as HTMLElement;
    // First click arms the confirmation, second commits.
    await user.click(checkbox);
    expect(defaultProps.onTogglePotential).not.toHaveBeenCalled();
    await user.click(checkbox);
    expect(defaultProps.onTogglePotential).toHaveBeenCalledWith('mei-lin', true);
  });

  it('calls onRemove from the remove control', async () => {
    const user = userEvent.setup();
    render(<CombatantCard {...defaultProps} />);
    await user.click(screen.getByTitle('Remove Combatant'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('mei-lin', expect.any(Object));
  });

  it('calls onToggleFavorite from the favorite control', async () => {
    const user = userEvent.setup();
    const { container } = render(<CombatantCard {...defaultProps} />);
    await user.click(container.querySelector('.favorite-btn') as HTMLButtonElement);
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('mei-lin', true);
  });

  it('fires onEditCommit when the edit toggle collapses the card', async () => {
    const user = userEvent.setup();
    const onEditCommit = vi.fn();
    render(<CombatantCard {...defaultProps} onEditCommit={onEditCommit} />);
    await enterEditMode(user);
    await user.click(screen.getByTitle('Done editing'));
    expect(onEditCommit).toHaveBeenCalledTimes(1);
  });
});
