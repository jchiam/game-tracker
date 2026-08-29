import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterCard } from '@/pages/neverness-to-everness/components/CharacterCard';
import type { N2ETrackedCharacter } from '@/types';

vi.mock('@/utils/cartridgeScoring', () => ({
  calculateCartridgeScore: vi.fn().mockReturnValue(-1),
  getScoreGrade: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/imagekit', () => ({
  getMugshotUrl: vi.fn((url: string) => url),
}));

vi.mock('@/data/neverness-to-everness/arcs', () => ({
  ALL_ARCS: [
    { id: 'arc-1', name: 'Test Arc', rarity: 'S', arcType: 'Burst', imageUrl: '/arc.webp' },
  ],
}));

import { calculateCartridgeScore, getScoreGrade } from '@/utils/cartridgeScoring';

const emptyPrefs: N2ETrackedCharacter['cartridgePreferences'] = {
  cartridgeId: null,
  mainStats: [],
  subStats: [],
  comments: '',
};

function makeChar(overrides: Partial<N2ETrackedCharacter> = {}): N2ETrackedCharacter {
  return {
    id: 'char-1',
    sourceId: 'char-1',
    name: 'Baicang',
    rarity: 'S',
    esperType: 'Incantation',
    arcType: 'Burst',
    roles: ['DPS'],
    imageUrl: '/assets/neverness-to-everness/characters/baicang.webp',
    dbId: 'db-1',
    isFavorited: false,
    level: 60,
    modulesConfigured: false,
    awakening: [true, true, false, false, false, false],
    arcId: null,
    arcLevel: 1,
    arcTier: 1,
    cartridgeId: null,
    cartridgeRarity: null,
    cartridgeLevel: 0,
    cartridgeMainStat: null,
    cartridgeSubStats: [],
    cartridgePreferences: emptyPrefs,
    ...overrides,
  };
}

const defaultProps = {
  onRemove: vi.fn(),
  onUpdateLevel: vi.fn(),
  onToggleModules: vi.fn(),
  onToggleAwakening: vi.fn(),
  onUpdateArc: vi.fn(),
  onUpdateCartridge: vi.fn(),
  onToggleFavorite: vi.fn(),
  onSaveCartridgePreferences: vi.fn(),
};

