import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentCard } from './AgentCard';
import type { ZzzTrackedAgent } from '@/types';

const emptyDiscs: ZzzTrackedAgent['discs'] = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

const baseAgent: ZzzTrackedAgent = {
  id: '1011',
  name: 'Anby',
  rarity: 3,
  specialty: 'Stun',
  element: 'Elec',
  imageUrl: '/assets/zenless-zone-zero/agents/1011.webp',
  dbId: 'db-1',
  isFavorited: false,
  level: 45,
  mindscape: 2,
  coreSkill: 4,
  discs: { ...emptyDiscs },
  buildPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
};

describe('AgentCard', () => {
  const defaultProps = {
    agent: baseAgent,
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdateMindscape: vi.fn(),
    onUpdateCoreSkill: vi.fn(),
    onToggleFavorite: vi.fn(),
    onToggleDisc: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name and rarity/specialty/element badges with mapped labels', () => {
    const { container } = render(<AgentCard {...defaultProps} />);
    expect(screen.getByText('Anby')).toBeInTheDocument();
    expect(container.querySelector('.zzz-rarity-a')?.textContent).toBe('A');
    expect(screen.getByText('Stun').className).toBe(
      'game-badge zzz-specialty-badge zzz-specialty-stun',
    );
    // Verbatim catalog code `Elec` renders with the display label `Electric`.
    expect(screen.getByText('Electric').className).toBe(
      'game-badge zzz-element-badge zzz-element-elec',
    );
  });

  it('maps exact element codes to display labels and modifiers', () => {
    render(
      <AgentCard {...defaultProps} agent={{ ...baseAgent, element: 'AuricEther', rarity: 4 }} />,
    );
    expect(screen.getByText('S').className).toBe('game-badge zzz-rarity-badge zzz-rarity-s');
    expect(screen.getByText('Auric Ink').className).toBe(
      'game-badge zzz-element-badge zzz-element-auric-ink',
    );
  });

  it('renders an unknown element verbatim with the neutral fallback class', () => {
    render(<AgentCard {...defaultProps} agent={{ ...baseAgent, element: 'NewElement' }} />);
    expect(screen.getByText('NewElement').className).toBe(
      'game-badge zzz-element-badge zzz-element-unknown',
    );
  });

  it('renders an unknown rarity code and specialty with the neutral fallback classes', () => {
    const { container } = render(
      <AgentCard {...defaultProps} agent={{ ...baseAgent, rarity: 5, specialty: 'NewSpec' }} />,
    );
    expect(container.querySelector('.zzz-rarity-unknown')?.textContent).toBe('5');
    expect(screen.getByText('NewSpec').className).toBe(
      'game-badge zzz-specialty-badge zzz-specialty-unknown',
    );
  });

  it('renders level, mindscape, and core skill summary chips', () => {
    render(<AgentCard {...defaultProps} />);
    expect(screen.getByText('Lv 45')).toBeInTheDocument();
    expect(screen.getAllByText('M2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Core C')).toBeInTheDocument();
  });

  it('shows a locked core skill as —', () => {
    render(<AgentCard {...defaultProps} agent={{ ...baseAgent, coreSkill: 0 }} />);
    expect(screen.getByText('Core —')).toBeInTheDocument();
  });

  it('shows an out-of-range core skill as —', () => {
    render(<AgentCard {...defaultProps} agent={{ ...baseAgent, coreSkill: 7 }} />);
    expect(screen.getByText('Core —')).toBeInTheDocument();
  });

  it('updates level via the slider', () => {
    const { container } = render(<AgentCard {...defaultProps} />);
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.max).toBe('60');
    fireEvent.change(slider, { target: { value: '60' } });
    expect(defaultProps.onUpdateLevel).toHaveBeenCalledWith('1011', 60);
  });

  it('calls onRemove from the remove control', async () => {
    const user = userEvent.setup();
    render(<AgentCard {...defaultProps} />);
    await user.click(screen.getByTitle('Remove Agent'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('1011', expect.any(Object));
  });

  // The edit body is aria-hidden until the edit toggle is clicked.
  async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByTitle('Edit'));
  }

  it('calls onUpdateMindscape when a mindscape rung is clicked', async () => {
    const user = userEvent.setup();
    render(<AgentCard {...defaultProps} />);
    await enterEditMode(user);
    await user.click(screen.getByRole('button', { name: 'M6' }));
    expect(defaultProps.onUpdateMindscape).toHaveBeenCalledWith('1011', 6);
  });

  it('calls onUpdateCoreSkill when a core skill rung is clicked', async () => {
    const user = userEvent.setup();
    render(<AgentCard {...defaultProps} />);
    await enterEditMode(user);
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(defaultProps.onUpdateCoreSkill).toHaveBeenCalledWith('1011', 6);
  });

  it('deselecting the active core skill rung returns 0', async () => {
    const user = userEvent.setup();
    render(<AgentCard {...defaultProps} />);
    await enterEditMode(user);
    await user.click(screen.getByRole('button', { name: 'C' }));
    expect(defaultProps.onUpdateCoreSkill).toHaveBeenCalledWith('1011', 0);
  });

  it('calls onToggleFavorite from the favorite control', async () => {
    const user = userEvent.setup();
    const { container } = render(<AgentCard {...defaultProps} />);
    const favoriteBtn = container.querySelector('.favorite-btn') as HTMLButtonElement;
    await user.click(favoriteBtn);
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('1011', true);
  });

  // --- Drive Discs ---

  const agentWithGear = (): ZzzTrackedAgent => ({
    ...baseAgent,
    discs: {
      ...emptyDiscs,
      1: { suitId: '31000', mainStat: 'HP', subStats: [] },
      4: { suitId: '31000', mainStat: 'CRIT Rate', subStats: ['ATK%'] },
      5: { suitId: '31600', mainStat: 'ATK%', subStats: [] },
    },
    buildPreferences: {
      mainStats: { 4: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }], 5: [], 6: [] },
      subStats: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
      discSuit4Id: '31000',
      discSuit2Id: '31600',
      comments: 'stun crit',
    },
  });

  it('hides the score badge on the -1 sentinel (no preferences)', () => {
    const { container } = render(<AgentCard {...defaultProps} />);
    expect(container.querySelector('.score-badge')).toBeNull();
  });

  it('shows the score badge when preferences and discs are set', () => {
    const { container } = render(<AgentCard {...defaultProps} agent={agentWithGear()} />);
    expect(container.querySelector('.score-badge')).not.toBeNull();
  });

  it('renders the suit digest line with short names and counts', () => {
    render(<AgentCard {...defaultProps} agent={agentWithGear()} />);
    // 31000 = Woodpecker Electro ×2, 31600 = Swing Jazz ×1, sorted by count.
    expect(screen.getByText('Woodpecker 2')).toBeInTheDocument();
    expect(screen.getByText('Swing 1')).toBeInTheDocument();
  });

  it('renders an em-dash digest when no discs are equipped', () => {
    const { container } = render(<AgentCard {...defaultProps} />);
    expect(container.querySelector('.no-equip')?.textContent).toBe('—');
  });

  it('renders six disc slot cells and reports clicks with the numeric slot', async () => {
    const user = userEvent.setup();
    const { container } = render(<AgentCard {...defaultProps} agent={agentWithGear()} />);
    await user.click(screen.getByTitle('Edit'));
    const cells = container.querySelectorAll('.equip-slot-cell');
    expect(cells).toHaveLength(6);
    await user.click(cells[4]);
    expect(defaultProps.onToggleDisc).toHaveBeenCalledWith('1011', 5);
  });

  it('marks equipped slot cells active with the suit icon image', async () => {
    const user = userEvent.setup();
    const { container } = render(<AgentCard {...defaultProps} agent={agentWithGear()} />);
    await user.click(screen.getByTitle('Edit'));
    expect(container.querySelectorAll('.equip-slot-cell.active')).toHaveLength(3);
    expect(container.querySelectorAll('.equip-slot-img')).toHaveLength(3);
  });

  it('hides the Target Build readout when no preference is set', async () => {
    const user = userEvent.setup();
    const { container } = render(<AgentCard {...defaultProps} />);
    await user.click(screen.getByTitle('Edit'));
    expect(container.querySelector('.build-prefs-display')).toBeNull();
  });

  it('shows the Target Build readout with suit badges, chains, and comments', async () => {
    const user = userEvent.setup();
    const { container } = render(<AgentCard {...defaultProps} agent={agentWithGear()} />);
    await user.click(screen.getByTitle('Edit'));
    expect(container.querySelector('.build-prefs-display')).not.toBeNull();
    const suitBadges = [...container.querySelectorAll('.pref-stat-badge')].map(
      (el) => el.textContent,
    );
    expect(suitBadges).toContain('Woodpecker Electro');
    expect(suitBadges).toContain('Swing Jazz');
    expect(screen.getByText('stun crit')).toBeInTheDocument();
  });
});
