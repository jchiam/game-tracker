import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    dbId: 'db-1',
    isFavorited: false,
    level: 40,
    insightLevel: 2,
    portraitLevel: 0,
    resonanceLevel: 0,
    psychubeId: null,
    psychubeLevel: 0,
    ...overrides,
  };
}

const defaultProps = {
  onRemove: vi.fn(),
  onUpdateLevel: vi.fn(),
  onUpdateInsight: vi.fn(),
  onUpdatePortrait: vi.fn(),
  onUpdateResonance: vi.fn(),
  onUpdatePsychube: vi.fn(),
  onToggleFavorite: vi.fn(),
};

describe('ArcanistCard', () => {
  it('renders the arcanist name', () => {
    render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    expect(screen.getByText('Regulus')).toBeInTheDocument();
  });

  it('renders the current level', () => {
    render(<ArcanistCard arcanist={makeArcanist({ level: 55 })} {...defaultProps} />);
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

  it('renders all insight level buttons', () => {
    render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    expect(screen.getByText('I0')).toBeInTheDocument();
    expect(screen.getByText('I1')).toBeInTheDocument();
    expect(screen.getByText('I2')).toBeInTheDocument();
    expect(screen.getByText('I3')).toBeInTheDocument();
  });

  it('marks the current insight level as active', () => {
    render(<ArcanistCard arcanist={makeArcanist({ insightLevel: 2 })} {...defaultProps} />);
    expect(screen.getByText('I2')).toHaveClass('active');
    expect(screen.getByText('I1')).not.toHaveClass('active');
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

  it('calls onUpdateInsight when an insight button is clicked', () => {
    const onUpdateInsight = vi.fn();
    render(
      <ArcanistCard
        arcanist={makeArcanist()}
        {...defaultProps}
        onUpdateInsight={onUpdateInsight}
      />,
    );
    fireEvent.click(screen.getByText('I3'));
    expect(onUpdateInsight).toHaveBeenCalledWith('arc-1', 3);
  });

  // --- Image loading states ---

  it('shows the loading spinner before the image loads', () => {
    const { container } = render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    expect(container.querySelector('.arcanist-image-spinner')).toBeInTheDocument();
  });

  it('hides the loading spinner after the image loads successfully', () => {
    const { container } = render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    fireEvent.load(screen.getByAltText('Regulus'));
    expect(container.querySelector('.arcanist-image-spinner')).not.toBeInTheDocument();
  });

  it('hides the loading spinner and falls back to ui-avatars when the image fails to load', () => {
    const { container } = render(<ArcanistCard arcanist={makeArcanist()} {...defaultProps} />);
    const img = screen.getByAltText('Regulus');
    fireEvent.error(img);
    expect(container.querySelector('.arcanist-image-spinner')).not.toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
  });
});
