import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentCard } from './AgentCard';
import type { ZzzTrackedAgent } from '@/types';

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
};

describe('AgentCard', () => {
  const defaultProps = {
    agent: baseAgent,
    onRemove: vi.fn(),
    onUpdateLevel: vi.fn(),
    onUpdateMindscape: vi.fn(),
    onUpdateCoreSkill: vi.fn(),
    onToggleFavorite: vi.fn(),
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
});
