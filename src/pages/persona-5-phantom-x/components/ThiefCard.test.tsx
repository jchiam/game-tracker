import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThiefCard } from './ThiefCard';
import type { P5xTrackedThief } from '@/types';
import { getProgressStyle } from '@/utils/progressGradient';
import { calculateRevelationScore } from '@/utils/revelationScoring';

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
    skillProgress: 0,
    mindscapeProgress: 0,
    weaponRarity: 2,
    weaponLevel: 1,
    weaponForge: 0,
    revelations: { sun: null, moon: null, star: null, sky: null, space: null },
    revelationPreferences: {
      heavensSetId: null,
      spaceSetId: null,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
      comments: '',
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
    onUpdateMindscapeProgress: vi.fn(),
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
      <ThiefCard {...defaultProps} thief={makeThief({ skillProgress: 0 })} />,
    );
    expect(screen.queryByText('🌹 Gated')).not.toBeInTheDocument();
    expect(screen.queryByText('Skills ✓')).not.toBeInTheDocument();
    // Lv + A + weapon chips in the summary (weapon chip always present)
    expect(container.querySelectorAll('.game-card-static-stats .stat-chip')).toHaveLength(3);
  });

  it('shows the rose-gated chip only in the leveled-but-not-maxed state', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ skillProgress: 1 })} />);
    expect(screen.getByText('🌹 Gated')).toBeInTheDocument();
    expect(screen.queryByText('Skills ✓')).not.toBeInTheDocument();
  });

  it('shows the maxed chip and no rose-gated chip when rose maxed', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ skillProgress: 2 })} />);
    expect(screen.getByText('Skills ✓')).toBeInTheDocument();
    expect(screen.queryByText('🌹 Gated')).not.toBeInTheDocument();
  });

  it('selecting Lv8 reports progress 1 via onUpdateSkillProgress', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Lv8'));
    expect(defaultProps.onUpdateSkillProgress).toHaveBeenCalledWith('ann-takamaki', 1);
  });

  it('selecting Rose Lv10 reports progress 2 via onUpdateSkillProgress', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} thief={makeThief({ skillProgress: 1 })} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Rose Lv10'));
    expect(defaultProps.onUpdateSkillProgress).toHaveBeenCalledWith('ann-takamaki', 2);
  });

  it('deselecting the active skill milestone reports progress 0', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} thief={makeThief({ skillProgress: 2 })} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Rose Lv10'));
    expect(defaultProps.onUpdateSkillProgress).toHaveBeenCalledWith('ann-takamaki', 0);
  });

  it('skills section value reflects the milestone state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ThiefCard {...defaultProps} thief={makeThief({ skillProgress: 1 })} />,
    );
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Rose-gated', { selector: '.section-value' })).toBeInTheDocument();
    rerender(<ThiefCard {...defaultProps} thief={makeThief({ skillProgress: 2 })} />);
    expect(screen.getByText('Maxed', { selector: '.section-value' })).toBeInTheDocument();
  });

  // --- Mental Image ---

  it('shows MS ✓ chip when the whole tree is maxed', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ mindscapeProgress: 2 })} />);
    expect(screen.getByText('MS ✓')).toBeInTheDocument();
  });

  it('shows MS O chip when only the Outer half is maxed', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ mindscapeProgress: 1 })} />);
    expect(screen.getByText('MS O')).toBeInTheDocument();
    expect(screen.queryByText('MS ✓')).not.toBeInTheDocument();
  });

  it('shows no MS chip when mindscape is not started', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ mindscapeProgress: 0 })} />);
    expect(screen.queryByText('MS ✓')).not.toBeInTheDocument();
    expect(screen.queryByText('MS O')).not.toBeInTheDocument();
  });

  it('selecting Outer reports progress 1 via onUpdateMindscapeProgress', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Outer'));
    expect(defaultProps.onUpdateMindscapeProgress).toHaveBeenCalledWith('ann-takamaki', 1);
  });

  it('selecting Inner reports progress 2 via onUpdateMindscapeProgress', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Inner'));
    expect(defaultProps.onUpdateMindscapeProgress).toHaveBeenCalledWith('ann-takamaki', 2);
  });

  it('deselecting the active milestone reports progress 0', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} thief={makeThief({ mindscapeProgress: 2 })} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByText('Inner'));
    expect(defaultProps.onUpdateMindscapeProgress).toHaveBeenCalledWith('ann-takamaki', 0);
  });

  it('mindscape section value reflects the milestone state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ThiefCard {...defaultProps} thief={makeThief({ mindscapeProgress: 1 })} />,
    );
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Outer', { selector: '.section-value' })).toBeInTheDocument();
    rerender(<ThiefCard {...defaultProps} thief={makeThief({ mindscapeProgress: 2 })} />);
    expect(screen.getByText('Maxed', { selector: '.section-value' })).toBeInTheDocument();
  });

  // --- Weapon ---

  it('always shows the weapon chip, at default 2★ for a fresh thief', () => {
    render(<ThiefCard {...defaultProps} thief={makeThief({ weaponRarity: 2, weaponForge: 0 })} />);
    expect(screen.getByText('⚔ 2★ F0')).toBeInTheDocument();
  });

  it('shows weapon chip at the tracked rarity', () => {
    render(
      <ThiefCard
        {...defaultProps}
        thief={makeThief({ weaponRarity: 5, weaponLevel: 60, weaponForge: 4 })}
      />,
    );
    expect(screen.getByText('⚔ 5★ F4')).toBeInTheDocument();
  });

  it('rarity cannot be deselected — clicking the active rarity keeps it set', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} thief={makeThief({ weaponRarity: 2 })} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByRole('button', { name: '2★' }));
    expect(defaultProps.onUpdateWeaponRarity).toHaveBeenCalledWith('ann-takamaki', 2);
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

  it('shows no revelation chip and a Persona-only summary line when all slots are empty', () => {
    const { container } = render(<ThiefCard {...defaultProps} />);
    expect(screen.queryByText(/^Rev /)).toBeNull();
    expect(container.querySelector('.rev-set-summary')).toBeNull();
    expect(container.querySelector('.summary-divider')).toBeNull();
    expect(container.querySelector('.game-card-static-line')).toHaveTextContent('Carmen');
  });

  it('shows a Rev n/5 count chip and the set summary on the line when a bonus is active', () => {
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    const { container } = render(<ThiefCard {...defaultProps} thief={thief} />);
    // Count chip in the summary row — width independent of set names.
    expect(screen.getByText('Rev 2/5')).toBeInTheDocument();
    // Set names live on the summaryLine, not on a chip.
    expect(container.querySelector('.rev-set-summary')).toHaveTextContent('Strife 2pc');
    expect(container.querySelector('.summary-divider')).toBeInTheDocument();
  });

  it('shows the count chip but no set summary when cards are equipped without an active bonus', () => {
    // A single lone card forms no 2pc bonus and no Space set: chip shown, line Persona-only.
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: null,
        star: null,
        sky: null,
        space: null,
      },
    });
    const { container } = render(<ThiefCard {...defaultProps} thief={thief} />);
    expect(screen.getByText('Rev 1/5')).toBeInTheDocument();
    expect(container.querySelector('.rev-set-summary')).toBeNull();
    expect(container.querySelector('.summary-divider')).toBeNull();
    expect(container.querySelector('.game-card-static-line')).toHaveTextContent('Carmen');
  });

  it('renders the set summary distinct from the Persona name (score color, non-italic, divided)', () => {
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    const { container } = render(<ThiefCard {...defaultProps} thief={thief} />);
    const setSummary = container.querySelector<HTMLElement>('.rev-set-summary')!;
    const persona = container.querySelector<HTMLElement>('.persona-line')!;
    // Set summary carries the revelation gradient color inline; Persona line does not.
    const expected = getProgressStyle(2, 0, 4); // no prefs → piece-count fallback, pieces = 2
    expect(setSummary.style.color).toBe(expected.color);
    expect(persona.style.color).toBe('');
    expect(persona).toHaveTextContent('Carmen');
  });

  it('leads with the Space set, then Heavens (space-first consolidation)', () => {
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: { setId: 'strife', mainStat: 'hp-pct', subStats: [] },
        sky: { setId: 'strife', mainStat: 'speed', subStats: [] },
        space: { setId: 'meditation', mainStat: null, subStats: [] },
      },
    });
    render(<ThiefCard {...defaultProps} thief={thief} />);
    expect(screen.getAllByText('Meditation · Strife 4pc').length).toBeGreaterThanOrEqual(1);
  });

  it('shows every active set for a 2pc+2pc split (lossless, name-ordered)', () => {
    const thief = makeThief({
      revelations: {
        sun: { setId: 'power', mainStat: 'hp', subStats: [] },
        moon: { setId: 'power', mainStat: 'attack-pct', subStats: [] },
        star: { setId: 'peace', mainStat: 'hp-pct', subStats: [] },
        sky: { setId: 'peace', mainStat: 'speed', subStats: [] },
        space: null,
      },
    });
    render(<ThiefCard {...defaultProps} thief={thief} />);
    expect(screen.getAllByText('Peace 2pc · Power 2pc').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a five-cell slot grid, space-first, with active cells for equipped slots', async () => {
    const user = userEvent.setup();
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: null,
        star: null,
        sky: null,
        space: { setId: 'meditation', mainStat: null, subStats: [] },
      },
    });
    render(<ThiefCard {...defaultProps} thief={thief} />);
    await user.click(screen.getByTitle('Edit'));
    const grid = document.querySelector('.equip-slot-grid.p5x-rev-grid');
    expect(grid).not.toBeNull();
    const cells = Array.from(grid!.querySelectorAll('.equip-slot-cell'));
    expect(cells).toHaveLength(5);
    // Space-first order matches the modal's slot order.
    expect(cells.map((c) => c.getAttribute('title'))).toEqual([
      'Space',
      'Sun',
      'Moon',
      'Star',
      'Sky',
    ]);
    expect(cells[0]).toHaveClass('active');
    expect(cells[1]).toHaveClass('active');
    expect(cells[2]).not.toHaveClass('active');
    // No text readout or Edit Revelations button remains.
    expect(document.querySelector('.rev-set-readout')).toBeNull();
    expect(screen.queryByText('Edit Revelations')).toBeNull();
  });

  it('edit Revelations section shows — and all cells inactive when no card is equipped', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />); // default thief: all slots null
    await user.click(screen.getByTitle('Edit'));
    const revSection = Array.from(document.querySelectorAll('.progress-section')).find(
      (s) => s.querySelector('.section-header span')?.textContent === 'Revelations',
    );
    expect(revSection).toBeTruthy();
    expect(revSection!.querySelector('.section-value')?.textContent).toBe('—');
    expect(revSection!.querySelectorAll('.equip-slot-cell.active')).toHaveLength(0);
    expect(revSection!.querySelectorAll('.equip-slot-cell')).toHaveLength(5);
  });

  it('calls onOpenRevelations with the clicked slot', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByTitle('Star'));
    expect(defaultProps.onOpenRevelations).toHaveBeenCalledWith('ann-takamaki', 'star');
  });

  it('renders a Target Build readout when revelation preferences are set', async () => {
    const user = userEvent.setup();
    const thief = makeThief({
      revelationPreferences: {
        heavensSetId: 'strife',
        spaceSetId: null,
        mainStats: {
          moon: [{ stat: 'attack-pct', operator: '>', orderIndex: 0 }],
          star: [],
          sky: [],
        },
        subStats: [{ stat: 'crit-rate', operator: null, orderIndex: 0 }],
        comments: 'Crit build',
      },
    });
    render(<ThiefCard {...defaultProps} thief={thief} />);
    await user.click(screen.getByTitle('Edit'));
    const readout = document.querySelector('.build-prefs-display');
    expect(readout).not.toBeNull();
    expect(readout!.textContent).toContain('Sets');
    expect(readout!.textContent).toContain('Moon');
    expect(readout!.textContent).toContain('Subs');
    expect(readout!.textContent).toContain('Crit build');
    // Stat ids render as in-game labels.
    expect(readout!.textContent).toContain('Attack%');
  });

  it('renders no Target Build readout with default (empty) preferences', async () => {
    const user = userEvent.setup();
    render(<ThiefCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(document.querySelector('.build-prefs-display')).toBeNull();
  });

  it('renders the revelation chip as a fixed-width count with no width-cap class', () => {
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    const { container } = render(<ThiefCard {...defaultProps} thief={thief} />);
    const revChip = screen.getByText('Rev 2/5');
    expect(revChip).toHaveClass('stat-chip');
    // The old variable-width chip class is gone — the count chip needs no cap.
    expect(container.querySelector('.p5x-revelation-chip')).toBeNull();
  });

  // --- Fixed-height reserve + chip ordering ---

  it('opts the card into the fixed-height summary reserve', () => {
    const { container } = render(<ThiefCard {...defaultProps} />);
    expect(container.querySelector('.game-card')).toHaveClass('reserve-summary-rows');
  });

  it('orders summary chips Level → Awareness → Weapon → Mindscape → Revelations → Skills', () => {
    const thief = makeThief({
      weaponRarity: 5,
      weaponForge: 3,
      mindscapeProgress: 2,
      skillProgress: 2,
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: { setId: 'strife', mainStat: 'hp-pct', subStats: [] },
        sky: { setId: 'strife', mainStat: 'speed', subStats: [] },
        space: { setId: 'meditation', mainStat: null, subStats: [] },
      },
    });
    const { container } = render(<ThiefCard {...defaultProps} thief={thief} />);
    const labels = Array.from(container.querySelectorAll('.game-card-static-stats .stat-chip')).map(
      (c) => c.textContent,
    );
    expect(labels).toEqual(['Lv 45', 'A3', '⚔ 5★ F3', 'MS ✓', 'Rev 5/5', 'Skills ✓']);
  });

  // --- Revelation match-score badge + chip color ---

  const scoredThief = () =>
    makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
      revelationPreferences: {
        heavensSetId: 'strife',
        spaceSetId: null,
        mainStats: {
          moon: [{ stat: 'attack-pct', operator: null, orderIndex: 0 }],
          star: [],
          sky: [],
        },
        subStats: [],
        comments: '',
      },
    });

  it('renders a header score badge with a grade class when prefs + cards yield a score', () => {
    const thief = scoredThief();
    const { container } = render(<ThiefCard {...defaultProps} thief={thief} />);
    const badge = container.querySelector('.score-badge');
    expect(badge).not.toBeNull();
    expect(badge!.querySelector('.score-badge-value')!.textContent).toMatch(/^\d+%$/);
    expect(badge!.className).toMatch(/grade-[sabcd]/);
  });

  it('wears the temper edge when scored, none for the sentinel', () => {
    const scored = render(<ThiefCard {...defaultProps} thief={scoredThief()} />);
    expect(scored.container.querySelector('.game-card.has-temper-edge')).toBeInTheDocument();
    scored.unmount();
    const sentinel = render(<ThiefCard {...defaultProps} />);
    expect(sentinel.container.querySelector('.game-card.has-temper-edge')).not.toBeInTheDocument();
  });

  it('renders no score badge when the score is insufficient data (no prefs / no cards)', () => {
    // default thief: cards present would still be -1 without prefs; here no cards + no prefs
    const { container: noData } = render(<ThiefCard {...defaultProps} />);
    expect(noData.querySelector('.score-badge')).toBeNull();

    // cards equipped but no preferences → still -1 → no badge
    const cardsNoPrefs = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    const { container } = render(<ThiefCard {...defaultProps} thief={cardsNoPrefs} />);
    expect(container.querySelector('.score-badge')).toBeNull();
  });

  it('colors the revelation count chip by the match score when scored', () => {
    const thief = scoredThief();
    render(<ThiefCard {...defaultProps} thief={thief} />);
    const chip = screen.getByText('Rev 2/5');
    const expected = getProgressStyle(calculateRevelationScore(thief), 0, 100);
    expect(chip.style.color).toBe(expected.color);
    expect(chip.style.borderColor).toBe(expected.borderColor);
  });

  it('falls back to the piece-count color for the revelation chip when unscored (-1)', () => {
    // Active Strife 2pc bonus but no preferences → score -1 → piece-count gradient (pieces = 2).
    const thief = makeThief({
      revelations: {
        sun: { setId: 'strife', mainStat: 'hp', subStats: [] },
        moon: { setId: 'strife', mainStat: 'attack-pct', subStats: [] },
        star: null,
        sky: null,
        space: null,
      },
    });
    render(<ThiefCard {...defaultProps} thief={thief} />);
    const chip = screen.getByText('Rev 2/5');
    const expected = getProgressStyle(2, 0, 4);
    expect(chip.style.color).toBe(expected.color);
  });
});
