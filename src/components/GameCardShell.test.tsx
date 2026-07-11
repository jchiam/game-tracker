import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCardShell } from '@/components/GameCardShell';
import { getProgressStyle } from '@/utils/progressGradient';

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => `https://ik.imagekit.io/test${path}`,
}));

const defaultProps = {
  name: 'Test Entity',
  imageUrl: '/assets/test.webp',
  entityNoun: 'Character',
  isFavorited: false,
  onToggleFavorite: vi.fn(),
  onRemove: vi.fn(),
  badges: <span>badge-slot</span>,
  summaryStats: <span>stats-slot</span>,
  summaryLine: <span>line-slot</span>,
  editBody: <span>edit-slot</span>,
};

describe('GameCardShell', () => {
  it('renders the name as the card title and image alt', () => {
    render(<GameCardShell {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Test Entity' })).toBeInTheDocument();
    expect(screen.getByAltText('Test Entity')).toBeInTheDocument();
  });

  it('resolves the image via ImageKit', () => {
    render(<GameCardShell {...defaultProps} />);
    expect(screen.getByAltText('Test Entity')).toHaveAttribute(
      'src',
      expect.stringContaining('ik.imagekit.io'),
    );
  });

  it('renders all slots in their structural containers', () => {
    const { container } = render(<GameCardShell {...defaultProps} />);
    expect(container.querySelector('.game-card-badges')).toHaveTextContent('badge-slot');
    expect(container.querySelector('.game-card-static-stats')).toHaveTextContent('stats-slot');
    expect(container.querySelector('.game-card-static-line')).toHaveTextContent('line-slot');
    expect(container.querySelector('.game-card-edit-body-inner')).toHaveTextContent('edit-slot');
  });

  it('wraps the summary content in the measured inner element', () => {
    // Both height budgets must be measured from never-clipped inner wrappers —
    // measuring the outer (max-height-capped) element mid-transition shrank
    // the reopen budget and clipped the static line after an edit cycle.
    const { container } = render(<GameCardShell {...defaultProps} />);
    const inner = container.querySelector('.game-card-static-summary-inner');
    expect(inner).not.toBeNull();
    expect(inner!.parentElement).toHaveClass('game-card-static-summary');
    expect(inner!.querySelector('.game-card-static-stats')).not.toBeNull();
    expect(inner!.querySelector('.game-card-static-line')).not.toBeNull();
  });

  it('renders headerExtra next to the edit toggle', () => {
    const { container } = render(
      <GameCardShell {...defaultProps} headerExtra={<span>extra-slot</span>} />,
    );
    expect(container.querySelector('.game-card-header-actions')).toHaveTextContent('extra-slot');
  });

  // --- Favorite / remove ---

  it('titles buttons with the entity noun', () => {
    render(<GameCardShell {...defaultProps} entityNoun="Arcanist" />);
    expect(screen.getByTitle('Favorite Arcanist')).toBeInTheDocument();
    expect(screen.getByTitle('Remove Arcanist')).toBeInTheDocument();
  });

  it('calls onToggleFavorite with the inverted value', () => {
    const onToggleFavorite = vi.fn();
    render(<GameCardShell {...defaultProps} onToggleFavorite={onToggleFavorite} />);
    fireEvent.click(screen.getByTitle('Favorite Character'));
    expect(onToggleFavorite).toHaveBeenCalledWith(true);
  });

  it('calls onToggleFavorite with false when already favorited', () => {
    const onToggleFavorite = vi.fn();
    render(
      <GameCardShell {...defaultProps} isFavorited={true} onToggleFavorite={onToggleFavorite} />,
    );
    fireEvent.click(screen.getByTitle('Unfavorite Character'));
    expect(onToggleFavorite).toHaveBeenCalledWith(false);
  });

  it('marks the favorite button active when favorited', () => {
    render(<GameCardShell {...defaultProps} isFavorited={true} />);
    expect(screen.getByTitle('Unfavorite Character')).toHaveClass('active');
  });

  it('calls onRemove with the click event', () => {
    const onRemove = vi.fn();
    render(<GameCardShell {...defaultProps} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle('Remove Character'));
    expect(onRemove).toHaveBeenCalledWith(expect.any(Object));
  });

  // --- Edit toggle / collapse ---

  it('toggles is-editing on the body and hides it again on second click', () => {
    const { container } = render(<GameCardShell {...defaultProps} />);
    const body = container.querySelector('.game-card-body') as HTMLElement;
    expect(body).not.toHaveClass('is-editing');
    fireEvent.click(screen.getByTitle('Edit'));
    expect(body).toHaveClass('is-editing');
    fireEvent.click(screen.getByTitle('Done editing'));
    expect(body).not.toHaveClass('is-editing');
  });

  // --- Fixed-height summary reserve (opt-in) ---

  it('does not reserve summary rows by default', () => {
    const { container } = render(<GameCardShell {...defaultProps} />);
    expect(container.querySelector('.game-card')).not.toHaveClass('reserve-summary-rows');
  });

  it('tags the card with reserve-summary-rows when opted in', () => {
    const { container } = render(<GameCardShell {...defaultProps} reserveSummaryRows />);
    expect(container.querySelector('.game-card')).toHaveClass('reserve-summary-rows');
  });

  it('marks the edit body aria-hidden until editing', () => {
    const { container } = render(<GameCardShell {...defaultProps} />);
    const editBody = container.querySelector('.game-card-edit-body') as HTMLElement;
    expect(editBody).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(screen.getByTitle('Edit'));
    expect(editBody).toHaveAttribute('aria-hidden', 'false');
  });

  // --- Image loading states ---

  it('shows the loading spinner before the image loads', () => {
    const { container } = render(<GameCardShell {...defaultProps} />);
    expect(container.querySelector('.game-card-image-spinner')).toBeInTheDocument();
  });

  it('hides the loading spinner after the image loads', () => {
    const { container } = render(<GameCardShell {...defaultProps} />);
    fireEvent.load(screen.getByAltText('Test Entity'));
    expect(container.querySelector('.game-card-image-spinner')).not.toBeInTheDocument();
  });

  it('hides the spinner and falls back to ui-avatars when the image fails', () => {
    const { container } = render(<GameCardShell {...defaultProps} />);
    const img = screen.getByAltText('Test Entity');
    fireEvent.error(img);
    expect(container.querySelector('.game-card-image-spinner')).not.toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
  });

  describe('anodized temper edge', () => {
    it('wears the ramp colour at the given score', () => {
      const { container } = render(<GameCardShell {...defaultProps} temperScore={92} />);
      const card = container.querySelector('.game-card') as HTMLElement;
      expect(card).toHaveClass('has-temper-edge');
      expect(card.style.getPropertyValue('--temper')).toBe(getProgressStyle(92, 0, 100).color);
    });

    it('edges a score of exactly 0 in rust', () => {
      const { container } = render(<GameCardShell {...defaultProps} temperScore={0} />);
      const card = container.querySelector('.game-card') as HTMLElement;
      expect(card).toHaveClass('has-temper-edge');
      expect(card.style.getPropertyValue('--temper')).toBe(getProgressStyle(0, 0, 100).color);
    });

    it('renders no edge for the negative insufficient-data sentinel', () => {
      const { container } = render(<GameCardShell {...defaultProps} temperScore={-1} />);
      const card = container.querySelector('.game-card') as HTMLElement;
      expect(card).not.toHaveClass('has-temper-edge');
      expect(card.style.getPropertyValue('--temper')).toBe('');
    });

    it('renders no edge when the prop is omitted', () => {
      const { container } = render(<GameCardShell {...defaultProps} />);
      const card = container.querySelector('.game-card') as HTMLElement;
      expect(card).not.toHaveClass('has-temper-edge');
      expect(card.style.getPropertyValue('--temper')).toBe('');
    });
  });
});
