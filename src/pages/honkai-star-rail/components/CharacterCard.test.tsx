import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CharacterCard } from '@/pages/honkai-star-rail/components/CharacterCard';
import { ALL_LIGHT_CONES } from '@/data/honkai-star-rail/light_cones';
import type { HsrTrackedCharacter } from '@/types';

vi.mock('@/utils/relicScoring', () => ({
  calculateRelicScore: vi.fn().mockReturnValue(-1),
}));
vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: (path: string) => `https://ik.imagekit.io/test${path}`,
  getRelicIconUrl: (path: string) => `https://ik.imagekit.io/test${path}`,
  getLightConeUrl: (path: string) => `https://ik.imagekit.io/test${path}`,
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
    lightConeId: null,
    lightConeLevel: 1,
    lightConeSuperimposition: 1,
    lightConePreferences: [],
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
  onUpdateLightCone: vi.fn(),
  onUpdateLightConeLevel: vi.fn(),
  onUpdateLightConeSuperimposition: vi.fn(),
  onEditLightConePrefs: vi.fn(),
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
    // Slider lives in the edit body (aria-hidden until editing) — open edit mode first
    fireEvent.click(screen.getByTitle('Edit'));
    // First slider is the character level; the second is the light cone level
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '80' } });
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

  // --- Score badge grade classes ---

  it('applies grade-a class to score badge for a score of 80', () => {
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
    expect(container.querySelector('.score-badge.grade-a')).toBeInTheDocument();
  });

  it('wears the temper edge when scored, none for the sentinel', () => {
    vi.mocked(calculateRelicScore).mockReturnValue(80);
    const scored = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(scored.container.querySelector('.game-card.has-temper-edge')).toBeInTheDocument();
    scored.unmount();
    vi.mocked(calculateRelicScore).mockReturnValue(-1);
    const sentinel = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(sentinel.container.querySelector('.game-card.has-temper-edge')).not.toBeInTheDocument();
  });

  it('applies grade-b class to score badge for a score of 65', () => {
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
    expect(container.querySelector('.score-badge.grade-b')).toBeInTheDocument();
  });

  it('applies grade-c class to score badge for a score of 30', () => {
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
    expect(container.querySelector('.score-badge.grade-c')).toBeInTheDocument();
  });

  // --- Blended build score (Light Cone side) ---

  it('lowers the badge grade when the equipped cone is off-build', () => {
    vi.mocked(calculateRelicScore).mockReturnValue(80);
    const char = makeChar({
      lightConePreferences: [ALL_LIGHT_CONES[0].id],
      lightConeId: ALL_LIGHT_CONES[1].id,
    });
    // 0.25 × 0 + 0.75 × 0.80 = 60 → B instead of the relic-only A
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.score-badge.grade-b')).toBeInTheDocument();
  });

  it('shows the badge from the cone side alone when the relic score is -1', () => {
    vi.mocked(calculateRelicScore).mockReturnValue(-1);
    const char = makeChar({
      lightConePreferences: [ALL_LIGHT_CONES[0].id],
      lightConeId: ALL_LIGHT_CONES[0].id,
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.score-badge.grade-s')).toBeInTheDocument();
  });

  // --- Relic slot rendering ---

  it('renders all 6 relic slots in the shared equip-slot grid', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(container.querySelector('.equip-slot-grid')).toBeInTheDocument();
    expect(container.querySelectorAll('.equip-slot-cell')).toHaveLength(6);
  });

  it('marks a relic slot as active when a relic with a setId is equipped', () => {
    const char = makeChar({
      relics: {
        ...emptyRelics,
        head: { setId: '101', mainStat: 'HP', subStats: [] },
      },
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.equip-slot-cell.active')).toBeInTheDocument();
  });

  it('shows the Target Build readout with a Sets row when only set preferences exist', () => {
    const char = makeChar({
      buildPreferences: {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [],
        relicSetId: '101',
        planarSetId: '301',
      },
    });
    const { container } = render(
      <CharacterCard
        char={char}
        {...defaultProps}
        availableRelicSets={[
          { id: '101', name: 'Passerby of Wandering Cloud', icon: '/icon1.png' },
          { id: '301', name: 'Space Sealing Station', icon: '/icon3.png' },
        ]}
      />,
    );
    const readout = container.querySelector('.build-prefs-display');
    expect(readout).not.toBeNull();
    expect(readout!.textContent).toContain('Sets');
    expect(readout!.textContent).toContain('Passerby of Wandering Cloud');
    expect(readout!.textContent).toContain('Space Sealing Station');
  });

  it('falls back to raw set ids in the Sets row when preferred sets are not in availableRelicSets', () => {
    const char = makeChar({
      buildPreferences: {
        mainStats: { body: [], feet: [], sphere: [], rope: [] },
        subStats: [],
        relicSetId: '101',
        planarSetId: '301',
      },
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const readout = container.querySelector('.build-prefs-display');
    expect(readout).not.toBeNull();
    expect(readout!.textContent).toContain('101');
    expect(readout!.textContent).toContain('301');
  });

  it('hides the Target Build readout when no preference of any kind is set', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(container.querySelector('.build-prefs-display')).toBeNull();
  });

  it('renders the level control as the shared LevelSlider with gradient fill', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    const slider = container.querySelector<HTMLInputElement>('input.level-slider');
    expect(slider).toBeInTheDocument();
    expect(slider?.type).toBe('range');
    expect(slider?.style.getPropertyValue('--slider-fill-color')).not.toBe('');
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

  // --- Collapsed summary chips ---

  it('renders the three collapsed-summary chips', () => {
    const { container } = render(
      <CharacterCard char={makeChar({ level: 60 })} {...defaultProps} />,
    );
    const summary = container.querySelector('.game-card-static-summary') as HTMLElement;
    expect(within(summary).getByText('Lv 60')).toBeInTheDocument();
    expect(within(summary).getByText('Traces ✗')).toBeInTheDocument();
    expect(within(summary).getByText('Relics 0/6')).toBeInTheDocument();
  });

  it('relic slot-fill chip reflects the number of equipped slots', () => {
    const char = makeChar({
      relics: {
        ...emptyRelics,
        head: { setId: '101', mainStat: 'HP', subStats: [] },
        hands: { setId: '102', mainStat: 'ATK', subStats: [] },
        body: { setId: '103', mainStat: 'CRIT Rate', subStats: [] },
        feet: { setId: '104', mainStat: 'SPD', subStats: [] },
      },
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const summary = container.querySelector('.game-card-static-summary') as HTMLElement;
    expect(within(summary).getByText('Relics 4/6')).toBeInTheDocument();
  });

  it('traces chip shows ✓ when traces are attained', () => {
    const { container } = render(
      <CharacterCard char={makeChar({ tracesAttained: true })} {...defaultProps} />,
    );
    const summary = container.querySelector('.game-card-static-summary') as HTMLElement;
    expect(within(summary).getByText('Traces ✓')).toBeInTheDocument();
  });

  it('edit toggle expands the card by adding is-editing to the body', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    const body = container.querySelector('.game-card-body') as HTMLElement;
    expect(body).not.toHaveClass('is-editing');
    fireEvent.click(screen.getByTitle('Edit'));
    expect(body).toHaveClass('is-editing');
  });

  // --- Score badge value ---

  it('score badge displays the rounded score value in X% format', () => {
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
    expect(screen.getByText('73%')).toBeInTheDocument();
  });

  // --- Relic set one-liner ---

  it('shows abbreviated relic set names with counts in the summary one-liner', () => {
    const char = makeChar({
      relics: {
        head: { setId: '101', mainStat: 'HP', subStats: [] },
        hands: { setId: '101', mainStat: 'ATK', subStats: [] },
        body: { setId: '101', mainStat: 'CRIT Rate', subStats: [] },
        feet: { setId: '101', mainStat: 'SPD', subStats: [] },
        sphere: { setId: '105', mainStat: 'ATK%', subStats: [] },
        rope: { setId: '105', mainStat: 'Energy', subStats: [] },
      },
    });
    const { container } = render(
      <CharacterCard
        char={char}
        {...defaultProps}
        availableRelicSets={[
          { id: '101', name: 'Passerby of Wandering Cloud', icon: '/icon1.png' },
          { id: '105', name: 'Champion of Streetwise Boxing', icon: '/icon2.png' },
        ]}
      />,
    );
    const line = container.querySelector('.game-card-static-line') as HTMLElement;
    expect(within(line).getByText(/Passerby 4/)).toBeInTheDocument();
    expect(within(line).getByText(/Streetwise 2/)).toBeInTheDocument();
  });

  it('falls back to full name when short name is not mapped', () => {
    const char = makeChar({
      relics: {
        ...emptyRelics,
        head: { setId: '999', mainStat: 'HP', subStats: [] },
      },
    });
    const { container } = render(
      <CharacterCard
        char={char}
        {...defaultProps}
        availableRelicSets={[{ id: '999', name: 'Unknown Future Set', icon: '/icon.png' }]}
      />,
    );
    const line = container.querySelector('.game-card-static-line') as HTMLElement;
    expect(within(line).getByText(/Unknown Future Set 1/)).toBeInTheDocument();
  });

  it('shows dash when no relics are equipped', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    const line = container.querySelector('.game-card-static-line') as HTMLElement;
    expect(line.querySelector('.no-equip')).toBeInTheDocument();
  });

  // --- Light cone ---

  it('shows cone name, level, and superimposition in the summary line when equipped', () => {
    const char = makeChar({
      lightConeId: '23024', // Along the Passing Shore (Nihility)
      lightConeLevel: 80,
      lightConeSuperimposition: 5,
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const line = container.querySelector('.game-card-static-line') as HTMLElement;
    expect(line.textContent).toContain('Along the Passing Shore');
    // Separators use non-breaking spaces
    expect(line.textContent).toContain('Lv 80');
    expect(line.textContent).toContain('S5');
  });

  it('shows the cone icon resolved through ImageKit in the summary line when equipped', () => {
    const char = makeChar({ lightConeId: '23024' }); // Along the Passing Shore (Nihility)
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const icon = container.querySelector<HTMLImageElement>('.cone-icon')!;
    expect(icon).toBeInTheDocument();
    expect(icon.src).toBe(
      'https://ik.imagekit.io/test/assets/honkai-star-rail/light-cones/23024.webp',
    );
  });

  it('renders no cone icon when no light cone is equipped', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(container.querySelector('.cone-icon')).not.toBeInTheDocument();
  });

  // --- Light cone preference strip ---

  it('renders ranked tiles in order with rank badges and separators', () => {
    const char = makeChar({ lightConePreferences: ['23024', '21001', '23034'] });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const strip = container.querySelector('.cone-pref-strip')!;
    const tiles = strip.querySelectorAll('.cone-pref-tile');
    expect(tiles).toHaveLength(3);
    expect(tiles[0].querySelector('.cone-pref-rank')!.textContent).toBe('#1');
    expect(tiles[1].querySelector('.cone-pref-rank')!.textContent).toBe('#2');
    expect(tiles[2].querySelector('.cone-pref-rank')!.textContent).toBe('#3');
    expect(strip.querySelectorAll('.pref-operator-badge')).toHaveLength(2);
    expect(tiles[0].getAttribute('title')).toContain('Along the Passing Shore');
  });

  it('renders no strip when the preference list is empty', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    expect(container.querySelector('.cone-pref-strip')).not.toBeInTheDocument();
  });

  it('resolves tile icons through ImageKit', () => {
    const char = makeChar({ lightConePreferences: ['23024'] });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const img = container.querySelector<HTMLImageElement>('.cone-pref-tile img')!;
    expect(img.src).toBe(
      'https://ik.imagekit.io/test/assets/honkai-star-rail/light-cones/23024.webp',
    );
  });

  it('highlights the equipped tile with the match-rank colour', () => {
    const char = makeChar({
      lightConeId: '21001',
      lightConePreferences: ['23024', '21001'],
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const tiles = container.querySelectorAll<HTMLElement>('.cone-pref-tile');
    expect(tiles[1].classList.contains('active')).toBe(true);
    expect(tiles[1].style.borderColor).not.toBe('');
    expect(tiles[0].classList.contains('active')).toBe(false);
  });

  it('highlights no tile when the equipped cone is off-build', () => {
    const char = makeChar({
      lightConeId: '23010',
      lightConePreferences: ['23024', '21001'],
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.cone-pref-strip .active')).not.toBeInTheDocument();
  });

  it('equips a cone when its tile is clicked', () => {
    const onUpdateLightCone = vi.fn();
    const char = makeChar({ lightConePreferences: ['23024', '21001'] });
    const { container } = render(
      <CharacterCard char={char} {...defaultProps} onUpdateLightCone={onUpdateLightCone} />,
    );
    const tiles = container.querySelectorAll('.cone-pref-tile');
    fireEvent.click(tiles[1]);
    expect(onUpdateLightCone).toHaveBeenCalledWith('char-1', '21001');
  });

  it('does not re-equip when the equipped tile is clicked', () => {
    const onUpdateLightCone = vi.fn();
    const char = makeChar({ lightConeId: '23024', lightConePreferences: ['23024'] });
    const { container } = render(
      <CharacterCard char={char} {...defaultProps} onUpdateLightCone={onUpdateLightCone} />,
    );
    fireEvent.click(container.querySelector('.cone-pref-tile')!);
    expect(onUpdateLightCone).not.toHaveBeenCalled();
  });

  it('caps at five tiles and shows a +N overflow tile that opens the editor', () => {
    const onEditLightConePrefs = vi.fn();
    const char = makeChar({
      lightConePreferences: ['23024', '21001', '23034', 'x1', 'x2', 'x3', 'x4'],
    });
    const { container } = render(
      <CharacterCard char={char} {...defaultProps} onEditLightConePrefs={onEditLightConePrefs} />,
    );
    const strip = container.querySelector('.cone-pref-strip')!;
    expect(strip.querySelectorAll('.cone-pref-tile:not(.cone-pref-overflow)')).toHaveLength(5);
    const overflow = strip.querySelector('.cone-pref-overflow')!;
    expect(overflow.textContent).toContain('+2');
    fireEvent.click(overflow);
    expect(onEditLightConePrefs).toHaveBeenCalledWith('char-1');
  });

  it('renders a rank-only tile with raw-id tooltip for an unknown catalog id', () => {
    const char = makeChar({ lightConePreferences: ['not-a-cone'] });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const tile = container.querySelector('.cone-pref-tile')!;
    expect(tile.getAttribute('title')).toBe('not-a-cone');
    expect(tile.querySelector('img')).not.toBeInTheDocument();
    expect(tile.querySelector('.cone-pref-rank')!.textContent).toBe('#1');
  });

  it('picker lists only cones matching the character path plus the empty option', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    const select = container.querySelector<HTMLSelectElement>('select[name="light-cone-char-1"]')!;
    const nihilityCones = ALL_LIGHT_CONES.filter((lc) => lc.path === 'Nihility');
    expect(select.options).toHaveLength(nihilityCones.length + 1); // + "No Light Cone"
    const labels = Array.from(select.options).map((o) => o.textContent ?? '');
    expect(labels.some((l) => l.includes('A Grounded Ascent'))).toBe(false); // Harmony cone excluded
  });

  it('off-path stored cone id still renders in the summary line', () => {
    const char = makeChar({ lightConeId: '23034' }); // A Grounded Ascent (Harmony) on a Nihility char
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const line = container.querySelector('.game-card-static-line') as HTMLElement;
    expect(line.textContent).toContain('A Grounded Ascent');
  });

  // --- Light cone match badge ---

  it('shows #1 badge when the equipped cone is the first preference', () => {
    const char = makeChar({
      lightConeId: '23024',
      lightConePreferences: ['23024', '21001'],
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const badge = container.querySelector('.cone-match-badge')!;
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('#1');
  });

  it('shows the 1-based rank when the equipped cone sits lower in the list', () => {
    const char = makeChar({
      lightConeId: '23024',
      lightConePreferences: ['21001', '23024'],
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.cone-match-badge')!.textContent).toBe('#2');
  });

  it('shows Off-build when preferences exist but the equipped cone is not listed', () => {
    const char = makeChar({
      lightConeId: '23024',
      lightConePreferences: ['21001'],
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.cone-match-badge')!.textContent).toBe('Off-build');
  });

  it('renders no badge when the preference list is empty', () => {
    const char = makeChar({ lightConeId: '23024' });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.cone-match-badge')).not.toBeInTheDocument();
  });

  it('renders no badge when no cone is equipped even with preferences set', () => {
    const char = makeChar({
      lightConeId: null,
      lightConePreferences: ['23024'],
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    expect(container.querySelector('.cone-match-badge')).not.toBeInTheDocument();
  });

  // --- Equipment section clustering (N2E Console precedent) ---

  it('clusters the edit body into Light Cone and Relics groups with progression outside', () => {
    const { container } = render(<CharacterCard char={makeChar()} {...defaultProps} />);
    const groups = [...container.querySelectorAll<HTMLElement>('.card-section-group')];
    expect(groups).toHaveLength(2);
    const headers = groups.map((g) => g.querySelector('.card-section-group-header')?.textContent);
    expect(headers).toEqual(['Light Cone', 'Relics']);

    // Light Cone group: Equipped + Preferences sections.
    const lcLabels = [
      ...groups[0].querySelectorAll<HTMLElement>('.progress-section .section-header span'),
    ].map((s) => s.textContent);
    expect(lcLabels).toContain('Equipped');
    expect(lcLabels).toContain('Preferences');

    // Relics group: slot grid inside.
    expect(groups[1].querySelector('.equip-slot-grid')).toBeInTheDocument();

    // Level and Traces sections live outside both groups.
    const grouped = new Set(
      groups.flatMap((g) => [...g.querySelectorAll<HTMLElement>('.progress-section')]),
    );
    const ungroupedLabels = [...container.querySelectorAll<HTMLElement>('.progress-section')]
      .filter((s) => !grouped.has(s))
      .map((s) => s.querySelector('.section-header span')?.textContent);
    expect(ungroupedLabels).toContain('Level');
    expect(ungroupedLabels).toContain('Traces');
  });

  it('renders the Target Build readout inside the Relics group', () => {
    const char = makeChar({
      buildPreferences: {
        ...emptyPrefs,
        subStats: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
      },
    });
    const { container } = render(<CharacterCard char={char} {...defaultProps} />);
    const relicsGroup = [...container.querySelectorAll<HTMLElement>('.card-section-group')][1];
    expect(relicsGroup.querySelector('.build-prefs-display')).toBeInTheDocument();
  });

  it('fires onEditLightConePrefs when the preferences launcher is clicked', () => {
    const onEditLightConePrefs = vi.fn();
    render(
      <CharacterCard
        char={makeChar()}
        {...defaultProps}
        onEditLightConePrefs={onEditLightConePrefs}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Preferences' }));
    expect(onEditLightConePrefs).toHaveBeenCalledWith('char-1');
  });

  it('shows the ranked count on the Preferences section when preferences exist', () => {
    const char = makeChar({ lightConePreferences: ['23024', '21001'] });
    render(<CharacterCard char={char} {...defaultProps} />);
    expect(screen.getByText('2 ranked')).toBeInTheDocument();
  });

  it('calls onUpdateLightCone when a cone is selected', () => {
    const onUpdateLightCone = vi.fn();
    const { container } = render(
      <CharacterCard char={makeChar()} {...defaultProps} onUpdateLightCone={onUpdateLightCone} />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    const select = container.querySelector<HTMLSelectElement>('select[name="light-cone-char-1"]')!;
    fireEvent.change(select, { target: { value: '23024' } });
    expect(onUpdateLightCone).toHaveBeenCalledWith('char-1', '23024');
  });

  it('calls onUpdateLightCone with null when the selection is cleared', () => {
    const onUpdateLightCone = vi.fn();
    const { container } = render(
      <CharacterCard
        char={makeChar({ lightConeId: '23024' })}
        {...defaultProps}
        onUpdateLightCone={onUpdateLightCone}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    const select = container.querySelector<HTMLSelectElement>('select[name="light-cone-char-1"]')!;
    fireEvent.change(select, { target: { value: '' } });
    expect(onUpdateLightCone).toHaveBeenCalledWith('char-1', null);
  });

  it('calls onUpdateLightConeLevel when the cone level slider changes', () => {
    const onUpdateLightConeLevel = vi.fn();
    render(
      <CharacterCard
        char={makeChar()}
        {...defaultProps}
        onUpdateLightConeLevel={onUpdateLightConeLevel}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.change(screen.getAllByRole('slider')[1], { target: { value: '70' } });
    expect(onUpdateLightConeLevel).toHaveBeenCalledWith('char-1', 70);
  });

  it('calls onUpdateLightConeSuperimposition when a rank button is clicked', () => {
    const onUpdateLightConeSuperimposition = vi.fn();
    render(
      <CharacterCard
        char={makeChar()}
        {...defaultProps}
        onUpdateLightConeSuperimposition={onUpdateLightConeSuperimposition}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'S5' }));
    expect(onUpdateLightConeSuperimposition).toHaveBeenCalledWith('char-1', 5);
  });
});