describe('CharacterCard', () => {
  beforeEach(() => {
    vi.mocked(calculateCartridgeScore).mockReturnValue(-1);
    vi.mocked(getScoreGrade).mockReturnValue('');
  });

  it('renders the character name', () => {
    render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(screen.getByText('Baicang')).toBeInTheDocument();
  });

  it('renders esper type badge', () => {
    render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(screen.getByText('Incantation')).toBeInTheDocument();
  });

  it('renders arc type badge', () => {
    render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(screen.getByText('Burst')).toBeInTheDocument();
  });

  it('displays level in static summary', () => {
    render(<CharacterCard character={makeChar({ level: 45 })} {...defaultProps} />);
    expect(screen.getByText('Lv 45')).toBeInTheDocument();
  });

  it('displays awakening count in static summary', () => {
    render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(screen.getByText('A 2/6')).toBeInTheDocument();
  });

  it('shows Modules ✗ in summary when not configured', () => {
    render(<CharacterCard character={makeChar({ modulesConfigured: false })} {...defaultProps} />);
    expect(screen.getByText('Modules ✗')).toBeInTheDocument();
  });

  it('shows Modules ✓ in summary when configured', () => {
    render(<CharacterCard character={makeChar({ modulesConfigured: true })} {...defaultProps} />);
    expect(screen.getByText('Modules ✓')).toBeInTheDocument();
  });

  it('calls onToggleModules after two clicks (confirm flow)', () => {
    const onToggleModules = vi.fn();
    render(
      <CharacterCard character={makeChar()} {...defaultProps} onToggleModules={onToggleModules} />,
    );
    fireEvent.click(screen.getByText('Modules Configured'));
    fireEvent.click(screen.getByText('Click to confirm'));
    expect(onToggleModules).toHaveBeenCalledWith('char-1', true);
  });

  // --- Console group ---

  it('renders a labeled Console group after the Arc section', () => {
    const { container } = render(<CharacterCard character={makeChar()} {...defaultProps} />);
    const consoleGroup = container.querySelector('.card-section-group');
    expect(consoleGroup).toBeInTheDocument();
    expect(consoleGroup?.querySelector('.card-section-group-header')?.textContent).toBe('Console');

    // Console comes after Arc in document order.
    const sectionLabels = [
      ...container.querySelectorAll<HTMLElement>('.progress-section .section-header span'),
    ].map((s) => s.textContent);
    const arcIdx = sectionLabels.indexOf('Arc');
    const cartridgeIdx = sectionLabels.indexOf('Cartridge');
    expect(arcIdx).toBeGreaterThanOrEqual(0);
    expect(cartridgeIdx).toBeGreaterThan(arcIdx);
  });

  it('orders Console sub-sections Cartridge → Modules → Target Build', () => {
    const char = makeChar({
      cartridgePreferences: {
        cartridgeId: null,
        mainStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
        subStats: [],
      },
    });
    const { container } = render(<CharacterCard character={char} {...defaultProps} />);
    const groupLabels = [
      ...container.querySelectorAll<HTMLElement>(
        '.card-section-group .progress-section .section-header span',
      ),
    ]
      .map((s) => s.textContent)
      .filter((l) => ['Cartridge', 'Modules', 'Target Build'].includes(l ?? ''));
    expect(groupLabels).toEqual(['Cartridge', 'Modules', 'Target Build']);
  });

  it('renders the Modules toggle only inside the Console group', () => {
    const { container } = render(<CharacterCard character={makeChar()} {...defaultProps} />);
    const toggle = screen.getByText('Modules Configured');
    const group = container.querySelector('.card-section-group');
    expect(group?.contains(toggle)).toBe(true);
    // Exactly one "Modules" section header exists, and it lives inside the group.
    const allModules = [
      ...container.querySelectorAll<HTMLElement>('.progress-section .section-header span'),
    ].filter((s) => s.textContent === 'Modules');
    expect(allModules).toHaveLength(1);
    expect(group?.contains(allModules[0])).toBe(true);
  });

  it('omits Target Build from the Console group when no preferences set', () => {
    const { container } = render(<CharacterCard character={makeChar()} {...defaultProps} />);
    const groupLabels = [
      ...container.querySelectorAll<HTMLElement>(
        '.card-section-group .progress-section .section-header span',
      ),
    ].map((s) => s.textContent);
    expect(groupLabels).toContain('Cartridge');
    expect(groupLabels).toContain('Modules');
    expect(groupLabels).not.toContain('Target Build');
  });

  it('never renders a score chip — the header badge is the only score surface', () => {
    vi.mocked(calculateCartridgeScore).mockReturnValue(82);
    vi.mocked(getScoreGrade).mockReturnValue('A');
    const char = makeChar({
      cartridgePreferences: {
        cartridgeId: null,
        mainStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
        subStats: [],
      },
    });
    const { container } = render(<CharacterCard character={char} {...defaultProps} />);
    expect(screen.queryByText(/^Cart \d+%$/)).not.toBeInTheDocument();
    expect(container.querySelector('.score-badge-value')?.textContent).toBe('82%');
  });

  it('wears the temper edge when scored, none for the sentinel', () => {
    vi.mocked(calculateCartridgeScore).mockReturnValue(82);
    const scored = render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(scored.container.querySelector('.game-card.has-temper-edge')).toBeInTheDocument();
    scored.unmount();
    vi.mocked(calculateCartridgeScore).mockReturnValue(-1);
    const sentinel = render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(sentinel.container.querySelector('.game-card.has-temper-edge')).not.toBeInTheDocument();
  });

  // --- Favorite ---

  it('shows filled star when favorited', () => {
    render(<CharacterCard character={makeChar({ isFavorited: true })} {...defaultProps} />);
    expect(screen.getByTitle('Unfavorite Character')).toBeInTheDocument();
  });

  it('shows empty star when not favorited', () => {
    render(<CharacterCard character={makeChar({ isFavorited: false })} {...defaultProps} />);
    expect(screen.getByTitle('Favorite Character')).toBeInTheDocument();
  });

  it('calls onToggleFavorite with true when favoriting', () => {
    const onToggleFavorite = vi.fn();
    render(
      <CharacterCard
        character={makeChar()}
        {...defaultProps}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    fireEvent.click(screen.getByTitle('Favorite Character'));
    expect(onToggleFavorite).toHaveBeenCalledWith('char-1', true);
  });

  it('calls onToggleFavorite with false when unfavoriting', () => {
    const onToggleFavorite = vi.fn();
    render(
      <CharacterCard
        character={makeChar({ isFavorited: true })}
        {...defaultProps}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    fireEvent.click(screen.getByTitle('Unfavorite Character'));
    expect(onToggleFavorite).toHaveBeenCalledWith('char-1', false);
  });

  it('favorite button has active class when favorited', () => {
    const { container } = render(
      <CharacterCard character={makeChar({ isFavorited: true })} {...defaultProps} />,
    );
    expect(container.querySelector('.favorite-btn.active')).toBeInTheDocument();
  });

  // --- Remove ---

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<CharacterCard character={makeChar()} {...defaultProps} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle('Remove Character'));
    expect(onRemove).toHaveBeenCalledWith('char-1', expect.any(Object));
  });

  // --- Edit toggle ---

  it('toggles edit body when edit button is clicked', () => {
    const { container } = render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(container.querySelector('.game-card.is-editing')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Edit'));
    expect(container.querySelector('.game-card.is-editing')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Done editing'));
    expect(container.querySelector('.game-card.is-editing')).not.toBeInTheDocument();
  });

  // --- Level slider ---

  it('calls onUpdateLevel when level slider changes', () => {
    const onUpdateLevel = vi.fn();
    render(
      <CharacterCard character={makeChar()} {...defaultProps} onUpdateLevel={onUpdateLevel} />,
    );
    const slider = document.querySelector(`input[name="level-char-1"]`) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '80' } });
    expect(onUpdateLevel).toHaveBeenCalledWith('char-1', 80);
  });

  // --- Awakening buttons ---

  it('calls onToggleAwakening with correct slot index', () => {
    const onToggleAwakening = vi.fn();
    render(
      <CharacterCard
        character={makeChar()}
        {...defaultProps}
        onToggleAwakening={onToggleAwakening}
      />,
    );
    fireEvent.click(screen.getByTitle('Toggle A3'));
    expect(onToggleAwakening).toHaveBeenCalledWith('char-1', 2);
  });

  it('renders 6 awakening buttons', () => {
    render(<CharacterCard character={makeChar()} {...defaultProps} />);
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByTitle(`Toggle A${i}`)).toBeInTheDocument();
    }
  });

  it('active awakening buttons have active class', () => {
    const { container } = render(
      <CharacterCard
        character={makeChar({ awakening: [true, true, true, false, false, false] })}
        {...defaultProps}
      />,
    );
    const buttons = container.querySelectorAll('.awakening-row .toggle-btn');
    expect(buttons[0]).toHaveClass('active');
    expect(buttons[1]).toHaveClass('active');
    expect(buttons[2]).toHaveClass('active');
    expect(buttons[3]).not.toHaveClass('active');
  });

  // --- Arc select ---

  it('calls onUpdateArc when arc dropdown changes', () => {
    const onUpdateArc = vi.fn();
    render(<CharacterCard character={makeChar()} {...defaultProps} onUpdateArc={onUpdateArc} />);
    const select = document.querySelector(`select[name="arc-char-1"]`) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'arc-1' } });
    expect(onUpdateArc).toHaveBeenCalledWith('char-1', 'arc-1', 1, 1);
  });

  it('calls onUpdateArc with null when "No Arc" is selected', () => {
    const onUpdateArc = vi.fn();
    render(
      <CharacterCard
        character={makeChar({ arcId: 'arc-1' })}
        {...defaultProps}
        onUpdateArc={onUpdateArc}
      />,
    );
    const select = document.querySelector(`select[name="arc-char-1"]`) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '' } });
    expect(onUpdateArc).toHaveBeenCalledWith('char-1', null, 1, 1);
  });

  it('calls onUpdateArc when arc level slider changes', () => {
    const onUpdateArc = vi.fn();
    render(
      <CharacterCard
        character={makeChar({ arcId: 'arc-1' })}
        {...defaultProps}
        onUpdateArc={onUpdateArc}
      />,
    );
    const slider = document.querySelector(`input[name="arc-level-char-1"]`) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '40' } });
    expect(onUpdateArc).toHaveBeenCalledWith('char-1', 'arc-1', 40, 1);
  });

  it('calls onUpdateArc when arc tier button is clicked', () => {
    const onUpdateArc = vi.fn();
    render(
      <CharacterCard
        character={makeChar({ arcId: 'arc-1' })}
        {...defaultProps}
        onUpdateArc={onUpdateArc}
      />,
    );
    fireEvent.click(screen.getByTitle('T3'));
    expect(onUpdateArc).toHaveBeenCalledWith('char-1', 'arc-1', 1, 3);
  });

  // --- Cartridge slot ---

  it('shows empty cartridge slot when no cartridge equipped', () => {
    render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(screen.getByText('+ Equip Cartridge')).toBeInTheDocument();
  });

  it('shows cartridge info when cartridge is equipped', () => {
    render(
      <CharacterCard
        character={makeChar({
          cartridgeRarity: 'S',
          cartridgeMainStat: 'ATK%',
          cartridgeLevel: 15,
          cartridgeSubStats: ['CRIT Rate', 'CRIT DMG'],
        })}
        {...defaultProps}
      />,
    );
    expect(screen.getByText('Lv15')).toBeInTheDocument();
    expect(screen.getByText('2 subs')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) =>
          el?.classList.contains('cartridge-rarity-badge') === true && el?.textContent === 'S',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) =>
          el?.classList.contains('cartridge-slot-stat') === true && el?.textContent === 'ATK%',
      ),
    ).toBeInTheDocument();
  });

  it('opens CartridgeEditorModal when cartridge slot is clicked (edit mode)', () => {
    render(<CharacterCard character={makeChar()} {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByText('+ Equip Cartridge'));
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('wires cartridge equip and preference edits from the cartridge modal', () => {
    const onUpdateCartridge = vi.fn();
    const onSaveCartridgePreferences = vi.fn();
    const char = makeChar();
    const { container } = render(
      <CharacterCard
        character={char}
        {...defaultProps}
        onUpdateCartridge={onUpdateCartridge}
        onSaveCartridgePreferences={onSaveCartridgePreferences}
      />,
    );
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByText('+ Equip Cartridge'));

    // Two-step picker: name stages locally, choosing a rarity persists
    const nameSelect = container.querySelector(
      'select[name="cartridge-name"]',
    ) as HTMLSelectElement;
    fireEvent.change(nameSelect, { target: { value: nameSelect.options[1].value } });
    fireEvent.click(container.querySelector('.rarity-btn-row button')!);
    expect(onUpdateCartridge).toHaveBeenCalledWith(
      char.id,
      expect.objectContaining({ cartridgeRarity: expect.any(String) }),
    );

    fireEvent.click(screen.getByRole('button', { name: /preferences/i }));
    const prefSelect = container.querySelector(
      'select[name="pref-cartridge-name"]',
    ) as HTMLSelectElement;
    fireEvent.change(prefSelect, { target: { value: prefSelect.options[1].value } });
    expect(onSaveCartridgePreferences).toHaveBeenCalledWith(char.id, expect.any(Object));
  });

  it('closing CartridgeEditorModal fires onEditCommit (release point)', () => {
    const onEditCommit = vi.fn();
    render(<CharacterCard character={makeChar()} {...defaultProps} onEditCommit={onEditCommit} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByText('+ Equip Cartridge'));
    onEditCommit.mockClear(); // ignore any commit from toggling edit mode
    fireEvent.click(document.querySelector('.close-btn')!);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(onEditCommit).toHaveBeenCalledTimes(1);
  });

  // --- Cartridge score badge ---

  it('does not show cartridge score badge when no preferences set', () => {
    const { container } = render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(container.querySelector('.score-badge')).not.toBeInTheDocument();
  });

  it('shows cartridge score badge when preferences exist and score >= 0', () => {
    vi.mocked(calculateCartridgeScore).mockReturnValue(75);
    vi.mocked(getScoreGrade).mockReturnValue('A');
    const char = makeChar({
      cartridgePreferences: {
        cartridgeId: null,
        mainStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
        subStats: [],
      },
    });
    const { container } = render(<CharacterCard character={char} {...defaultProps} />);
    const badge = container.querySelector('.score-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('grade-a');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  // --- Target Build display ---

  it('shows target build when cartridge preferences are set', () => {
    const char = makeChar({
      cartridgePreferences: {
        cartridgeId: null,
        mainStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
        subStats: [{ stat: 'CRIT Rate', operator: '>=', orderIndex: 0 }],
        comments: 'Prioritize crit',
      },
    });
    render(<CharacterCard character={char} {...defaultProps} />);
    expect(screen.getByText('ATK%')).toBeInTheDocument();
    expect(screen.getByText('CRIT Rate')).toBeInTheDocument();
    expect(screen.getByText('Prioritize crit')).toBeInTheDocument();
  });

  it('wraps the cartridge slot and Target Build in shared ProgressSections', () => {
    const char = makeChar({
      cartridgePreferences: {
        cartridgeId: null,
        mainStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
        subStats: [],
      },
    });
    const { container } = render(<CharacterCard character={char} {...defaultProps} />);
    const sectionLabels = [...container.querySelectorAll('.progress-section .section-header')].map(
      (h) => h.querySelector('span')?.textContent,
    );
    expect(sectionLabels).toContain('Cartridge');
    expect(sectionLabels).toContain('Target Build');
    // Readout renders via the shared Target Build classes.
    expect(container.querySelector('.build-prefs-display .prefs-display-grid')).toBeInTheDocument();
    expect(container.querySelector('.cartridge-target-build')).not.toBeInTheDocument();
  });

  it('renders the level and arc sliders as shared LevelSliders with gradient fill', () => {
    const { container } = render(
      <CharacterCard character={makeChar({ arcId: 'arc-1' })} {...defaultProps} />,
    );
    const sliders = container.querySelectorAll<HTMLInputElement>('input.level-slider');
    expect(sliders).toHaveLength(2);
    for (const slider of sliders) {
      expect(slider.type).toBe('range');
      expect(slider.style.getPropertyValue('--slider-fill-color')).not.toBe('');
    }
  });

  it('renders >= operator as ≥ in target build', () => {
    const char = makeChar({
      cartridgePreferences: {
        cartridgeId: null,
        mainStats: [{ stat: 'ATK%', operator: '>=', orderIndex: 0 }],
        subStats: [],
      },
    });
    render(<CharacterCard character={char} {...defaultProps} />);
    expect(screen.getByText('≥')).toBeInTheDocument();
  });

  // --- Image fallback ---

  it('falls back to ui-avatars when character image fails to load', () => {
    render(<CharacterCard character={makeChar()} {...defaultProps} />);
    const img = screen.getByAltText('Baicang');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
  });

  // --- Arc name in static summary ---

  it('shows arc name in static summary when arc is equipped', () => {
    render(<CharacterCard character={makeChar({ arcId: 'arc-1' })} {...defaultProps} />);
    expect(screen.getByText('Test Arc')).toBeInTheDocument();
  });

  it('shows dash when no arc and no cartridge equipped', () => {
    const { container } = render(<CharacterCard character={makeChar()} {...defaultProps} />);
    expect(container.querySelector('.no-equip')).toBeInTheDocument();
  });
});
