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
    skillsLeveled: false,
    roseMaxed: false,
    mindscapeMaxed: false,
    weaponRarity: null,
    weaponLevel: 1,
    weaponForge: 0,
    revelations: { sun: null, moon: null, star: null, sky: null, space: null },
    revelationPreferences: {
      heavensSetId: null,
      spaceSetId: null,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
    },
    ...overrides,
  };
}

describe('ThiefCard', () => {
  const defaultProps = {
    thief: makeThief(),
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdateAwareness: vi.fn(),
    onUpdateSkillProgress: vi.fn(),
    onToggleFavorite: vi.fn(),
    onToggleMindscapeMaxed: vi.fn(),
    onUpdateWeaponRarity: vi.fn(),
    onUpdateWeaponLevel: vi.fn(),
    onUpdateWeaponForge: vi.fn(),
    onOpenRevelations: vi.fn(),
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
    const sliders = screen.getAllByRole('slider');
    const levelSlider = sliders.find((s) => s.getAttribute('name') === 'level-ann-takamaki')!;
    expect(levelSlider).toHaveClass('level-slider');
    expect(levelSlider.style.getPropertyValue('--slider-fill-color')).toBe('rgb(138, 96, 80)');
  });

  // --- Edit body ---

  it('level slider is bounded 1–80 and reports changes', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    const sliders = screen.getAllByRole('slider');
    const levelSlider = sliders.find((s) => s.getAttribute('name') === 'level-ann-takamaki')!;
    expect(levelSlider).toHaveAttribute('min', '1');
    expect(levelSlider).toHaveAttribute('max', '80');
    fireEvent.change(levelSlider, { target: { value: '72' } });
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

  // --- Skill progress ---

  it('shows no skill chip when untouched', () => {
    const { container } = render(
      <ThiefCard {...defaultProps} thief={makeThief({ skillsLeveled: false, roseMaxed: false })} />,
    );
    expect(screen.queryByText('🌹 Gated')).not.toBeInTheDocument();
    expect(screen.queryByText('Skills ✓')).not.toBeInTheDocument();
    // only Lv + A chips in the summary
    expect(container.querySelectorAll('.game-card-static-stats .stat-chip')).toHaveLength(2);
  });

  it('shows the rose-gated chip only in the leveled-but-not-maxed state', () => {
    render(
      <ThiefCard {...defaultProps} thief={makeThief({ skillsLeveled: true, roseMaxed: false })} />,
    );
    expect(screen.getByText('🌹 Gated')).toBeInTheDocument();
    expect(screen.queryByText('Skills ✓')).not.toBeInTheDocument();
  });

  it('shows the maxed chip and no rose-gated chip when rose maxed', () => {
    render(
      <ThiefCard {...defaultProps} thief={makeThief({ skillsLeveled: true, roseMaxed: true })} />,
    );
    expect(screen.getByText('Skills ✓')).toBeInTheDocument();
    expect(screen.queryByText('🌹 Gated')).not.toBeInTheDocument();
  });

  it('skills-leveled toggle reports the change via onUpdateSkillProgress', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    const toggle = screen.getByText('Skills Leveled (Lv8)');
    await user.click(toggle); // arms confirmation
    await user.click(screen.getByText('Click to confirm'));
    expect(defaultProps.onUpdateSkillProgress).toHaveBeenCalledWith('ann-takamaki', {
      skillsLeveled: true,
    });
  });

  it('rose-maxed toggle reports the change via onUpdateSkillProgress', async () => {
    const user = userEvent.setup();
    render(
      <ThiefCard {...defaultProps} thief={makeThief({ skillsLeveled: true, roseMaxed: false })} />,
    );
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Rose Maxed (Lv10)')); // arms confirmation
    await user.click(screen.getByText('Click to confirm'));
    expect(defaultProps.onUpdateSkillProgress).toHaveBeenCalledWith('ann-takamaki', {
      roseMaxed: true,
    });
  });

  // --- Mental Image ---

  it('shows MS ✓ chip when mindscapeMaxed is true', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ mindscapeMaxed: true })} />);
    expect(screen.getByText('MS ✓')).toBeInTheDocument();
  });

  it('shows no MS chip when mindscapeMaxed is false', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ mindscapeMaxed: false })} />);
    expect(screen.queryByText('MS ✓')).not.toBeInTheDocument();
  });

  it('mindscape toggle reports the change via onToggleMindscapeMaxed', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Fully Unlocked'));
    await user.click(screen.getByText('Click to confirm'));
    expect(defaultProps.onToggleMindscapeMaxed).toHaveBeenCalledWith('ann-takamaki', true);
  });

  // --- Weapon ---

  it('shows no weapon chip when weaponRarity is null', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ weaponRarity: null })} />);
    expect(screen.queryByText(/⚔/)).not.toBeInTheDocument();
  });

  it('shows weapon chip when weaponRarity is set', () => {
    render(
      <ThiefCard
        {...defaultProps}
        thief={makeThief({ weaponRarity: 5, weaponLevel: 60, weaponForge: 4 })}
      />,
    );
    expect(screen.getByText('⚔ 5★ F4')).toBeInTheDocument();
  });

  it('renders weapon rarity, level, and forge controls in edit mode', async () => {
    const user = userEvent.setup();
    render(
      <ThiefCard
        {...defaultProps}
        thief={makeThief({ weaponRarity: 4, weaponLevel: 30, weaponForge: 2 })}
      />,
    );
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByRole('button', { name: '2★' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5★' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'F0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'F6' })).toBeInTheDocument();
    const sliders = screen.getAllByRole('slider');
    const weaponSlider = sliders.find(
      (s) => s.getAttribute('name') === 'weapon-level-ann-takamaki',
    );
    expect(weaponSlider).toHaveAttribute('min', '1');
    expect(weaponSlider).toHaveAttribute('max', '80');
  });

  it('weapon forge button reports change', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} thief={makeThief({ weaponRarity: 5, weaponForge: 0 })} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByRole('button', { name: 'F3' }));
    expect(defaultProps.onUpdateWeaponForge).toHaveBeenCalledWith('ann-takamaki', 3);
  });

  // --- Controls ---

  it('toggles favorite', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Favorite Phantom Thief'));
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('ann-takamaki', true);
  });

  it('calls onRemove with the thief id', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Remove Phantom Thief'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('ann-takamaki', expect.anything());
  });

  // --- Revelation summary chip ---

  it('shows no revelation chip when all slots are empty', () => {
    render(<ThiefCard {...defaultProps} />);
    expect(screen.queryByText(/pc/)).toBeNull();
  });

  it('shows revelation chip with Heavens set name and piece count', () => {
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'HP', subStats: [] },
        moon: { setId: 'strife', mainStat: 'ATK%', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    render(<ThiefCard {...defaultProps} thief={thief} />);
    expect(screen.getAllByText('Strife 2pc').length).toBeGreaterThanOrEqual(1);
  });

  it('appends Space set name when Heavens 4pc is complete', () => {
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'HP', subStats: [] },
        moon: { setId: 'strife', mainStat: 'ATK%', subStats: [] },
        star: { setId: 'strife', mainStat: 'HP%', subStats: [] },
        sky: { setId: 'strife', mainStat: 'Speed', subStats: [] },
        space: { setId: 'meditation', mainStat: 'ATK & DEF', subStats: [] },
      },
    });
    render(<ThiefCard {...defaultProps} thief={thief} />);
    expect(screen.getAllByText('Strife 4pc + Meditation').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onOpenRevelations when Edit Revelations button is clicked', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Edit Revelations'));
    expect(defaultProps.onOpenRevelations).toHaveBeenCalledWith('ann-takamaki');
  });
});
