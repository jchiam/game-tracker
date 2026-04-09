import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterCard } from '@/pages/honkai-star-rail/components/CharacterCard';
import type { HsrTrackedCharacter } from '@/types';

const emptyRelics: HsrTrackedCharacter['relics'] = {
  head: null,
  hands: null,
  body: null,
  feet: null,
  sphere: null,
  rope: null,
};

const emptyPrefs: HsrTrackedCharacter['buildPreferences'] = {
  mainStats: { body: [], feet: [], sphere: [], rope: [] },
  subStats: [],
};

function makeChar(overrides: Partial<HsrTrackedCharacter> = {}): HsrTrackedCharacter {
  return {
    id: 'char-1',
    name: 'Acheron',
    element: 'Thunder',
    path: 'Nihility',
    imageUrl: '/assets/acheron.webp',
    dbId: 'db-1',
    isFavorited: false,
    level: 60,
    tracesAttained: false,
    relics: emptyRelics,
    buildPreferences: emptyPrefs,
    ...overrides,
  };
}

const defaultProps = {
  availableRelicSets: [],
  onRemove: vi.fn(),
  onUpdateLevel: vi.fn(),
  onToggleTraces: vi.fn(),
  onToggleFavorite: vi.fn(),
  onToggleRelic: vi.fn(),
};

describe('CharacterCard', () => {
  it('renders the character name', () => {
    render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(screen.getByText('Acheron')).toBeInTheDocument();
  });

  it('renders the current level', () => {
    render(<CharacterCard char={makeChar({ level: 75 })} {...defaultProps} />);
    expect(screen.getByText('75 / 80')).toBeInTheDocument();
  });

  it('renders element badge', () => {
    render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(screen.getByText('Thunder')).toBeInTheDocument();
  });

  it('renders path badge', () => {
    render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(screen.getByText('Nihility')).toBeInTheDocument();
  });

  it('shows unfavorite star when favorited', () => {
    render(<CharacterCard char={makeChar({ isFavorited: true })} {...defaultProps} />);
    expect(screen.getByTitle('Unfavorite Character')).toBeInTheDocument();
  });

  it('shows favorite star when not favorited', () => {
    render(<CharacterCard char={makeChar({ isFavorited: false })} {...defaultProps} />);
    expect(screen.getByTitle('Favorite Character')).toBeInTheDocument();
  });

  it('calls onToggleFavorite when favorite button is clicked', () => {
    const onToggleFavorite = vi.fn();
    render(<CharacterCard char={makeChar()} {...defaultProps} onToggleFavorite={onToggleFavorite} />);
    fireEvent.click(screen.getByTitle('Favorite Character'));
    expect(onToggleFavorite).toHaveBeenCalledWith('char-1', true);
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<CharacterCard char={makeChar()} {...defaultProps} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle('Remove Character'));
    expect(onRemove).toHaveBeenCalledWith('char-1', expect.any(Object));
  });

  it('calls onUpdateLevel when level slider changes', () => {
    const onUpdateLevel = vi.fn();
    render(<CharacterCard char={makeChar()} {...defaultProps} onUpdateLevel={onUpdateLevel} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '80' } });
    expect(onUpdateLevel).toHaveBeenCalledWith('char-1', 80);
  });

  it('calls onToggleRelic when a relic slot is clicked', () => {
    const onToggleRelic = vi.fn();
    render(<CharacterCard char={makeChar()} {...defaultProps} onToggleRelic={onToggleRelic} />);
    fireEvent.click(screen.getByTitle(/^Head/));
    expect(onToggleRelic).toHaveBeenCalledWith('char-1', 'head');
  });

  it('does not show score badge when no build preferences are set', () => {
    render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it('shows build preferences when they are set', () => {
    const char = makeChar({
      buildPreferences: {
        mainStats: {
          body: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
          feet: [],
          sphere: [],
          rope: [],
        },
        subStats: [],
      },
    });
    render(<CharacterCard char={char} {...defaultProps} />);
    expect(screen.getByText('CRIT Rate')).toBeInTheDocument();
  });

  it('shows build comments when set', () => {
    const char = makeChar({
      buildPreferences: {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
        comments: 'Prioritize CRIT',
      },
    });
    render(<CharacterCard char={char} {...defaultProps} />);
    expect(screen.getByText('Prioritize CRIT')).toBeInTheDocument();
  });
});
