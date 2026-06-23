import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterCard } from '@/pages/honkai-star-rail/components/CharacterCard';
import type { HsrTrackedCharacter } from '@/types';

vi.mock('@/utils/relicScoring', () => ({
  calculateRelicScore: vi.fn().mockReturnValue(0),
}));
vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => `https://ik.imagekit.io/test${path}`,
  getRelicIconUrl: (path: string) => `https://ik.imagekit.io/test${path}`,
}));
import { calculateRelicScore } from '@/utils/relicScoring';

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
    render(
      <CharacterCard char={makeChar()} {...defaultProps} onToggleFavorite={onToggleFavorite} />,
    );
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

  // --- Traces checkbox ---

  it('calls onToggleTraces after two clicks (confirm flow)', () => {
    const onToggleTraces = vi.fn();
    render(<CharacterCard char={makeChar()} {...defaultProps} onToggleTraces={onToggleTraces} />);
    fireEvent.click(screen.getByText('All Traces Attained'));
    // First click sets confirming state — label changes
    fireEvent.click(screen.getByText('Click to confirm'));
    expect(onToggleTraces).toHaveBeenCalledWith('char-1', true);
  });

  // --- Score badge tier classes ---

  it('applies tier-s class to score badge when score is 80 or above', () => {
    vi.mocked(calculateRelicScore).mockReturnValue(80);
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
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.score-badge.tier-s')).toBeInTheDocument();
  });

  it('applies tier-a class to score badge when score is between 50 and 79', () => {
    vi.mocked(calculateRelicScore).mockReturnValue(65);
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
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.score-badge.tier-a')).toBeInTheDocument();
  });

  it('applies tier-b class to score badge when score is below 50', () => {
    vi.mocked(calculateRelicScore).mockReturnValue(30);
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
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.score-badge.tier-b')).toBeInTheDocument();
  });

  // --- Relic slot rendering ---

  it('renders all 6 relic slots', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(container.querySelectorAll('.relic-slot')).toHaveLength(6);
  });

  it('marks a relic slot as active when a relic with a setId is equipped', () => {
    const char = makeChar({
      relics: {
        ...emptyRelics,
        head: { setId: '101', mainStat: 'HP', subStats: [] },
      },
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.relic-slot.active')).toBeInTheDocument();
  });

  it('shows a relic set icon image when the equipped set is found in availableRelicSets', () => {
    const char = makeChar({
      relics: {
        ...emptyRelics,
        head: { setId: '101', mainStat: 'HP', subStats: [] },
      },
    });
    render(
      <CharacterCard
        char={char}
        {...defaultProps}
        availableRelicSets={[
          { id: '101', name: 'Passerby of Wandering Cloud', icon: '/icon1.png' },
        ]}
      />,
    );
    expect(screen.getByAltText('Relic')).toBeInTheDocument();
  });

  // --- Image error handling ---

  it('resolves character portrait via ImageKit CDN', () => {
    render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(screen.getByAltText('Acheron')).toHaveAttribute(
      'src',
      expect.stringContaining('ik.imagekit.io'),
    );
  });

  it('falls back to ui-avatars when the character image fails to load', () => {
    render(<CharacterCard char={makeChar()} {...defaultProps} />);
    const img = screen.getByAltText('Acheron');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
  });

  it('hides the relic set icon when it fails to load', () => {
    const char = makeChar({
      relics: {
        ...emptyRelics,
        head: { setId: '101', mainStat: 'HP', subStats: [] },
      },
    });
    render(
      <CharacterCard
        char={char}
        {...defaultProps}
        availableRelicSets={[
          { id: '101', name: 'Passerby of Wandering Cloud', icon: '/icon1.png' },
        ]}
      />,
    );
    const relicImg = screen.getByAltText('Relic');
    fireEvent.error(relicImg);
    expect(relicImg).toHaveStyle({ display: 'none' });
  });

  // --- Favorite button direction ---

  it('calls onToggleFavorite with false when unfavoriting a favorited character', () => {
    const onToggleFavorite = vi.fn();
    render(
      <CharacterCard
        char={makeChar({ isFavorited: true })}
        {...defaultProps}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    fireEvent.click(screen.getByTitle('Unfavorite Character'));
    expect(onToggleFavorite).toHaveBeenCalledWith('char-1', false);
  });

  it('favorite button has active class when character is favorited', () => {
    const { container } = render(
      <CharacterCard char={makeChar({ isFavorited: true })} {...defaultProps} />,
    );
    expect(container.querySelector('.favorite-btn.active')).toBeInTheDocument();
  });

  it('favorite button does not have active class when character is not favorited', () => {
    const { container } = render(
      <CharacterCard char={makeChar({ isFavorited: false })} {...defaultProps} />,
    );
    expect(container.querySelector('.favorite-btn.active')).not.toBeInTheDocument();
  });

  // --- Relic fallback icons ---

  it('shows ⬡ fallback for a cavern slot when equipped set is not in availableRelicSets', () => {
    const char = makeChar({
      relics: { ...emptyRelics, head: { setId: '101', mainStat: 'HP', subStats: [] } },
    });
    render(
      <CharacterCard
        char={char}
        {...defaultProps}
        availableRelicSets={[{ id: '999', name: 'Other Set', icon: '/other.png' }]}
      />,
    );
    expect(screen.getAllByText('⬡').length).toBeGreaterThan(0);
  });

  it('shows ○ fallback for a planar slot when equipped set is not in availableRelicSets', () => {
    const char = makeChar({
      relics: { ...emptyRelics, sphere: { setId: '301', mainStat: 'ATK%', subStats: [] } },
    });
    render(
      <CharacterCard
        char={char}
        {...defaultProps}
        availableRelicSets={[{ id: '999', name: 'Other Set', icon: '/other.png' }]}
      />,
    );
    expect(screen.getAllByText('○').length).toBeGreaterThan(0);
  });

  it('resolves relic icon via ImageKit CDN when icon is a local asset path', () => {
    const char = makeChar({
      relics: { ...emptyRelics, head: { setId: '101', mainStat: 'HP', subStats: [] } },
    });
    render(
      <CharacterCard
        char={char}
        {...defaultProps}
        availableRelicSets={[
          { id: '101', name: 'Test Set', icon: '/assets/honkai-star-rail/relics/101.png' },
        ]}
      />,
    );
    expect(screen.getByAltText('Relic')).toHaveAttribute(
      'src',
      expect.stringContaining('ik.imagekit.io'),
    );
  });

  // --- Build preferences operator rendering ---

  it('renders >= operator as ≥ in build preferences display', () => {
    const char = makeChar({
      buildPreferences: {
        mainStats: {
          body: [
            { stat: 'CRIT Rate', operator: '>=', orderIndex: 0 },
            { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
          ],
          feet: [],
          sphere: [],
          rope: [],
        },
        subStats: [],
      },
    });
    render(<CharacterCard char={char} {...defaultProps} />);
    expect(screen.getByText('≥')).toBeInTheDocument();
  });

  // --- Score badge value ---

  it('score badge displays the score value in X.Y% format', () => {
    vi.mocked(calculateRelicScore).mockReturnValue(72.5);
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
    expect(screen.getByText('72.5%')).toBeInTheDocument();
  });
});
