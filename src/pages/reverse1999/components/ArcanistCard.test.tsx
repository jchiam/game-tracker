import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ArcanistCard } from '@/pages/reverse1999/components/ArcanistCard';
import type { R1999TrackedArcanist } from '@/types';

// ImageKit is not configured in tests — getMugshotUrl returns the path unchanged.
function makeArcanist(overrides: Partial<R1999TrackedArcanist> = {}): R1999TrackedArcanist {
  return {
    id: 'arc-1',
    name: 'Regulus',
    afflatus: 'Star',
    damageType: 'Mental',
    imageUrl: '/assets/regulus.webp',
    hasEuphoria: false,
    dbId: 'db-1',
    isFavorited: false,
    level: 40,
    portraitLevel: 0,
    resonanceLevel: 0,
    euphoriaStage: 0,
    psychubeName: null,
    psychubeLevel: 1,
    psychubeAmplification: 1,
    ...overrides,
  };
}

const defaultProps = {
  onRemove: vi.fn(),
  onUpdateLevel: vi.fn(),
  onUpdatePortrait: vi.fn(),
  onUpdateResonance: vi.fn(),
  onUpdateEuphoriaStage: vi.fn(),
  onUpdatePsychube: vi.fn(),
  onUpdatePsychubeAmplification: vi.fn(),
  onToggleFavorite: vi.fn(),
};

function openEditMode() {
  fireEvent.click(screen.getByTitle('Edit'));
}

describe('ArcanistCard', () => {
  it('renders the arcanist name', () => {
    render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    expect(screen.getByText('Regulus')).toBeInTheDocument();
  });

  it('renders stat chips in static mode', () => {
    const { container } = render(
      <ArcanistCard arcanist={makeArcanist({ level: 55 })} {...defaultProps} />,
    );
    const statsRow = container.querySelector('.arcanist-static-stats') as HTMLElement;
    expect(within(statsRow).getByText('Lv 55')).toBeInTheDocument();
    expect(within(statsRow).getByText('P0')).toBeInTheDocument();
    expect(within(statsRow).getByText('R0')).toBeInTheDocument();
    expect(within(statsRow).getByText('E0')).toBeInTheDocument();
  });

  it('renders "—" when no psychube is equipped', () => {
    const { container } = render(
      <ArcanistCard arcanist={makeArcanist({ psychubeName: null })} {...defaultProps} />,
    );
    expect(container.querySelector('.no-psychube')).toBeInTheDocument();
  });

  it('shows the edit toggle button', () => {
    render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
  });

  it('toggles to edit mode and shows done button', () => {
    const { container } = render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    openEditMode();
    expect(screen.getByTitle('Done editing')).toBeInTheDocument();
    expect(container.querySelector('.game-card-body.is-editing')).toBeInTheDocument();
  });

  it('renders the current level value in edit body', () => {
    render(<ArcanistCard arcanist={makeArcanist({ level: 55 })} {...defaultProps} />);
    // The "55 / 60" label is in the edit body (always in DOM)
    expect(screen.getByText('55 / 60')).toBeInTheDocument();
  });

  it('renders afflatus badge', () => {
    render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    expect(screen.getByText('Star')).toBeInTheDocument();
  });

  it('renders damage type badge', () => {
    render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    expect(screen.getByText('Mental')).toBeInTheDocument();
  });

  it('shows unfavorite star when favorited', () => {
    render(<ArcanistCard arcanist={makeArcanist({ isFavorited: true })} {...defaultProps} />);
    expect(screen.getByTitle('Unfavorite Arcanist')).toBeInTheDocument();
  });

  it('shows favorite star when not favorited', () => {
    render(<ArcanistCard arcanist={makeArcanist({ isFavorited: false })} {...defaultProps} />);
    expect(screen.getByTitle('Favorite Arcanist')).toBeInTheDocument();
  });

  it('calls onToggleFavorite when favorite button is clicked', () => {
    const onToggleFavorite = vi.fn();
    render(
      <ArcanistCard
        arcanist={makeArcanist()}
        {...defaultProps}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    fireEvent.click(screen.getByTitle('Favorite Arcanist'));
    expect(onToggleFavorite).toHaveBeenCalledWith('arc-1', true);
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle('Remove Arcanist'));
    expect(onRemove).toHaveBeenCalledWith('arc-1', expect.any(Object));
  });

  it('calls onUpdateLevel when level slider changes', () => {
    const onUpdateLevel = vi.fn();
    render(
      <ArcanistCard arcanist={makeArcanist()} {...defaultProps} onUpdateLevel={onUpdateLevel} />,
    );
    fireEvent.change(screen.getByDisplayValue('40'), { target: { value: '60' } });
    expect(onUpdateLevel).toHaveBeenCalledWith('arc-1', 60);
  });

  it('renders all euphoria stage buttons', () => {
    const { container } = render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    const euphoriaRow = container.querySelector('.euphoria-row') as HTMLElement;
    expect(within(euphoriaRow).getByText('E0')).toBeInTheDocument();
    expect(within(euphoriaRow).getByText('E4')).toBeInTheDocument();
  });

  it('marks the current euphoria stage as active', () => {
    const { container } = render(
      <ArcanistCard arcanist={makeArcanist({ euphoriaStage: 2 })} {...defaultProps} />,
    );
    const euphoriaRow = container.querySelector('.euphoria-row') as HTMLElement;
    expect(within(euphoriaRow).getByText('E2')).toHaveClass('active');
    expect(within(euphoriaRow).getByText('E1')).not.toHaveClass('active');
  });

  it('calls onUpdateEuphoriaStage when a euphoria button is clicked', () => {
    const onUpdateEuphoriaStage = vi.fn();
    const { container } = render(
      <ArcanistCard
        arcanist={makeArcanist()}
        {...defaultProps}
        onUpdateEuphoriaStage={onUpdateEuphoriaStage}
      />,
    );
    const euphoriaRow = container.querySelector('.euphoria-row') as HTMLElement;
    fireEvent.click(within(euphoriaRow).getByText('E3'));
    expect(onUpdateEuphoriaStage).toHaveBeenCalledWith('arc-1', 3);
  });

  // --- Image loading states ---

  it('shows the loading spinner before the image loads', () => {
    const { container } = render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    expect(container.querySelector('.game-card-image-spinner')).toBeInTheDocument();
  });

  it('hides the loading spinner after the image loads successfully', () => {
    const { container } = render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    fireEvent.load(screen.getByAltText('Regulus'));
    expect(container.querySelector('.game-card-image-spinner')).not.toBeInTheDocument();
  });

  it('hides the loading spinner and falls back to ui-avatars when the image fails to load', () => {
    const { container } = render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    const img = screen.getByAltText('Regulus');
    fireEvent.error(img);
    expect(container.querySelector('.game-card-image-spinner')).not.toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
  });
});
