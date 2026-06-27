import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OperatorCard } from './OperatorCard';
import type { EndfieldTrackedOperator } from '@/types';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => path,
}));

function makeOperator(overrides: Partial<EndfieldTrackedOperator> = {}): EndfieldTrackedOperator {
  return {
    id: 'ember',
    name: 'Ember',
    rarity: 6,
    class: 'Defender',
    element: 'Heat',
    weapon: 'Greatsword',
    imageUrl: '/assets/arknights-endfield/operators/ember.webp',
    dbId: 'db-1',
    isFavorited: false,
    level: 45,
    potential: 3,
    ...overrides,
  };
}

describe('OperatorCard', () => {
  const defaultProps = {
    operator: makeOperator(),
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdatePotential: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Render ---

  it('renders operator name and badges', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByText('Ember')).toBeInTheDocument();
    expect(screen.getByText('Defender')).toBeInTheDocument();
    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.getByText('Greatsword')).toBeInTheDocument();
  });

  it('renders level and potential stat chips', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByText('Lv 45')).toBeInTheDocument();
    expect(screen.getAllByText('P3').length).toBeGreaterThanOrEqual(1);
  });

  it('renders rarity stars for 6-star', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByText('★★★★★★')).toBeInTheDocument();
  });

  it('renders rarity stars for 5-star', () => {
    render(<OperatorCard {...defaultProps} operator={makeOperator({ rarity: 5 })} />);
    expect(screen.getByText('★★★★★')).toBeInTheDocument();
  });

  it('renders rarity stars for 4-star', () => {
    render(<OperatorCard {...defaultProps} operator={makeOperator({ rarity: 4 })} />);
    expect(screen.getByText('★★★★')).toBeInTheDocument();
  });

  // --- Investment gradient wiring (shared rust→teal color language) ---

  it('colors the level chip by investment — rust at min, teal at max', () => {
    const { rerender } = render(
      <OperatorCard {...defaultProps} operator={makeOperator({ level: 1 })} />,
    );
    const lowChip = screen.getByText('Lv 1');
    expect(lowChip.style.color).toBe('rgb(138, 96, 80)'); // rust
    expect(lowChip.style.borderColor).toBe('rgba(138, 96, 80, 0.5)');

    rerender(<OperatorCard {...defaultProps} operator={makeOperator({ level: 90 })} />);
    expect(screen.getByText('Lv 90').style.color).toBe('rgb(64, 200, 160)'); // teal
  });

  it('colors the potential chip by investment', () => {
    // Scope to the summary chip — `P0` also appears as an edit-body button.
    const { container } = render(
      <OperatorCard {...defaultProps} operator={makeOperator({ potential: 0 })} />,
    );
    const chips = container.querySelectorAll<HTMLElement>('.game-card-static-stats .stat-chip');
    const potentialChip = chips[1]; // [0] = Lv, [1] = P
    expect(potentialChip).toHaveTextContent('P0');
    expect(potentialChip.style.color).toBe('rgb(138, 96, 80)'); // rust at potential 0
  });

  it('drives the level slider fill from the investment gradient via the canonical class', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} operator={makeOperator({ level: 1 })} />);
    await user.click(screen.getByTitle('Edit'));
    const slider = screen.getByRole('slider');
    expect(slider).toHaveClass('level-slider');
    expect(slider).not.toHaveClass('character-slider');
    expect(slider.style.getPropertyValue('--slider-fill-color')).toBe('rgb(138, 96, 80)');
  });

  it('renders no gear one-liner — AE operators have no equippable gear', () => {
    const { container } = render(<OperatorCard {...defaultProps} />);
    expect(container.querySelector('.game-card-static-line')).toBeNull();
  });

  it('does not gradient-color the rarity stars (rarity is intrinsic, not investment)', () => {
    const { container } = render(<OperatorCard {...defaultProps} />);
    const rarity = container.querySelector<HTMLElement>('.rarity-indicator');
    expect(rarity).not.toBeNull();
    expect(rarity!.style.color).toBe('');
  });

  // --- Favorite ---

  it('calls onToggleFavorite with true when favoriting', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Favorite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('ember', true);
  });

  it('calls onToggleFavorite with false when unfavoriting', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} operator={makeOperator({ isFavorited: true })} />);
    await user.click(screen.getByTitle('Unfavorite'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('ember', false);
  });

  it('favorite button has active class when favorited', () => {
    render(<OperatorCard {...defaultProps} operator={makeOperator({ isFavorited: true })} />);
    expect(screen.getByTitle('Unfavorite')).toHaveClass('active');
  });

  it('favorite button does not have active class when not favorited', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByTitle('Favorite')).not.toHaveClass('active');
  });

  // --- Remove ---

  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Remove Operator'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('ember', expect.any(Object));
  });

  // --- Edit toggle ---

  it('shows edit button with pencil icon by default', () => {
    render(<OperatorCard {...defaultProps} />);
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Edit')).toHaveTextContent('✎');
  });

  it('toggles to editing mode when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByTitle('Done editing')).toBeInTheDocument();
    expect(screen.getByTitle('Done editing')).toHaveTextContent('✓');
  });

  it('edit toggle button has active class in editing mode', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByTitle('Done editing')).toHaveClass('active');
  });

  it('card has is-editing class when in edit mode', async () => {
    const user = userEvent.setup();
    const { container } = render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(container.querySelector('.game-card')).toHaveClass('is-editing');
  });

  // --- Level slider ---

  it('renders level slider with correct value', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('45');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '90');
  });

  it('calls onUpdateLevel when slider changes', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '60' } });
    expect(defaultProps.onUpdateLevel).toHaveBeenCalledWith('ember', 60);
  });

  // --- Potential buttons ---

  it('renders all 6 potential buttons (P0–P5)', () => {
    render(<OperatorCard {...defaultProps} />);
    for (let p = 0; p <= 5; p++) {
      expect(screen.getByTitle(`P${p}`)).toBeInTheDocument();
    }
  });

  it('calls onUpdatePotential when a potential button is clicked', async () => {
    const user = userEvent.setup();
    render(<OperatorCard {...defaultProps} />);
    await user.click(screen.getByTitle('P5'));
    expect(defaultProps.onUpdatePotential).toHaveBeenCalledWith('ember', 5);
  });

  it('marks potential buttons up to current value as active', () => {
    render(<OperatorCard {...defaultProps} operator={makeOperator({ potential: 3 })} />);
    for (let p = 0; p <= 3; p++) {
      expect(screen.getByTitle(`P${p}`)).toHaveClass('active');
    }
    expect(screen.getByTitle('P4')).not.toHaveClass('active');
    expect(screen.getByTitle('P5')).not.toHaveClass('active');
  });

  // --- Image fallback ---

  it('falls back to ui-avatars when image fails to load', () => {
    render(<OperatorCard {...defaultProps} />);
    const img = screen.getByAltText('Ember');
    fireEvent.error(img);
    expect((img as HTMLImageElement).src).toContain('ui-avatars.com');
    expect((img as HTMLImageElement).src).toContain('Ember');
  });

  it('shows loading spinner initially', () => {
    const { container } = render(<OperatorCard {...defaultProps} />);
    expect(container.querySelector('.game-card-image-spinner')).toBeInTheDocument();
  });

  it('hides loading spinner after image loads', () => {
    const { container } = render(<OperatorCard {...defaultProps} />);
    const img = screen.getByAltText('Ember');
    fireEvent.load(img);
    expect(container.querySelector('.game-card-image-spinner')).not.toBeInTheDocument();
  });
});
